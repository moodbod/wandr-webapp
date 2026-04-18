"use client";

import { ExploreMapboxCanvas } from "@/components/explore/explore-mapbox-canvas";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type AuthMode = "sign-in" | "sign-up";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    setError(null);
    setIsSubmitting(true);

    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              email,
              password,
              name: name || "Traveler",
            })
          : await authClient.signIn.email({
              email,
              password,
            });

      if (result.error) {
        setError(result.error.message ?? "Unable to continue.");
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
    <main className="relative h-screen overflow-hidden">
      <ExploreMapboxCanvas className="fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,228,136,0.16),transparent_0,transparent_26%),radial-gradient(circle_at_100%_0%,rgba(120,232,238,0.14),transparent_0,transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))]" />

      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <section className="w-full max-w-[430px] rounded-[2rem] bg-white/94 p-7 shadow-[0_24px_70px_rgba(23,28,20,0.16)] backdrop-blur-[12px] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/explore"
              className="text-sm font-semibold tracking-[-0.02em] text-[#6b7568] transition hover:text-[#20241d]"
            >
              Explore
            </Link>
            <div className="rounded-full bg-[#f2f4ee] p-1">
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className={`pill-button px-4 py-2 text-sm font-semibold ${
                  mode === "sign-in"
                    ? "bg-white text-[#171a16] shadow-[0_6px_16px_rgba(0,0,0,0.07)]"
                    : "text-[#667061]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className={`pill-button px-4 py-2 text-sm font-semibold ${
                  mode === "sign-up"
                    ? "bg-white text-[#171a16] shadow-[0_6px_16px_rgba(0,0,0,0.07)]"
                    : "text-[#667061]"
                }`}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#838b80]">
              Wandr
            </div>
            <h1 className="mt-3 text-[2rem] font-black tracking-[-0.07em] text-[#171a16]">
              {mode === "sign-in" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-[#6a7368]">
              {mode === "sign-in"
                ? "Continue planning."
                : "Start saving your route."}
            </p>
          </div>

          <form action={handleSubmit} className="mt-8 space-y-4">
            {mode === "sign-up" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#40483d]">
                  Name
                </span>
                <input
                  required
                  name="name"
                  placeholder="Traveler name"
                  className="w-full rounded-[1.1rem] border border-[#e7eadf] bg-[#f8f9f5] px-4 py-3.5 outline-none transition placeholder:text-[#97a08f] focus:border-[#9fe870] focus:bg-white"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#40483d]">
                Email
              </span>
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="traveler@wandr.app"
                className="w-full rounded-[1.1rem] border border-[#e7eadf] bg-[#f8f9f5] px-4 py-3.5 outline-none transition placeholder:text-[#97a08f] focus:border-[#9fe870] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#40483d]">
                Password
              </span>
              <input
                required
                minLength={8}
                name="password"
                type="password"
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                placeholder="At least 8 characters"
                className="w-full rounded-[1.1rem] border border-[#e7eadf] bg-[#f8f9f5] px-4 py-3.5 outline-none transition placeholder:text-[#97a08f] focus:border-[#9fe870] focus:bg-white"
              />
            </label>

            {error ? (
              <div className="rounded-[1.1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="pill-button flex w-full items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 py-3.5 font-semibold text-[#203811] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Working...
                </>
              ) : mode === "sign-in" ? (
                <>
                  Enter Wandr
                  <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
