import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

type modelName =
  | "gemini-3.5-flash-lite"
  | "gemini-3.1-flash-lite-preview"
  | "zai-org/GLM-5.3-Flash"
  | "deepseek-ai/DeepSeek-V4.1-Flash";

/*
使用 SiliconFlow 模型生成文本示例：
model: siliconflow.chatModel(
  "Pro/deepseek-ai/DeepSeek-R1",
),
模型：
deepseek-ai/DeepSeek-V4.1-Flash
zai-org/GLM-5.3-Flash
 */
const siliconflow = createOpenAICompatible({
  name: "siliconflow",
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1",
});

export function getLanguageModel(modelName: modelName) {
  switch (modelName) {
    case "gemini-3.5-flash-lite":
      return google("gemini-3.5-flash-lite");
    case "gemini-3.1-flash-lite-preview":
      return google("gemini-3.1-flash-lite-preview");
    case "zai-org/GLM-5.3-Flash":
      return siliconflow.chatModel("zai-org/GLM-5.3-Flash");
    case "deepseek-ai/DeepSeek-V4.1-Flash":
      return siliconflow.chatModel("deepseek-ai/DeepSeek-V4.1-Flash");
    default:
      throw new Error(`Unknown model name: ${modelName}`);
  }
}

export const model = getLanguageModel("gemini-3.5-flash-lite");
export const factualityModel = getLanguageModel(
  "gemini-3.1-flash-lite-preview",
);
