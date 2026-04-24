import { AuthScreen } from "@/components/auth/auth-screen";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { sanitizeRedirectPath } from "@/lib/trip-intents";
import type { ViewerProfile } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectPath = sanitizeRedirectPath(params.redirect ?? null);
  const viewer = (await isAuthenticated())
    ? ((await fetchAuthQuery(api.users.getViewerProfile)) as ViewerProfile | null)
    : null;

  if (viewer) {
    redirect(redirectPath);
  }

  return <AuthScreen />;
}