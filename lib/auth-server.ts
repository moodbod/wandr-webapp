import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  fetchAuthAction,
  fetchAuthMutation,
  fetchAuthQuery,
  getToken,
  handler,
  isAuthenticated,
  preloadAuthQuery,
} = convexBetterAuthNextJs({
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
});
