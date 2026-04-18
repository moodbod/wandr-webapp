"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

type AuthMode = "sign-in" | "sign-up";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthActions();
  const mode: AuthMode =
    searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("password", {
        email,
        password,
        flow: mode === "sign-up" ? "signUp" : "signIn",
        ...(mode === "sign-up" ? { name: name || "Traveler" } : {}),
      });

      if (!result.signingIn) {
        setError("Authentication needs another step before completing.");
        return;
      }

      startTransition(() => {
        router.replace("/explore");
        router.refresh();
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while authenticating.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4 py-12">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a9f97]">
            Wandr
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#17181a]">
            {mode === "sign-in" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-1.5 text-sm text-[#71776e]">
            {mode === "sign-in"
              ? "Sign in to continue planning your trip."
              : "Create an account to start saving your route."}
          </p>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="space-y-5">
          {mode === "sign-up" ? (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1.5 block text-xs font-semibold text-[#3a3f38]"
              >
                Name
              </label>
              <input
                id="auth-name"
                required
                name="name"
                placeholder="Your name"
                className="h-12 w-full rounded-xl border border-[#e5e5e3] bg-white px-4 text-sm text-[#17181a] outline-none transition placeholder:text-[#b5b9b2] focus:border-[#17181a]"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-xs font-semibold text-[#3a3f38]"
            >
              Email
            </label>
            <input
              id="auth-email"
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-[#e5e5e3] bg-white px-4 text-sm text-[#17181a] outline-none transition placeholder:text-[#b5b9b2] focus:border-[#17181a]"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-semibold text-[#3a3f38]"
            >
              Password
            </label>
            <input
              id="auth-password"
              required
              minLength={8}
              name="password"
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              placeholder="At least 8 characters"
              className="h-12 w-full rounded-xl border border-[#e5e5e3] bg-white px-4 text-sm text-[#17181a] outline-none transition placeholder:text-[#b5b9b2] focus:border-[#17181a]"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="pill-button flex h-12 w-full items-center justify-center gap-2 bg-[#17181a] text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Working…
              </>
            ) : (
              <>
                {mode === "sign-in" ? "Sign in" : "Create account"}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[#71776e]">
          {mode === "sign-in"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <Link
            href={mode === "sign-in" ? "/auth?mode=sign-up" : "/auth"}
            className="font-semibold text-[#17181a] underline underline-offset-4"
          >
            {mode === "sign-in" ? "Sign up" : "Sign in"}
          </Link>
        </p>

        <div className="mt-10 text-center">
          <Link
            href="/explore"
            className="text-xs font-medium text-[#9a9f97] transition hover:text-[#17181a]"
          >
            Skip and explore →
          </Link>
        </div>
      </div>
    </main>
  );
}
