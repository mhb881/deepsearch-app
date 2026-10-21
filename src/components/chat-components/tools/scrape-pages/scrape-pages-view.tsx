// src/components/chat-components/tools/scrape-pages/scrape-pages-view.tsx
import { AlertTriangle } from "lucide-react";

import type { ScrapePagesOutput } from "../types";
import { ScrapePageItem } from "./scrape-page-item";

interface ScrapePagesViewProps {
  output: ScrapePagesOutput;
}

export function ScrapePagesView({ output }: ScrapePagesViewProps) {
  const results = output.results ?? [];
  const successCount = results.filter((r) => r.success).length;

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <span>
            已解析 {results.length} 个页面 ({successCount}/{results.length}{" "}
            成功)
          </span>
        </div>
        {output.error && (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3" />
            部分失败
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {results.map((item, index) => (
          <ScrapePageItem key={`${item.url}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
