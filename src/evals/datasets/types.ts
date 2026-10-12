export type EvalDatasetCategory = "dev" | "ci" | "regression";

export interface EvalDatasetItem {
  /** 送入 Agent 的用户原始提问 */
  input: string;
  /** 经过专家或权威事实核准的基准真实答案（Ground Truth） */
  expected: string;
  /** 数据集所属分级 */
  category: EvalDatasetCategory;
}
