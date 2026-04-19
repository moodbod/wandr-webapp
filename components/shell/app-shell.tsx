"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  ExploreMapboxCanvas,
  hasExploreMapSession,
} from "@/components/explore/explore-mapbox-canvas";
import { ExploreMapStateProvider } from "@/components/explore/explore-map-state";
import type { ViewerProfile } from "@/lib/types";
import {
  Compass,
  LogIn,
  LogOut,
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
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isAuthenticated = Boolean(viewer);
  const isExploreRoute = isActivePath(pathname, "/explore");
  const shouldMountExploreMap = isExploreRoute || hasExploreMapSession();
  const plannerHref = isAuthenticated ? "/trips" : "/auth";
  const displayName = viewer?.name ?? "Traveler";
  const initials =
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "T";

  async function handleSignOut() {
    if (!isAuthenticated) return;
    setIsSigningOut(true);
    try {
      await signOut();
      startTransition(() => {
        router.replace("/explore");
        router.refresh();
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <ExploreMapStateProvider>
      <main
        className={`relative ${
          isExploreRoute
            ? "h-screen overflow-hidden bg-transparent"
            : "min-h-screen bg-[#f7f7f5]"
        }`}
      >
        {shouldMountExploreMap ? (
          <ExploreMapboxCanvas
            className="fixed inset-0 z-0"
            isAuthenticated={isAuthenticated}
            isVisible={isExploreRoute}
          />
        ) : null}

        <div
          className={`relative z-10 mx-auto grid max-w-[1600px] ${
            isExploreRoute
              ? "h-full lg:grid-cols-[240px_minmax(0,1fr)]"
              : "lg:min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]"
          } ${isExploreRoute ? "pointer-events-none" : ""}`}
        >
          {/* ─── Desktop sidebar ─── */}
          <aside className="pointer-events-auto hidden lg:flex lg:flex-col border-r border-[#e8e8e6] bg-[#fafaf8] px-3 py-4">
            {/* Brand */}
            <div className="px-3 pb-5">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9f97]">
                Wandr
              </p>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-0.5">
              {navigation.map((item) => {
                const href =
                  !isAuthenticated && item.requiresAuth ? "/auth" : item.href;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium transition-colors ${
                      active
                        ? "bg-[#ededeb] text-[#17181a]"
                        : "text-[#6b706a] hover:bg-[#f0f0ee] hover:text-[#17181a]"
                    }`}
                  >
                    <item.icon
                      className={`size-[1.1rem] ${
                        active
                          ? "text-[#17181a]"
                          : "text-[#9a9f97]"
                      }`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA */}
            <div className="mt-auto space-y-2 px-1 pt-4">
              <Link
                href={plannerHref}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9fe870] px-4 py-3 text-sm font-bold text-[#163300] shadow-sm transition-transform active:scale-[0.98]"
              >
                <Route className="size-4" />
                Plan trip
              </Link>

              {/* User footer */}
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#17181a] text-[0.6rem] font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#17181a]">
                    {displayName}
                  </p>
                </div>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="rounded-md p-1 text-[#9a9f97] transition-colors hover:text-[#17181a] disabled:opacity-50"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="rounded-md p-1 text-[#9a9f97] transition-colors hover:text-[#17181a]"
                    aria-label="Sign in"
                  >
                    <LogIn className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </aside>

          {/* ─── Main content ─── */}
          <div
            className={`min-w-0 ${
              isExploreRoute
                ? "h-full overflow-hidden lg:flex lg:flex-col"
                : "px-4 py-4 pb-24 lg:px-6 lg:pb-6"
            }`}
          >
            {/* Mobile header — non-explore only */}
            {!isExploreRoute ? (
              <header className="mb-4 flex items-center justify-between lg:hidden">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9a9f97]">
                    Wandr
                  </p>
                  <p className="text-base font-semibold text-[#17181a]">
                    {displayName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <Link
                      href={plannerHref}
                      className="rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold text-[#163300] shadow-sm"
                    >
                      Plan
                    </Link>
                  ) : (
                    <Link
                      href="/auth"
                      className="rounded-full bg-[#17181a] px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      Log in
                    </Link>
                  )}
                </div>
              </header>
            ) : null}

            {children}
          </div>
        </div>

        {/* ─── Mobile tab bar ─── */}
        <nav className="ios-tab-bar fixed inset-x-4 bottom-[calc(0.7rem+var(--safe-area-bottom))] z-50 flex items-center justify-between rounded-2xl px-2 py-1.5 lg:hidden">
          {navigation.map((item) => {
            const href =
              !isAuthenticated && item.requiresAuth ? "/auth" : item.href;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={`${item.id}-mobile`}
                href={href}
                className={`ios-tab-item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[0.68rem] font-medium ${
                  active
                    ? "ios-tab-item-active text-[#17181a]"
                    : "text-[#9a9f97]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="size-[1.35rem]" strokeWidth={active ? 2.2 : 1.6} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </ExploreMapStateProvider>
  );
}
