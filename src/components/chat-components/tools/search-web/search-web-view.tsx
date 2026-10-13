// src/components/chat-components/tools/search-web/search-web-view.tsx
"use client";

import { ExternalLink, Search } from "lucide-react";
import { useState } from "react";

import type { SearchWebResultItem } from "../types";

interface SearchWebViewProps {
  output: SearchWebResultItem[];
}

export function SearchWebView({ output }: SearchWebViewProps) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? output : output.slice(0, 3);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <Search className="size-3.5 text-blue-500" />
          <span>检索到 {output.length} 条相关结果</span>
        </div>
        {output.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
          >
            {showAll ? "收起" : `展开更多 (${output.length - 3})`}
          </button>
        )}
      </div>

      <div className="grid gap-2">
        {displayItems.map((item, i) => (
          <div
            key={`${item.link}-${i}`}
            className="group rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:border-border hover:bg-background/90"
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              <span className="line-clamp-1">{item.title}</span>
              <ExternalLink className="size-3 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
