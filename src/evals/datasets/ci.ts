/**
 * src/evals/datasets/ci.dataset.ts
 * CI 门禁评测集（规模 50~200 条）
 * 聚焦系统高频核心功能、通用知识检索与稳定性验证用例
 */
import type { EvalDatasetItem } from "./types";

// ⭐️ 导出强类型 CI 门禁评测集
export const ciDataset: EvalDatasetItem[] = [
  {
    input: "法国的首都是哪里？",
    expected: "巴黎（Paris）是法国的首都。",
    category: "ci",
  },
  {
    input: "React 19 是在哪一年正式发布的？",
    expected: "React 19 正式版于 2024 年 12 月发布。",
    category: "ci",
  },
  {
    input: "地球上现存体积最大的哺乳动物是什么？",
    expected: "蓝鲸是地球上现存体积最大的哺乳动物。",
    category: "ci",
  },
];
