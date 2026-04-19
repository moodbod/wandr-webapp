"use client";

import { startTransition } from "react";
import { ExploreTripTimeline } from "@/components/explore/explore-trip-timeline";
import {
  EXPLORE_DISCOVERY_FILTERS as filterOptions,
  useExploreMapState,
} from "@/components/explore/explore-map-state";
import { Search, SlidersHorizontal } from "lucide-react";

export function ExploreDiscovery({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { activeFilter, setActiveFilter, searchQuery, setSearchQuery } =
    useExploreMapState();

  return (
    <section className="pointer-events-none relative isolate h-full overflow-hidden px-4 py-5 md:px-6 lg:px-8 lg:py-6">
      <div className="relative z-10 flex h-full flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="hidden items-center gap-1 md:flex">
            <h1 className="text-[2.55rem] font-black leading-none tracking-[-0.08em] text-[#17191a] md:text-[3.1rem]">
              Explore
            </h1>
            <span className="mt-1 block size-3 rounded-full bg-[#9fe870] md:size-3.5" />
          </div>

          <div className="flex flex-1 flex-col gap-3 xl:max-w-[720px] xl:flex-row xl:items-center xl:justify-end">
            <label className="pointer-events-auto flex h-14 flex-1 items-center gap-3 rounded-full border border-white/55 bg-white/92 px-5 shadow-[0_10px_24px_rgba(35,42,31,0.08)]">
              <Search className="size-5 text-[#5d655c]" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => setSearchQuery(nextValue));
                }}
                placeholder="Where to next?"
                className="w-full bg-transparent text-[0.98rem] font-semibold text-[#293023] outline-none placeholder:text-[#9aa195]"
              />
              <span className="flex size-8 items-center justify-center rounded-full bg-[#f5f5f0] text-[#576056]">
                <SlidersHorizontal className="size-4" />
              </span>
            </label>

            <div className="pointer-events-auto flex flex-wrap gap-3">
              {filterOptions.map((filter) => {
                const isActive = filter === activeFilter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`pill-button h-12 rounded-full px-6 text-sm font-bold shadow-[0_10px_24px_rgba(35,42,31,0.08)] ${
                      isActive
                        ? "bg-white text-[#22251d]"
                        : "bg-white/78 text-[#4f584e]"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1" />

        <ExploreTripTimeline isAuthenticated={isAuthenticated} />
      </div>
    </section>
  );
}
