import { AdminPanel } from "@/components/admin/admin-panel";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import type { ViewerProfile } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const viewer = (await fetchAuthQuery(api.users.getViewerProfile)) as ViewerProfile | null;

  if (!viewer || viewer.role !== "admin") {
    redirect("/trips");
  }

  return <AdminPanel />;
}