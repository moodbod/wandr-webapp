import { FauxMap } from "@/components/ui/faux-map";
import { PageIntro } from "@/components/ui/page-intro";
import { tripMarkers, tripTimeline } from "@/lib/mock-data";
import { CalendarRange, Route, Sparkles } from "lucide-react";

export default function TripsPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Phase 1"
        title="Trips"
        description="Trip creation and itinerary editing come next. The app already has the protected workspace and route-focused layout those flows will live inside."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_390px]">
        <FauxMap
          className="min-h-[520px]"
          markers={tripMarkers}
          showControls
          topBar={
            <div className="surface-card-strong flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-[#394037]">
              <Route className="size-4 text-[#8bd65b]" />
              Route overview shell ready for trip planning
            </div>
          }
        >
          <div className="surface-card-strong absolute left-5 top-24 max-w-sm rounded-[2rem] p-6">
            <div className="eyebrow">My Trip Preview</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#15181a]">
              Namibia Route
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#59615c]">
              This card becomes the trip list and itinerary entry point in phase
              5. Right now it anchors the future interaction model.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#9fe870] px-3 py-1 text-sm font-semibold text-[#203811]">
                Draft shell
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#394037] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
                Route-first
              </span>
            </div>
          </div>
        </FauxMap>

        <aside className="surface-card-strong rounded-[2rem] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#40473f]">
            <Sparkles className="size-4 text-[#8bd65b]" />
            Active Route Shell
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-[#9fe870]/30 px-4 py-3 text-sm font-semibold text-[#2f4623]">
            En Route • 3 stops remaining
          </div>

          <div className="mt-6 space-y-4">
            {tripTimeline.map((stop) => (
              <article
                key={stop.title}
                className={`rounded-[1.75rem] border px-4 py-4 ${
                  stop.current
                    ? "border-[#95de65] bg-[#9fe870]/75 text-[#213614]"
                    : "border-black/6 bg-white/65 text-[#1a1c1f]"
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                  <span className={stop.current ? "text-[#2b4d18]" : "text-[#5e655f]"}>
                    {stop.time}
                  </span>
                  <span className={stop.current ? "text-[#2b4d18]" : "text-[#666d67]"}>
                    {stop.distance}
                  </span>
                </div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  {stop.title}
                </h3>
                <p className="mt-2 text-sm leading-7 opacity-80">
                  {stop.description}
                </p>
              </article>
            ))}
          </div>

          <button className="pill-button mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#17181a] px-5 py-3 font-semibold text-white">
            <CalendarRange className="size-4" />
            Create trip in phase 5
          </button>
        </aside>
      </section>
    </div>
  );
}
