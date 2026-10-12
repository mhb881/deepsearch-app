/**
 * src/evals/initial.eval.ts
 * 生产解耦版评测执行流水线
 */
import { evalite } from "evalite";

import { askDeepSearch } from "~/deepsearch";
import { env } from "~/env";

import { ciDataset } from "./datasets/ci";
import { devDataset } from "./datasets/dev";
import { regressionDataset } from "./datasets/regression";
import { AnswerRelevancy } from "./scorers/answer-relevancy";
import { Factuality } from "./scorers/factuality";

evalite("Deep Search Eval", {
  // 1. 测试数据集：接入解耦后的强类型 Dev 研发数据集
  data: async () => {
    let selectedData = devDataset;

    if (env.EVAL_DATASET === "ci") {
      selectedData = [...devDataset, ...ciDataset];
    }

    if (env.EVAL_DATASET === "regression") {
      selectedData = [...devDataset, ...ciDataset, ...regressionDataset];
    }

    return selectedData.map((item) => ({
      input: item.input,
      expected: item.expected,
    }));
  },

  // 2. 评测执行任务：将输入字符串封装为消息对象并透传给无副作用纯函数 askDeepSearch
  task: async (input) => {
    return await askDeepSearch([
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: input }],
      },
    ]);
  },

  // 3. 组合评测流水线：结合确定性格式断言与大模型裁判事实性评估
  scorers: [
    // 维度一：确定性格式断言（必须附带 Markdown 引用链接）
    {
      name: "contains-link",
      description:
        "Assert that the model response contains at least one markdown link.",
      scorer: (opts) => {
        const containsLinks = /\[.*?\]\(https?:\/\/.*?\)/.test(opts.output);
        return containsLinks ? 1 : 0;
      },
    },
    // 维度二：语义事实性裁判（基于标准答案核对准确性）
    Factuality,
    // 维度三：答案相关性裁判（AI SDK v7 两阶段命题拆解，验证是否正面切题）
    AnswerRelevancy,
  ],
});
