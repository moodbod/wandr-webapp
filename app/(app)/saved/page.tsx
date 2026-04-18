import { EmptyState } from "@/components/ui/empty-state";
import { FauxMap } from "@/components/ui/faux-map";
import { PageIntro } from "@/components/ui/page-intro";
import { Bookmark, Heart, MapPinned } from "lucide-react";
import Link from "next/link";

const savedMarkers = [
  { label: "Sossusvlei", top: "18%", left: "68%" },
  { label: "Spitzkoppe", top: "42%", left: "34%" },
  { label: "Walvis Bay", top: "62%", left: "54%" },
];

export default function SavedPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Phase 1"
        title="Saved"
        description="Saved places will become the bridge between discovery and trip-building. For now, the shell and empty states are ready for that flow."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <FauxMap
          className="min-h-[420px]"
          markers={savedMarkers}
          topBar={
            <div className="surface-card-strong inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-[#394037]">
              <Heart className="size-4 text-[#8bd65b]" />
              Saved landmarks will appear across the route canvas
            </div>
          }
        >
          <div className="absolute right-5 top-5 rounded-[1.5rem] border border-black/8 bg-white/86 px-4 py-3 text-sm font-semibold text-[#374035] shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
            Phase 4 adds real save and unsave flows
          </div>
        </FauxMap>

        <EmptyState
          eyebrow="Nothing saved yet"
          title="Build your Namibia shortlist from the map."
          description="Explore now has real place data and previews. This page will turn those discoveries into saved landmarks, region groupings, and quick actions to move places into a trip."
          icon={<Bookmark className="size-5 text-[#203811]" />}
          action={
            <Link
              href="/explore"
              className="pill-button inline-flex items-center justify-center rounded-full bg-[#9fe870] px-5 py-3 font-semibold text-[#203811]"
            >
              Go to Explore
            </Link>
          }
          secondary={
            <div className="rounded-[1.5rem] border border-black/8 bg-black/[0.02] p-4 text-sm leading-7 text-[#575f58]">
              <div className="flex items-center gap-2 font-semibold text-[#222622]">
                <MapPinned className="size-4 text-[#8bd65b]" />
                Planned for this area
              </div>
              <p className="mt-2">
                Region grouping, list/grid views, and quick add-to-trip actions.
              </p>
            </div>
          }
        />
      </section>
    </div>
  );
}
