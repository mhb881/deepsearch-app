import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const googleModel_3_5_flash = google("gemini-3.5-flash-lite");
const google_gemini_3_1_flash = google("gemini-3.1-flash-lite-preview");

/*
使用 SiliconFlow 模型生成文本示例：
model: siliconflow.chatModel(
  "Pro/deepseek-ai/DeepSeek-R1",
),
模型：
"deepseek-ai/DeepSeek-V4-Flash"
 */
const siliconflow = createOpenAICompatible({
  name: "siliconflow",
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: "https://api.siliconflow.cn/v1",
});
const siliconflowModel = siliconflow.chatModel("deepseek-ai/DeepSeek-V4-Flash");

/**
 * groq 服务商模型
 * 1. llama-3.3-70b-versatile
 * 2. qwen/qwen3.8-27b
 */
export const groqModel_Qwen3_8_27b = groq("qwen/qwen3.8-27b");

export const model = googleModel_3_5_flash;
export const factualityModel = google_gemini_3_1_flash;
