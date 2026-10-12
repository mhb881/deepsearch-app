/**
 * src/server/evals/scorers/factuality.ts (事实性评测打分器)
 */
import { generateText, Output } from "ai";
import { createScorer } from "evalite";
import { z } from "zod";

import { factualityModel } from "~/lib/ai/model";

export interface CheckFactualityOptions {
  question: string;
  groundTruth: string;
  submission: string;
  judgeModel?: Parameters<typeof generateText>[0]["model"];
}

/**
 * 基于 Braintrust autoevals 模板的事实性对比函数
 */
export async function checkFactuality({
  question,
  groundTruth,
  submission,
  judgeModel = factualityModel,
}: CheckFactualityOptions) {
  const { output } = await generateText({
    model: judgeModel,
    prompt: `
You are comparing a submitted answer to an expert answer on a given question. Here is the data:
[BEGIN DATA]
************
[Question]: ${question}
************
[Expert]: ${groundTruth}
************
[Submission]: ${submission}
************
[END DATA]

Compare the factual content of the submitted answer with the expert answer. Ignore any differences in style, grammar, or punctuation.
The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. Determine which case applies. Answer the question by selecting one of the following options:
(A) The submitted answer is a subset of the expert answer and is fully consistent with it.
(B) The submitted answer is a superset of the expert answer and is fully consistent with it.
(C) The submitted answer contains all the same details as the expert answer.
(D) There is a disagreement between the submitted answer and the expert answer.
(E) The answers differ, but these differences don't matter from the perspective of factuality.
`,
    output: Output.object({
      schema: z.object({
        answer: z
          .enum(["A", "B", "C", "D", "E"])
          .describe(
            "The classification option that best describes the relationship.",
          ),
        rationale: z
          .string()
          .describe(
            "Detailed explanation justifying why this option was chosen. Be very detailed.",
          ),
      }),
    }),
  });

  // 将离散分类选项映射为标准化数值分数
  const scores: Record<string, number> = {
    A: 0.4, // 子集：事实正确但遗漏部分细节
    B: 0.6, // 超集：包含标准事实并补充额外细节
    C: 1.0, // 完全一致：细节粒度与专家答案一致
    D: 0.0, // 冲突：存在明显事实错误
    E: 1.0, // 无关差异：表述不同但不影响事实
  };

  return {
    score: scores[output.answer] ?? 0,
    metadata: {
      answer: output.answer,
      rationale: output.rationale,
    },
  };
}

/**
 * 包装为符合 Evalite 规范的通用打分器
 */
export const Factuality = createScorer<string, string, string>({
  name: "Factuality",
  scorer: async (opts) => {
    const { input, expected, output } = opts;
    if (!expected) {
      throw new Error(
        "Factuality scorer requires an expected ground truth string.",
      );
    }
    return await checkFactuality({
      question: input,
      groundTruth: expected,
      submission: output,
    });
  },
});
