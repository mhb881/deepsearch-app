// src/components/auth/sign-in-modal.tsx
"use client";

import { AuthModal } from "./auth-modal";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal = ({ isOpen, onClose }: SignInModalProps) => {
  return <AuthModal isOpen={isOpen} onClose={onClose} defaultMode="signin" />;
};
