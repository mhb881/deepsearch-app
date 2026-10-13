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

  /**
   * The history of all queries searched
   */
  private queryHistory: QueryResult[] = [];

  /**
   * The history of all URLs scraped
   */
  private scrapeHistory: ScrapeResult[] = [];

  shouldStop() {
    return this.step >= 10;
  }

  reportQueries(queries: QueryResult[]) {
    this.queryHistory.push(...queries);
  }

  reportScrapes(scrapes: ScrapeResult[]) {
    this.scrapeHistory.push(...scrapes);
  }

  /**
   * ⭐️ 将搜索历史格式化为对大模型友好的 Markdown 文本
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
   * ⭐️ 将网页抓取历史格式化为带 XML 标签隔离的文本
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
}
