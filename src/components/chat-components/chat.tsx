// src/components/chat-components/chat.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Loader2, Sparkles, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";

import { ChatMessage } from "~/components/chat-components/chat-message";
import { useChatContext } from "~/components/chat-components/context/chat-context";
import { Button } from "~/components/ui/button";
import type { ChatUIMessage } from "~/lib/types/ai-types";
import { cn } from "~/lib/utils/utils";

interface ChatProps {
  userName: string;
  isAuthenticated: boolean;
  chatId: string | undefined;
  initialMessages?: ChatUIMessage[];
}

const SUGGESTIONS = [
  {
    title: "🔍 Next.js 16 & React 19 新特性",
    prompt: "深入搜索并总结 Next.js 16 与 React 19 的主要新特性和架构变化",
  },
  {
    title: "🧠 AI Agent 架构与工具循环",
    prompt: "解释现代 AI Agent 的 reasoning 循环与 tool calling 架构设计",
  },
  {
    title: "⚡ TypeScript 5.8 关键更新",
    prompt: "搜索并汇总 TypeScript 5.8 的重要改进与性能优化",
  },
  {
    title: "🌐 Deep Research 与传统 RAG",
    prompt: "对比 Deep Research 递归搜索与传统 RAG 系统的优缺点",
  },
];

