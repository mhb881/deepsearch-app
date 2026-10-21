/**
 * src/answer-question.ts
 * 独立的回答生成函数：根据搜索和抓取历史生成最终答复
 */
import { generateText } from "ai";

import { getLanguageModel } from "~/lib/ai/model";

import type { SystemContext } from "./system-context";

interface AnswerQuestionOptions {
  // 是否为达到 10 步上限后的兜底生成
  isFinal?: boolean;
}

export async function answerQuestion(
  ctx: SystemContext,
  options: AnswerQuestionOptions = {},
): Promise<string> {
  const { isFinal = false } = options;

  // 使用生成能力较强的大模型
  const model = getLanguageModel("zai-org/GLM-5.3-Flash");

  const result = await generateText({
    model,
    instructions: `You are a helpful AI assistant that answers questions based on the information gathered from web searches and scraped content.
When answering:
1. Be thorough but concise.
2. Always cite your sources using [title](url) markdown link format.
3. If you're unsure about some information, make an educated guess based on available facts.
4. Format URLs as markdown links using [title](url).
5. Never include raw URLs without link text.
${
  isFinal
    ? "Note: We may not have all the information needed to answer the question completely. Please provide your best attempt at an answer based on the available information."
    : ""
}`,
    prompt: `Question: ${ctx.getInitialQuestion()}

Based on the following context, please answer the question:

${ctx.getQueryHistory()}

${ctx.getScrapeHistory()}`,
  });

  return result.text;
}
