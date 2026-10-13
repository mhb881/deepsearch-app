// src/components/chat-components/chat-message.tsx
"use client";

import { isToolUIPart } from "ai";
import { Loader2, Sparkles } from "lucide-react";

import type { ChatUIMessage, ChatUIPart } from "~/lib/types/ai-types";

import TextPart from "./text-part";
import ToolPart from "./tool-part";

interface ChatMessageProps {
  message: ChatUIMessage;
  userName?: string;
  isLoading?: boolean;
  isLast?: boolean;
}

interface MessagePartRendererProps {
  part: ChatUIPart;
}

function MessagePartRenderer({ part }: MessagePartRendererProps) {
  // 模板字面量类型：tool-${name} 和 data-${name}
  if (isToolUIPart(part)) {
    return <ToolPart part={part} />;
  }

  if (part.type.startsWith("data-")) {
    return null;
  }

  switch (part.type) {
    case "text":
      return <TextPart part={part} />;

    case "reasoning":
    case "source-url":
    case "source-document":
    case "file":
    case "reasoning-file":
    case "step-start":
    case "custom":
      return null;

    default:
      return null;
  }
}

export const ChatMessage = ({
  message,
  userName,
  isLoading = false,
  isLast = false,
}: ChatMessageProps) => {
  const role = message.role;
  const isAI = role === "assistant";

  // 1. 用户消息：靠右对齐的圆角深色气泡 (Vercel Chatbot 风格)
  if (!isAI) {
    return (
      <div className="flex w-full justify-end">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-normal break-words shadow-xs sm:max-w-[75%]">
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return (
                <p key={index} className="leading-relaxed whitespace-pre-wrap">
                  {part.text}
                </p>
              );
            }
            return (
              <MessagePartRenderer key={`${message.id}-${index}`} part={part} />
            );
          })}
        </div>
      </div>
    );
  }

  // 计算是否有文本正在输出或已输出
  const hasText = message.parts.some(
    (p) => p.type === "text" && p.text.trim().length > 0,
  );
  // 计算最后一个有效 part
  const lastPart =
    message.parts.length > 0
      ? message.parts[message.parts.length - 1]
      : undefined;

  // 判断是否处于工具执行完成、但后续推理/生成仍在进行的待定状态
  const isToolFinishedWaitingForNext =
    isLast &&
    isLoading &&
    lastPart &&
    isToolUIPart(lastPart) &&
    lastPart.state === "output-available";

  // 2. AI 助手消息：靠左对齐，左侧带有 Sparkle 头像徽章，右侧展开图文与 Generative UI
  return (
    <div className="flex w-full flex-row items-start justify-center gap-3 sm:gap-4">
      {/* AI 头像徽章 */}
      <div className="border-border/80 bg-background text-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border shadow-2xs select-none">
        <Sparkles
          className={`size-4 text-blue-500 ${
            isLast && isLoading ? "animate-pulse" : ""
          }`}
        />
      </div>

      {/* 消息正文与 Generative UI 工具流 */}
      <div className="flex min-w-0 flex-1 flex-col pt-0.5">
        {/* 当 parts 为空数组且正在生成时，渲染平滑思考态占位，消除瞬时闪烁与空白 */}
        {message.parts.length === 0 && isLast && isLoading && (
          <div className="animate-in fade-in text-muted-foreground flex items-center gap-2 py-1 text-xs duration-200">
            <Loader2 className="size-3.5 animate-spin text-blue-500" />
            <span>正在思考中...</span>
          </div>
        )}

        {/* 历史空消息优雅兜底 */}
        {message.parts.length === 0 && !isLoading && (
          <div className="text-muted-foreground/60 py-1 text-xs italic">
            （本轮未产生回复内容）
          </div>
        )}

        {/* 渲染已到达的 parts */}
        {message.parts.map((part, index) => (
          <div key={`${message.id}-${index}`} className="w-full">
            <MessagePartRenderer part={part} />
          </div>
        ))}

        {/* 当工具执行完成、正在等待下一轮检索或撰写完整回答时渲染状态指示器 */}
        {isToolFinishedWaitingForNext && (
          <div className="animate-in fade-in text-muted-foreground mt-2 flex items-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-xs duration-200">
            <Loader2 className="size-3.5 animate-spin text-blue-500" />
            <span>
              {!hasText
                ? "已获取相关资料，正在综合阅读多方来源并撰写回答..."
                : "正在继续检索与补全更多细节..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
