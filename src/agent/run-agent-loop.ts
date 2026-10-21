/**
 * src/run-agent-loop.ts
 * 智能体自主调度主循环
 */
import type { StreamTextResult } from "ai";

import { env } from "~/env";
import { bulkCrawlWebsites } from "~/server/scraper";
import { searchSerper } from "~/server/serper";

import { answerQuestion } from "./answer-question";
import { getNextAction } from "./get-next-action";
import { SystemContext } from "./system-context";

// 执行搜索辅助函数
async function executeSearch(query: string) {
  const data = await searchSerper(
    {
      q: query,
      num: env.SEARCH_RESULT_COUNT,
    },
    undefined,
  );

  return (data.organic ?? []).map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
    date: item.date ?? "",
  }));
}

// 执行抓取辅助函数
async function executeScrape(urls: string[], ctx: SystemContext) {
  if (!urls.length) {
    throw new Error("URLs are required for scrape action");
  }
  const results = await bulkCrawlWebsites({ urls });
  if (results.success) {
    ctx.reportScrapes(
      results.results.map(({ url, result }) => ({
        url,
        result: result.data,
      })),
    );
  }
}

/**
 * 主循环函数
 */
export async function runAgentLoop(initialQuestion: string) {
  const ctx = new SystemContext({ initialQuestion });

  // 用 while 循环控制流程，上限 10 步
  while (ctx.getStep() < 10) {
    // 1. 询问模型下一步动作
    const nextAction = await getNextAction(ctx);

    if (!nextAction) {
      break;
    }

    // 2. 根据动作类型分支执行
    if (nextAction.type === "search" && nextAction.query) {
      const results = await executeSearch(nextAction.query);
      ctx.reportQueries([{ query: nextAction.query, results }]);
    } else if (nextAction.type === "scrape" && nextAction.urls?.length) {
      await executeScrape(nextAction.urls, ctx);
    } else if (nextAction.type === "answer") {
      // 3. 模型认为资料足够，主动回答并退出
      return await answerQuestion(ctx, { isFinal: false });
    }

    // 4. 步数加 1
    ctx.incrementStep();
  }

  // 5. 达到 10 步上限，强制输出最终回答作为兜底
  return await answerQuestion(ctx, { isFinal: true });
}
