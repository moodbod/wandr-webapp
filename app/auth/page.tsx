import { AuthScreen } from "@/components/auth/auth-screen";
import { isAuthenticated } from "@/lib/auth-server";
import { sanitizeRedirectPath } from "@/lib/trip-intents";
import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectPath = sanitizeRedirectPath(params.redirect ?? null);

  if (await isAuthenticated()) {
    redirect(redirectPath);
  }

  return <AuthScreen />;
}
