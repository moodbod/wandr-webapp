"use client";

import { authClient } from "@/lib/auth-client";
import { ExploreMapboxCanvas } from "@/components/explore/explore-mapbox-canvas";
import type { ViewerProfile } from "@/lib/types";
import {
  Compass,
  LogIn,
  Map,
  Route,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useState } from "react";

const navigation = [
  {
    id: "explore",
    href: "/explore",
    label: "Explore",
    icon: Compass,
    requiresAuth: false,
  },
  {
    id: "trips",
    href: "/trips",
    label: "My Trip",
    icon: Map,
    requiresAuth: true,
  },
  {
    id: "squad",
    href: "/saved",
    label: "Squad",
    icon: UsersRound,
    requiresAuth: true,
  },
  {
    id: "wallet",
    href: "/saved",
    label: "Wallet",
    icon: WalletCards,
    requiresAuth: true,
  },
  {
    id: "profile",
    href: "/profile",
    label: "Profile",
    icon: UserRound,
    requiresAuth: true,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer?: ViewerProfile | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isAuthenticated = Boolean(viewer);
  const isExploreRoute = isActivePath(pathname, "/explore");
  const plannerHref = isAuthenticated ? "/trips" : "/auth";
  const displayName = viewer?.name ?? "Traveler";
  const displayRole = viewer?.travelStyle ?? "Global Citizen";
  const initials =
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "T";

  async function handleSignOut() {
    if (!isAuthenticated) {
      return;
    }

    setIsSigningOut(true);

    try {
      await authClient.signOut();
      startTransition(() => {
        router.replace("/explore");
        router.refresh();
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main
      className={`relative px-3 py-3 lg:px-3 lg:py-3 ${
        isExploreRoute
          ? "h-screen overflow-hidden bg-transparent"
          : "min-h-screen wandr-shell-bg"
      }`}
    >
      {isExploreRoute ? (
        <>
          <ExploreMapboxCanvas className="fixed inset-0 z-0" />
          <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,225,137,0.22),transparent_0,transparent_55%),radial-gradient(circle_at_83%_12%,rgba(120,232,238,0.2),transparent_0,transparent_44%),radial-gradient(circle_at_58%_88%,rgba(159,232,112,0.08),transparent_0,transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.06))]" />
        </>
      ) : null}

      <div
        className={`relative z-10 mx-auto grid max-w-[1600px] gap-4 ${
          isExploreRoute
            ? "h-full lg:grid-cols-[220px_minmax(0,1fr)]"
            : "lg:min-h-[calc(100vh-1.5rem)] lg:grid-cols-[220px_minmax(0,1fr)]"
        } ${
          isExploreRoute ? "pointer-events-none" : ""
        }`}
      >
        <aside className="pointer-events-auto hidden rounded-[1.35rem] border border-white/50 bg-white/88 p-5 shadow-[0_12px_30px_rgba(29,36,22,0.08)] lg:flex lg:flex-col">
          <p className="text-[2rem] font-black tracking-[-0.06em] text-[#1d2019]">
            Traveler
          </p>

          <div className="mt-11 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#374151,#111827)] text-sm font-extrabold text-white">
              {initials}
            </div>
            <div>
              <p className="text-[1.1rem] font-bold leading-none tracking-[-0.03em] text-[#21241c]">
                {displayName}
              </p>
              <p className="mt-1 text-sm font-medium text-[#677062]">
                {displayRole}
              </p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navigation.map((item) => {
              const href =
                !isAuthenticated && item.requiresAuth ? "/auth" : item.href;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`pill-button flex items-center gap-3 rounded-[1rem] px-4 py-3 font-semibold ${
                    active
                      ? "bg-[#9fe870] text-[#294115]"
                      : "text-[#4f5948] hover:bg-[#f2f5ed]"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            {isAuthenticated ? (
              <Link
                href={plannerHref}
                className="pill-button flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#9fe870] px-4 py-4 font-bold text-[#294115]"
              >
                <Route className="size-4" />
                Start Planning
              </Link>
            ) : (
              <Link
                href={plannerHref}
                className="pill-button flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#9fe870] px-4 py-4 font-bold text-[#294115]"
              >
                <LogIn className="size-4" />
                Start Planning
              </Link>
            )}
          </div>
        </aside>

        <div
          className={`min-w-0 ${
            isExploreRoute
              ? "h-full overflow-hidden lg:flex lg:flex-col"
              : "pb-24 lg:flex lg:min-h-[calc(100vh-1.5rem)] lg:flex-col lg:pb-0"
          }`}
        >
          <header className="pointer-events-auto mb-4 flex items-center justify-between rounded-[1.75rem] border border-white/50 bg-white/88 px-4 py-3 shadow-[0_12px_30px_rgba(29,36,22,0.08)] lg:hidden">
            <div>
              <p className="text-sm font-semibold text-[#5b635d]">Wandr</p>
              <p className="text-lg font-semibold tracking-tight text-[#17181a]">
                {displayName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Link
                  href={plannerHref}
                  className="pill-button rounded-full bg-[#9fe870] px-4 py-2 text-sm font-semibold text-[#294115]"
                >
                  Plan
                </Link>
              ) : null}
              {isAuthenticated ? (
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="pill-button rounded-full bg-[#17181a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {isSigningOut ? "..." : "Sign out"}
                </button>
              ) : null}
              {!isAuthenticated ? (
                <Link
                  href="/auth"
                  className="pill-button rounded-full bg-[#17181a] px-4 py-2 text-sm font-semibold text-white"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          </header>

          {children}
        </div>
      </div>

      <nav className="surface-card-strong fixed inset-x-3 bottom-3 z-50 flex items-center justify-between rounded-[1.6rem] px-2 py-2 lg:hidden">
        {navigation.map((item) => {
          const href =
            !isAuthenticated && item.requiresAuth ? "/auth" : item.href;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={`${item.id}-mobile`}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.15rem] px-2 py-2 text-xs font-semibold ${
                active
                  ? "bg-[#9fe870] text-[#203811]"
                  : "text-[#566059]"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
