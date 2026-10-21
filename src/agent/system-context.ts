// 1. 搜索结果数据结构定义
type QueryResultSearchResult = {
  date: string;
  title: string;
  url: string;
  snippet: string;
};

type QueryResult = {
  query: string;
  results: QueryResultSearchResult[];
};

// 2. 网页抓取结果数据结构定义
type ScrapeResult = {
  url: string;
  result: string;
};

// 3. 将单条搜索结果格式化为简洁 Markdown 的纯函数
const toQueryResult = (query: QueryResultSearchResult) => {
  return [`### ${query.date} - ${query.title}`, query.url, query.snippet].join(
    "\n\n",
  );
};

export class SystemContext {
  /**
   * The current step in the loop
   */
  private step = 0;
  private readonly maxSteps: number;

  // 保存用户原始提问
  private readonly initialQuestion: string;
  /**
   * The history of all queries searcheds
   */
  private queryHistory: QueryResult[] = [];

  /**
   * The history of all URLs scraped
   */
  private scrapeHistory: ScrapeResult[] = [];

  // 去重集合（避免重复搜/重复抓）
  private readonly queriedSet = new Set<string>();
  private readonly scrapedSet = new Set<string>();

  private readonly startedAt = Date.now();
  private tokenUsed = 0;
  private readonly tokenBudget: number;
  private readonly timeBudgetMs: number;

  constructor(opts: {
    initialQuestion: string;
    maxSteps?: number;
    tokenBudget?: number;
    timeBudgetMs?: number;
  }) {
    this.initialQuestion = opts.initialQuestion;
    this.maxSteps = opts.maxSteps ?? 10;
    this.tokenBudget = opts.tokenBudget ?? 200_000;
    this.timeBudgetMs = opts.timeBudgetMs ?? 60_000;
  }

  // 给 getNextAction 用：避免重复
  hasQueried(q: string): boolean {
    return this.queriedSet.has(q);
  }

  hasScraped(u: string): boolean {
    return this.scrapedSet.has(u);
  }

  // 不再需要外部维护 step，调用 incrementStep() 即可
  incrementStep() {
    this.step++;
  }

  // 停止条件：不止步数，还有 token 与时间预算
  shouldStop(): { stop: boolean; reason?: "max-steps" | "token" | "time" } {
    if (this.step >= this.maxSteps) return { stop: true, reason: "max-steps" };
    if (this.tokenUsed > this.tokenBudget)
      return { stop: true, reason: "token" };
    if (Date.now() - this.startedAt > this.timeBudgetMs)
      return { stop: true, reason: "time" };
    return { stop: false };
  }

  // 写入：累积 + 去重 + 截断
  reportQueries(queries: QueryResult[]) {
    for (const q of queries) {
      this.queriedSet.add(q.query);
      this.queryHistory.push(q);
    }
  }

  reportScrapes(scrapes: ScrapeResult[]) {
    for (const s of scrapes) {
      if (this.scrapedSet.has(s.url)) continue;
      this.scrapedSet.add(s.url);
      this.scrapeHistory.push(s);
    }
  }

  getInitialQuestion(): string {
    return this.initialQuestion;
  }

  getStep(): number {
    return this.step;
  }

  getMaxSteps(): number {
    return this.maxSteps;
  }

  // 已经搜索过的查询
  getQueryList(): string[] {
    return [...this.queriedSet];
  }

  // 已经抓取过的 URL
  getScrapedUrlList(): string[] {
    return [...this.scrapedSet];
  }

  /**
   * 全量视图：给最终回答用
   * 将搜索历史格式化为对大模型友好的 Markdown 文本
   */
  getQueryHistory() {
    return this.queryHistory
      .map((query) => {
        return [
          `## Query: "${query.query}"`,
          ...query.results.map(toQueryResult),
        ].join("\n\n");
      })
      .join("\n\n");
  }

  /**
   * 将网页抓取历史格式化为带 XML 标签隔离的文本
   */
  getScrapeHistory(): string {
    return this.scrapeHistory
      .map((scrape) =>
        [
          `## Scrape: "${scrape.url}"`,
          `<scrape_result>`,
          scrape.result,
          `</scrape_result>`,
        ].join("\n\n"),
      )
      .join("\n\n");
  }

  /**
   * 决策视图：只有标题与 URL，【不含正文】
   * 省 token 优化
   */
  getNextActionView(): string {
    return [
      `## Question`,
      this.initialQuestion,
      ``,
      `## Progress`,
      `Step ${this.step} / ${this.maxSteps}`,
      ``,
      `## Queries already run`,
      ...this.queryHistory.map(
        (q) => `- "${q.query}" (${q.results.length} results)`,
      ),
      ``,
      `## URLs already scraped`,
      ...[...this.scrapedSet].map((u) => `- ${u}`),
      ``,
      `## Most recent search results`,
      ...(this.queryHistory.at(-1)?.results.map(toQueryResult) ?? ["(none)"]),
    ].join("\n");
  }

  /** 调试用：让人能看到模型看到了什么 */
  debugDump() {
    return {
      step: this.step,
      tokenUsed: this.tokenUsed,
      elapsedMs: Date.now() - this.startedAt,
      queries: this.queryHistory.length,
      scrapes: this.scrapeHistory.length,
      scrapeChars: this.scrapeHistory.reduce((a, s) => a + s.result.length, 0),
    };
  }
}
