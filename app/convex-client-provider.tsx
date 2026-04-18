"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convex: ConvexReactClient | null = null;

function getConvexClient() {
  if (!convexUrl) {
    return null;
  }

  convex ??= new ConvexReactClient(convexUrl);
  return convex;
}

export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const client = getConvexClient();

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-stone-50">
        <div className="max-w-lg rounded-3xl border border-stone-800 bg-stone-900/90 p-6 shadow-2xl">
          <p className="font-sora text-lg font-semibold">Configuration error</p>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            <code>NEXT_PUBLIC_CONVEX_URL</code> is missing for this deployment.
            Add the Convex production build step on Vercel and redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthNextjsProvider client={client}>{children}</ConvexAuthNextjsProvider>
  );
}
