/**
 * src/evals/datasets/dev.dataset.ts
 * 本地极速研发评测集（Dev Dataset，规模 10~20 条）
 * 覆盖多跳推理、隐藏错误前提、时空时钟锚定与 Dogfooding 缺陷用例
 */

import type { EvalDatasetItem } from "./types";

export const devDataset: EvalDatasetItem[] = [
  {
    input:
      "《泰坦尼克号》的导演和《阿凡达》的导演是同一个人吗？如果是，他出生于哪个国家？",
    expected:
      "是，詹姆斯·卡梅隆执导了《泰坦尼克号》和《阿凡达》。他出生于加拿大。",
    category: "dev",
  },
  {
    input:
      "爱因斯坦获得诺贝尔物理学奖的年份，与居里夫人获得诺贝尔化学奖的年份，哪个更早？",
    expected:
      "居里夫人于 1911 年获得诺贝尔化学奖，爱因斯坦于 1921 年获得诺贝尔物理学奖，因此居里夫人获奖更早。",
    category: "dev",
  },
  {
    input: "《三国演义》的作者和《水浒传》的作者，哪一位生活在更早的朝代？",
    expected:
      "《水浒传》作者施耐庵通常被认为略早于《三国演义》作者罗贯中，两人均生活在元末明初。",
    category: "dev",
  },
];
