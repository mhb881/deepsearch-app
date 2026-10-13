// src/components/chat-components/user-menu.tsx
"use client";

import { ChevronsUpDown, LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "~/lib/auth-client";

import { useChatContext } from "./context/chat-context";

interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  isAuthenticated: boolean;
}

export function UserMenu({ user, isAuthenticated }: UserMenuProps) {
  const router = useRouter();
  const { openAuthModal } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    openAuthModal("signin");
  };

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* Dropdown Menu (Menus) */}
      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl transition-all dark:border-gray-800 dark:bg-gray-900">
          {isAuthenticated ? (
            <>
              {/* User Header */}
              <div className="px-2.5 py-2">
                <div className="text-[11px] font-medium tracking-wider text-gray-400 uppercase dark:text-gray-500">
                  Signed in as
                </div>
                <div className="mt-0.5 truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                  {user?.email || user?.name || "User"}
                </div>
              </div>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {/* Log out item */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              {/* Guest Header */}
              <div className="px-2.5 py-2">
                <div className="text-[11px] font-medium tracking-wider text-gray-400 uppercase dark:text-gray-500">
                  Account
                </div>
                <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                  Sign in to save your chats
                </div>
              </div>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {/* Log in item */}
              <button
                type="button"
                onClick={handleLoginClick}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-800 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <LogIn className="h-4 w-4 text-blue-500" />
                <span>Log in</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl p-2 text-left transition hover:bg-gray-100 focus:outline-none dark:hover:bg-gray-800"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {isAuthenticated && user?.image ? (
            <Image
              src={user.image}
              alt={user.name || "User avatar"}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />
          ) : isAuthenticated ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-xs">
              {user?.name?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "U"}
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <User className="h-4 w-4" />
            </div>
          )}

          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
              {isAuthenticated ? user?.name || "User" : "Sign in"}
            </span>
            <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
              {isAuthenticated ? user?.email || "" : "Guest"}
            </span>
          </div>
        </div>

        <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-600 dark:group-hover:text-gray-300" />
      </button>
    </div>
  );
}
