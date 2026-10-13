// src/components/auth/auth-modal.tsx
"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { siDiscord, siGithub, siGoogle } from "simple-icons";

import { authClient } from "~/lib/auth-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "signin",
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <AuthModalContent
      key={defaultMode}
      initialMode={defaultMode}
      onClose={onClose}
    />
  );
}

function AuthModalContent({
  initialMode,
  onClose,
}: {
  initialMode: "signin" | "signup";
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "User",
        });

        if (signUpError) {
          setError(
            signUpError.message ||
              "Failed to create account. Please try again.",
          );
          return;
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(signInError.message || "Invalid email or password.");
          return;
        }
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (
    provider: "discord" | "github" | "google",
  ) => {
    setError(null);
    setSocialLoading(provider);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: typeof window !== "undefined" ? window.location.href : "/",
        fetchOptions: {
          onError: (ctx) => {
            setError(ctx.error.message || `Failed to sign in with ${provider}`);
            setSocialLoading(null);
          },
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Failed to sign in with ${provider}`;
      setError(message);
      setSocialLoading(null);
    }
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl duration-200 dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {mode === "signin" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "signin"
              ? "Sign in to access your chat history and continue conversations"
              : "Sign up to start saving and synchronizing your chats"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Social Logins */}
        <div className="space-y-2">
          {/* Discord */}
          <button
            type="button"
            disabled={!!socialLoading || isLoading}
            onClick={() => handleSocialSignIn("discord")}
            className="dark:hover:bg-gray-750 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {socialLoading === "discord" ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <svg
                className="h-4 w-4 text-[#5865F2]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={siDiscord.path} />
              </svg>
            )}
            <span>Continue with Discord</span>
          </button>

          {/* GitHub */}
          <button
            type="button"
            disabled={!!socialLoading || isLoading}
            onClick={() => handleSocialSignIn("github")}
            className="dark:hover:bg-gray-750 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {socialLoading === "github" ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <svg
                className="h-4 w-4 text-gray-900 dark:text-gray-100"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={siGithub.path} />
              </svg>
            )}
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
          <span className="absolute bg-white px-3 text-xs tracking-wider text-gray-400 uppercase dark:bg-gray-900">
            or continue with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !!socialLoading}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white dark:focus:ring-gray-100"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-current" />
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("signup");
                }}
                className="cursor-pointer font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("signin");
                }}
                className="cursor-pointer font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
