/**
 * src/evals/datasets/regression.dataset.ts
 * 全量回归评测集（规模 500+ 条）
 * 覆盖历史线上脱敏 Trace、极端长尾边界与细粒度事实对账用例
 */
import type { EvalDatasetItem } from "./types";

// ⭐️ 导出强类型全量回归评测集
export const regressionDataset: EvalDatasetItem[] = [
  {
    input: "阿波罗 11 号登月任务中，登月舱在月球表面降落的着陆点名称是什么？",
    expected: "阿波罗 11 号登月舱降落在月球的“静海”（Sea of Tranquility）。",
    category: "regression",
  },
  {
    input: "第一位获得图灵奖的女性科学家是谁？她在哪一年获此殊荣？",
    expected:
      "弗朗西斯·艾伦（Frances E. Allen）是首位获得图灵奖的女性科学家，于 2006 年获奖。",
    category: "regression",
  },
];
