// src/components/auth/global-auth-modal.tsx
"use client";

import { useChatContext } from "~/components/chat-components/context/chat-context";

import { AuthModal } from "./auth-modal";

export function GlobalAuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useChatContext();

  return (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      defaultMode={authModalMode}
    />
  );
}
