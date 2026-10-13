import { type InferUITools, type ToolSet } from "ai";

import { scrapePages } from "./scrapePages";
import { searchWeb } from "./searchWeb";

export const tools = {
  searchWeb,
  scrapePages,
} satisfies ToolSet;
export type MyTools = InferUITools<typeof tools>;
