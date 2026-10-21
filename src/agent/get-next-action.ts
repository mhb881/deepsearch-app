import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";

import { getLanguageModel } from "../lib/ai/model";
import type { SystemContext } from "./system-context";

export const actionSchema = z.object({
  type: z.enum(["search", "scrape", "answer"]).describe(
    `The type of action to take.
- 'search': Search the web for more information.
- 'scrape': Scrape a URL.
- 'answer': Answer the user's question and complete the loop.`,
  ),
  query: z
    .string()
    .describe("The query to search for. Required if type is 'search'.")
    .optional(),
  urls: z
    .array(z.string())
    .describe("The URLs to scrape. Required if type is 'scrape'.")
    .optional(),
});

export type Action = z.infer<typeof actionSchema>;

export function toAction(raw: Action): Action | null {
  if (raw.type === "search")
    return raw.query?.trim()
      ? { type: "search", query: raw.query.trim() }
      : null;
  if (raw.type === "scrape")
    return raw.urls?.length ? { type: "scrape", urls: raw.urls } : null;
  return { type: "answer" };
}

/** -------------------------------------------------------------------- */

/**
 * Matt pocock 原版的
 * 问题所在： 如果 Agent 在前两步抓取了 3 篇官方技术文档，每篇长达 1 万 Token。
 * 第 3 步让 Planner 决定“下一步做什么”时，你每次都要塞进 3 万+ Token 的完整网页内容！
 */
// function buildPrompt(context: SystemContext): string {
//   return [
//     `## The user's question`,
//     context.getInitialQuestion(), // 🔑 必须有
//     ``,
//     `## Progress`,
//     `Step ${context.getStep()} of ${context.getMaxSteps()}`, // 🔑 让模型知道还剩几步
//     ``,
//     `## Queries already tried`,
//     context.getQueryList().join("\n"), // 🔑 防重复
//     ``,
//     `## URLs already scraped`,
//     context.getScrapedUrlList().join("\n"),
//     ``,
//     `## Search results so far`,
//     context.getQueryHistory(),
//     ``,
//     `## Scraped pages`,
//     context.getScrapeHistory(),
//   ].join("\n");
// }

// 系统提示词
const INSTRUCTIONS = `You are the planner of a deep research system.

Your job: given the user's question and what has been gathered so far,
choose exactly ONE next action.

Guidelines:
- Prefer to gather one more piece of evidence if you are unsure.
- But if you already have a clear, well-sourced answer, answer now.
- Do NOT repeat a query or URL that has already been tried.
- If you have tried several times without new information, choose 'answer'.
- Choose 'answer' if few steps remain and you have partial information.

Choose 'search' when you need to discover which sources exist.
Choose 'scrape' when you already have URLs worth reading in full.
Choose 'answer' when you can answer from what you have.`;

// 下一步决策函数
export const getNextAction = async (
  context: SystemContext,
): Promise<Action> => {
  const model = getLanguageModel("gemini-3.1-flash-lite-preview"); // 使用便宜的模型

  const maxAttempts = 3;
  let lastError: unknown;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await generateText({
        model,
        // ⭐️ 采用结构化输出保证模型严格返回 Action 对象
        output: Output.object({
          schema: actionSchema,
          name: "next_action",
          description: "The next action for the research agent to take.",
        }),
        // ⭐️ 静态角色设定放在 system，最大化命中 Prompt Caching
        instructions: INSTRUCTIONS,
        // ⭐️ 直接使用 SystemContext 提供的轻量决策视图（去重、进度、候选 URL，不含正文）
        prompt: context.getNextActionView(),
      });

      // 成功直接返回
      const action = toAction(result.output);
      if (action) return action;
    } catch (error) {
      lastError = error;
      if (NoObjectGeneratedError.isInstance(error)) {
        console.warn(
          `[getNextAction] NoObjectGeneratedError on attempt ${i + 1}:`,
          {
            cause: error.cause,
            text: error.text,
            finishReason: error.finishReason,
          },
        );
      } else {
        // ⭐️ 网络抖动、超时、429 等瞬态错误，记录 warning 并继续下一轮重试
        console.warn(
          `[getNextAction] Network/API error on attempt ${i + 1}/${maxAttempts}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  // 重试耗尽 → 降级为 answer（保住已有工作，而不是让整个请求失败）
  console.error("[getNextAction] exhausted, falling back to answer", {
    lastError,
  });
  return { type: "answer" };
};
