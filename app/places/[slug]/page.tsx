import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPinned, Route, Sparkles } from "lucide-react";
import { FauxMap } from "@/components/ui/faux-map";
import { PageIntro } from "@/components/ui/page-intro";
import { explorePlaces } from "@/lib/mock-data";
import { AppShell } from "@/components/shell/app-shell";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import type { ViewerProfile } from "@/lib/types";

export default async function PlaceDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = explorePlaces.find((entry) => entry.slug === slug);

  if (!place) {
    notFound();
  }

  const authenticated = await isAuthenticated();
  const viewer = authenticated
    ? ((await fetchAuthQuery(api.users.getViewerProfile)) as ViewerProfile)
    : null;
  const tripHref = authenticated ? "/trips" : "/auth";
  const tripLabel = authenticated ? "Set this in my trip" : "Log in to set trips";

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Phase 2.5"
          title={place.title}
          description="Guests can browse place details before signing in. Planning actions still funnel into the protected trip workspace."
          actions={
            <>
              <Link
                href="/explore"
                className="pill-button inline-flex items-center justify-center gap-2 rounded-full bg-[#17181a] px-5 py-3 font-semibold text-white"
              >
                <ArrowLeft className="size-4" />
                Back to Explore
              </Link>
              <Link
                href={tripHref}
                className="pill-button inline-flex items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 py-3 font-semibold text-[#203811]"
              >
                <Route className="size-4" />
                {tripLabel}
              </Link>
            </>
          }
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_390px]">
          <FauxMap
            className="min-h-[480px]"
            markers={[
              {
                id: place.slug,
                label: place.title,
                note: place.note,
                top: place.top,
                left: place.left,
                emphasis: true,
              },
            ]}
            selectedMarkerId={place.slug}
            topBar={
              <div className="surface-card-strong inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-[#394037]">
                <MapPinned className="size-4 text-[#8bd65b]" />
                {place.region} • {place.driveTime}
              </div>
            }
          >
            <div className="absolute inset-x-5 bottom-5 rounded-[2rem] bg-[#17181a]/88 p-6 text-white">
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-white/80">
                <span className="rounded-full bg-[#9fe870] px-3 py-1 text-[#203811]">
                  {place.category}
                </span>
                <span>{place.badge}</span>
                <span>•</span>
                <span>{place.rating}</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
                {place.summary}
              </p>
            </div>
          </FauxMap>

          <aside className="space-y-4">
            <article className="surface-card-strong rounded-[2rem] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#40473f]">
                <Sparkles className="size-4 text-[#8bd65b]" />
                Why it matters
              </div>
              <p className="mt-4 text-sm leading-7 text-[#5d655f]">{place.teaser}</p>
              <div className="mt-5 space-y-3">
                {place.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-[1.5rem] border border-black/6 bg-white/70 px-4 py-3 text-sm font-semibold text-[#364034]"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6">
              <div className="eyebrow">Trip Action</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#16181a]">
                Keep browsing, then commit the stop
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5b635d]">
                Explore stays open to everyone. Creating the actual route still
                happens in the protected trip builder.
              </p>
              <Link
                href={tripHref}
                className="pill-button mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#17181a] px-5 py-3 font-semibold text-white"
              >
                <Route className="size-4" />
                {tripLabel}
              </Link>
            </article>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
