// src/components/chat-components/tools/scrape-pages/scrape-page-item.tsx
"use client";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useState } from "react";

import type { ScrapeResultItem } from "../types";

interface ScrapePageItemProps {
  item: ScrapeResultItem;
}

export function ScrapePageItem({ item }: ScrapePageItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  let hostname = item.url;
  try {
    hostname = new URL(item.url).hostname;
  } catch {
    // 降级使用原始 url
  }

  const charCount = item.data?.length ?? 0;

  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-2.5 transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs font-medium text-foreground hover:text-blue-500 hover:underline transition-colors"
            title={item.url}
          >
            {hostname}
          </a>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.success ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              成功 (约{" "}
              {charCount > 1000
                ? `${(charCount / 1000).toFixed(1)}k`
                : charCount}{" "}
              字)
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              抓取失败
            </span>
          )}

          {item.success && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <span>{isExpanded ? "收起" : "预览"}</span>
              {isExpanded ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 展开的 Markdown 正文预览 */}
      {isExpanded && item.success && (
        <div className="mt-2 rounded-lg border border-border/60 bg-muted/40 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-medium">
              <FileText className="size-3" />
              抓取正文预览 (Markdown)
            </span>
            <span>{charCount} 字符</span>
          </div>
          <pre className="max-h-44 overflow-y-auto font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap text-foreground/90">
            {item.data}
          </pre>
        </div>
      )}

      {/* 失败时的提示 */}
      {!item.success && (
        <div className="mt-1.5 rounded-lg bg-destructive/10 p-2 text-[11px] text-destructive">
          {item.data || "抓取网页正文失败"}
        </div>
      )}
    </div>
  );
}
