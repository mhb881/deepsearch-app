// src/components/chat-components/chat-sidebar.tsx
"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils/utils";

import { useChatContext } from "./context/chat-context";
import { UserMenu } from "./user-menu";

interface SidebarProps {
  isAuthenticated: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function Sidebar({ isAuthenticated, user }: SidebarProps) {
  const pathname = usePathname(); // ⭐️ 当前浏览器路径，例如 "/abc-123"
  const activeId = pathname.replace("/", ""); // ⭐️ 从路径中提取 chatId
  const { chats } = useChatContext(); // ⭐️ 从 context 直接拿派生好的 chats

  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-gray-50/70 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/70">
      {/* Sidebar Header */}
      <div className="border-b border-gray-200/60 p-3 dark:border-gray-800/60">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:opacity-80 dark:text-gray-100"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
              D
            </span>
            <span>DeepSearch</span>
          </Link>
          <Link
            href="/"
            className="dark:hover:bg-gray-750 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            title="New Chat"
          >
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 动态渲染列表 */}
      <div className="flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-1 overflow-y-auto p-2 dark:scrollbar-thumb-gray-700">
        <div className="px-2 py-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase dark:text-gray-500">
          Your Chats
        </div>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div key={chat.id} className="flex items-center gap-2">
              <Link
                href={`/${chat.id}`} // ⭐️ 链接进化：直观的动态路径
                className={cn(
                  "min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition focus:ring-2 focus:ring-blue-400 focus:outline-none dark:text-gray-300",
                  chat.id === activeId
                    ? "bg-gray-200/80 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/60",
                )}
              >
                <span>{chat.title}</span>
              </Link>
            </div>
          ))
        ) : (
          <div className="px-2 py-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {isAuthenticated
                ? "No chats yet. Start a new conversation!"
                : "Sign in to start chatting and save history"}
            </p>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Vercel Style User Menu (Menus) */}
      <div className="border-t border-gray-200/60 p-2 dark:border-gray-800/60">
        <UserMenu user={user} isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}

export default Sidebar;
