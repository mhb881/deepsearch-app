// src/components/chat-components/tool-part.tsx
"use client";

import { type DynamicToolUIPart, getToolName, type ToolUIPart } from "ai";
import { Ban, CheckCircle2, Loader2, PauseCircle, XCircle } from "lucide-react";

import type { MyTools } from "~/lib/ai-tools/tools";

import { getToolMeta, ToolOutputDisplay } from "./tools";

type AnyToolPart = ToolUIPart<MyTools> | DynamicToolUIPart;

/**
 * ToolPart: AI 工具调用生命周期壳层组件
 * 职责：专职处理 Vercel AI SDK 的状态机变化（流式输入、准备执行、等待审批、报错、完成），
 * 并将具体的工具展示分发至 tools/ 子系统。
 */
function ToolPart({ part }: { part: AnyToolPart }) {
  const toolName = getToolName(part);
  const { label, icon: ToolIcon } = getToolMeta(toolName);

  switch (part.state) {
    case "input-streaming":
      return (
        <div className="my-1.5 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <Loader2 className="size-3.5 animate-spin text-amber-600 dark:text-amber-400" />
          <span>正在分析需要检索或调用的工具…</span>
        </div>
      );

    case "input-available":
      return (
        <div className="my-1.5 flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>
              正在调用 <span className="font-semibold">{label}</span>
              <span className="ml-1 text-[11px] opacity-75">({toolName})</span>
            </span>
          </div>
          <ToolIcon className="size-3.5 opacity-70" />
        </div>
      );

    case "approval-requested":
      return (
        <div className="my-1.5 flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-700 dark:text-orange-300">
          <PauseCircle className="size-3.5 text-orange-600 dark:text-orange-400" />
          <span>
            <span className="font-medium">{label}</span> 等待用户批准
          </span>
        </div>
      );

    case "approval-responded":
      return (
        <div className="border-border bg-muted/40 text-muted-foreground my-1.5 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span>
            <span className="font-medium">{label}</span> 已响应批准
          </span>
        </div>
      );

    case "output-available": {
      const output = part.output;
      return (
        <div className="border-border/80 bg-card text-card-foreground my-2 rounded-2xl border p-3.5 text-sm shadow-xs transition-all">
          <div className="border-border/60 mb-2.5 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-medium">
              <ToolIcon className="size-4 text-blue-500" />
              <span>{label}</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                ({toolName})
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>执行完成</span>
            </div>
          </div>

          {/* 展示工具输出，根据 toolName 分发至 tools/ 子系统 */}
          <ToolOutputDisplay toolName={toolName} output={output} />
        </div>
      );
    }

    case "output-error": {
      const errorText = part.errorText;
      return (
        <div className="border-destructive/20 bg-destructive/10 text-destructive my-1.5 flex items-start gap-2 rounded-xl border p-3 text-xs">
          <XCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-medium">{label}</span> 执行失败：{errorText}
          </span>
        </div>
      );
    }

    case "output-denied":
      return (
        <div className="border-border bg-muted/40 text-muted-foreground my-1.5 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs">
          <Ban className="size-3.5" />
          <span>
            <span className="font-medium">{label}</span> 已被拒绝执行
          </span>
        </div>
      );

    default:
      return null;
  }
}

export default ToolPart;
