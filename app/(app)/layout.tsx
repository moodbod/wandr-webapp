import { AppShell } from "@/components/shell/app-shell";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import type { ViewerProfile } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/auth");
  }

  const viewer = (await fetchAuthQuery(
    api.users.getViewerProfile,
  )) as ViewerProfile | null;

  if (!viewer) {
    redirect("/auth");
  }

  return <AppShell viewer={viewer}>{children}</AppShell>;
}