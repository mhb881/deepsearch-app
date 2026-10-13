// src/app/(chat)/layout.tsx
import type { ReactNode } from "react";

import { GlobalAuthModal } from "~/components/auth/global-auth-modal";
import Sidebar from "~/components/chat-components/chat-sidebar";
import { ChatContextProvider } from "~/components/chat-components/context/chat-context";
import { getSession } from "~/server/auth/session";
import { getChats } from "~/server/db/chat";

async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const isAuthenticated = !!session?.user;

  const userId = session?.user?.id;

  /**
   * 由于我们使用的是 Next.js 服务器端渲染，所以获取数据的操作都要在 server component 中进行
   * 然后通过 props 传递给 client component
   */

  // ⭐️ 只在 Layout 里查一次当前用户的聊天列表
  // 动态从数据库拉取当前登录用户的会话列表
  const chats = isAuthenticated && userId ? await getChats({ userId }) : [];

  return (
    <ChatContextProvider initialChats={chats}>
      <div className="flex h-screen bg-white dark:bg-gray-950">
        {/* ⭐️ Sidebar 驻留在布局里：切换会话时不卸载、不重新挂载 */}
        <Sidebar isAuthenticated={isAuthenticated} user={session?.user} />
        {/* 右侧动态页面内容 */}
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      {/* 全局登录/注册弹窗 */}
      <GlobalAuthModal />
    </ChatContextProvider>
  );
}

export default ChatLayout;
