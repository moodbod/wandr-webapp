import { ExploreDiscovery } from "@/components/explore/explore-discovery";
import { AppShell } from "@/components/shell/app-shell";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import type { ViewerProfile } from "@/lib/types";

export default async function ExplorePage() {
  const authenticated = await isAuthenticated();
  const viewer = authenticated
    ? ((await fetchAuthQuery(api.users.getViewerProfile)) as ViewerProfile | null)
    : null;
  const hasViewer = Boolean(viewer);

  return (
    <AppShell viewer={viewer}>
      <ExploreDiscovery isAuthenticated={hasViewer} />
    </AppShell>
  );
}