export const ChatPage = ({
  userName,
  isAuthenticated,
  chatId,
  initialMessages = [],
}: ChatProps) => {
  const router = useRouter();
  const { handleCreatedChat: onChatCreated, openAuthModal } = useChatContext();
  const [createdChatId, setCreatedChatId] = useState<string | undefined>(
    undefined,
  );
  const createdChatIdRef = useRef<string | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 派生状态：优先使用服务端 prop，若无则使用本轮创建的 ID
  const activeChatId = chatId ?? createdChatId ?? undefined;

  const { messages, sendMessage, status, error, stop } = useChat<ChatUIMessage>(
    {
      messages: initialMessages,
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: {
          chatId: activeChatId,
        },
      }),
      onData: (dataPart) => {
        if (dataPart.type === "data-chat-created") {
          const newChatId = dataPart.data.chatId;
          const title = dataPart.data.title ?? "新对话";

          setCreatedChatId(newChatId);
          createdChatIdRef.current = newChatId;

          window.history.replaceState(null, "", `/${newChatId}`);
          onChatCreated({
            id: newChatId,
            title,
          });
        }
      },
      // 当 AI 生成彻底结束时触发，确保路由切换与数据刷新
      onFinish: () => {
        // 如果本轮是新建会话，此时流已结束，安全地让 Next.js Router 正式切换
        const newChatId = createdChatIdRef.current;
        if (newChatId) {
          // 使用 startTransition 标记为后台非阻塞过渡
          startTransition(() => {
            // 流结束后，正式将 Next.js 路由同步为 /${newChatId}
            // 会卸载旧页面组件，挂载新页面，不会保留旧页面的 state
            router.replace(`/${newChatId}`, {
              scroll: false,
            });
          });
        }
        router.refresh(); // 向服务器发起请求，重新获取数据、重新渲染服务端组件 RSC
      },
      onError: (err) => {
        console.error("AI stream error:", err);
        // 1. 关键：清空 ref！防止残留 chatId 污染下一次对话
        createdChatIdRef.current = undefined;

        // 2. 可选：给用户弹窗/提示，展示错误信息
        // toast.error(`生成失败：${err.message}`);

        // 3. 可选：如果你在客户端维护消息列表，可以追加一条系统错误消息
        // setMessages(prev => [...prev, { role: 'system', content: 'AI 生成失败，请重试。' }]);
      },
    },
  );

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const handleFormSubmit = async (e?: React.SubmitEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    if (!isAuthenticated) {
      openAuthModal("signin");
      return;
    }

    if (input.trim() && !isLoading) {
      const textToSend = input.trim();
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      await sendMessage({ text: textToSend });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180,
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (!isAuthenticated) {
      openAuthModal("signin");
      return;
    }
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const lastMessageIsUser =
    messages.length > 0 && messages[messages.length - 1]?.role === "user";

  return (
    <div className="bg-background flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* 消息滚动区域 */}
      <StickToBottom
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col overflow-auto",
          "[&>div]:scrollbar-thumb-muted-foreground/20 hover:[&>div]:scrollbar-thumb-muted-foreground/30 [&>div]:scrollbar-thin [&>div]:scrollbar-track-transparent",
        )}
        resize="smooth"
        initial="instant"
      >
        <StickToBottom.Content
          className="flex min-h-full flex-col"
          role="log"
          aria-label="Chat messages"
        >
          {messages.length === 0 ? (
            /* 空状态：Vercel 风格欢迎居中英雄区 */
            <div className="animate-in fade-in flex flex-1 flex-col items-center justify-center p-6 text-center duration-300">
              <div className="border-border bg-card mb-4 flex size-12 items-center justify-center rounded-2xl border shadow-xs">
                <Sparkles className="size-6 text-blue-500" />
              </div>
              <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                DeepSearch AI
              </h1>
              <p className="text-muted-foreground mt-1.5 max-w-md text-xs leading-relaxed sm:text-sm">
                实时网络深度检索、文章内容抓取提取与高质量答案合成。
              </p>

              {/* 推荐提示词卡片列表 */}
              <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(item.prompt)}
                    className="group border-border/70 bg-card/60 hover:border-border hover:bg-card flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-xs"
                  >
                    <span className="text-foreground text-xs font-semibold transition-colors group-hover:text-blue-500">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground mt-1 line-clamp-2 text-[11px] leading-relaxed">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 内容排版区域：对齐 Vercel Chatbot max-w-3xl 居中 */
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
              {messages.map((message, idx) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userName={userName}
                  isLoading={isLoading}
                  isLast={idx === messages.length - 1}
                />
              ))}

              {/* 思考中 / 连接中状态指示器：仅在客户端刚发送消息但首个 Assistant 帧尚未下发时展示 */}
              {isLoading && lastMessageIsUser && (
                <div className="animate-in fade-in flex w-full items-start gap-3 duration-200 sm:gap-4">
                  <div className="border-border/80 bg-background text-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border shadow-2xs select-none">
                    <Sparkles className="size-4 animate-pulse text-blue-500" />
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 pt-1.5 text-xs">
                    <Loader2 className="size-3.5 animate-spin text-blue-500" />
                    <span>正在思考中...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-3 text-xs">
                  请求遇到错误：{error.message}
                </div>
              )}
            </div>
          )}
        </StickToBottom.Content>
      </StickToBottom>

      {/* 底部输入框区域：对齐 Vercel Chatbot 悬浮卡片式 */}
      <div className="from-background via-background/90 shrink-0 bg-linear-to-t to-transparent pt-3 pb-4 sm:pb-6">
        <form
          onSubmit={handleFormSubmit}
          className="mx-auto w-full max-w-3xl px-4"
        >
          <div className="border-input/80 bg-card/95 focus-within:border-ring focus-within:ring-ring/20 dark:bg-card/90 relative flex flex-col rounded-2xl border p-2.5 shadow-md backdrop-blur-md transition-all focus-within:ring-2 sm:p-3">
            {/* 多行自动撑高 Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="向 DeepSearch 提出任何问题... (Enter 发送, Shift+Enter 换行)"
              rows={1}
              autoFocus
              className="text-foreground placeholder:text-muted-foreground max-h-[180px] min-h-[48px] w-full resize-none border-0 bg-transparent px-2 pt-1 pb-1 text-sm leading-relaxed focus:ring-0 focus:outline-none"
            />

            {/* 输入框底部功能栏 */}
            <div className="border-border/40 flex items-center justify-between border-t pt-2">
              <div className="text-muted-foreground flex items-center gap-1.5 pl-1 text-xs font-medium select-none">
                <Sparkles className="size-3.5 text-blue-500" />
                <span className="text-foreground font-semibold">
                  DeepSearch
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={stop}
                    className="border-border/80 hover:bg-destructive/10 hover:text-destructive size-8 cursor-pointer rounded-full"
                    title="停止生成"
                  >
                    <Square className="size-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim()}
                    className="size-8 cursor-pointer rounded-full transition-all disabled:opacity-30"
                    title="发送消息"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
