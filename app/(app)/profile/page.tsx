import { PageIntro } from "@/components/ui/page-intro";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import { Compass, LogOut, Settings2, UserRound } from "lucide-react";

export default async function ProfilePage() {
  const viewer = await fetchAuthQuery(api.users.getViewerProfile, {});
  const preferredActivities: string[] = viewer.preferredActivities.length
    ? viewer.preferredActivities
    : ["Wildlife", "Road trips", "Photography"];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Phase 1"
        title="Profile"
        description="User identity, preferences scaffolding, and protected account access are connected. Editable settings expand in phase 10."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <article className="surface-card-strong rounded-[2rem] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#9fe870]/60 text-[#203811]">
                <UserRound className="size-8" />
              </div>
              <div>
                <p className="eyebrow">Traveler</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#16181a]">
                  {viewer.name}
                </h2>
                <p className="mt-1 text-sm text-[#5d655f]">{viewer.email}</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-black/[0.03] px-4 py-3 text-sm font-semibold text-[#4e564f]">
              Authenticated workspace
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-black/8 bg-white/72 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3e463d]">
                <Compass className="size-4 text-[#8bd65b]" />
                Travel style
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-[#15181a]">
                {viewer.travelStyle ?? "To be set in phase 10"}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#5b635d]">
                Preference fields already exist in Convex, so we can grow into
                a fully editable profile without restructuring the data model.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-black/8 bg-white/72 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3e463d]">
                <Settings2 className="size-4 text-[#8bd65b]" />
                Preference scaffolding
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferredActivities.map((activity) => (
                  <span
                    key={activity}
                    className="rounded-full bg-[#edf7e5] px-3 py-1 text-sm font-semibold text-[#314a22]"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <aside className="surface-card rounded-[2rem] p-6">
          <div className="eyebrow">Phase Status</div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#16181a]">
            Foundations complete
          </h3>
          <p className="mt-3 text-sm leading-7 text-[#5b635d]">
            Protected routes, auth session handling, reusable layout primitives,
            and user profile storage are all in place.
          </p>

          <div className="mt-6 rounded-[1.5rem] bg-black/[0.03] p-4 text-sm leading-7 text-[#555d57]">
            Sign out is available from the sidebar and mobile header so the
            workspace behaves like a real application, not a static prototype.
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#444c43]">
            <LogOut className="size-4 text-[#8bd65b]" />
            Session controls live in the shell
          </div>
        </aside>
      </section>
    </div>
  );
}
