"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Route, X } from "lucide-react";
import { useExploreMapState } from "@/components/explore/explore-map-state";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function ExploreTripTimeline({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { selectedPlaceSlug, setSelectedPlaceSlug } = useExploreMapState();
  const tripWorkspace = useQuery(
    api.trips.getTripWorkspace,
    isAuthenticated ? { tripId: null } : "skip",
  );
  const removeStop = useMutation(api.tripStops.removeStop);
  const [removingStopId, setRemovingStopId] = useState<Id<"tripStops"> | null>(null);
  const tripStatus = tripWorkspace?.trip?.status ?? null;
  const isTripActive = tripStatus === "active";
  const stops = tripWorkspace?.stops ?? [];

  if (!isAuthenticated || stops.length === 0) {
    return null;
  }

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];

  async function handleRemoveStop(
    stopId: Id<"tripStops">,
    stopSlug: string,
    fallbackSlug: string | null,
  ) {
    if (removingStopId === stopId) {
      return;
    }

    setRemovingStopId(stopId);

    try {
      await removeStop({ stopId });

      if (selectedPlaceSlug === stopSlug) {
        startTransition(() => {
          setSelectedPlaceSlug(fallbackSlug);
        });
      }
    } finally {
      setRemovingStopId(null);
    }
  }

  // ── Ultra Clean Active State ── //
  if (isTripActive) {
    return (
      <div className="pointer-events-auto mt-auto pb-[5.7rem] lg:pb-6 flex justify-center">
        <Link 
          href="/trips"
          className="flex items-center gap-3.5 rounded-[1.25rem] bg-[#17181a] p-2 pr-4 shadow-[0_16px_32px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <div className="flex h-[2.6rem] w-[2.6rem] items-center justify-center rounded-[0.85rem] bg-[#2a2b2d] text-[#9fe870]">
            <Route className="size-[1.1rem]" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col pr-1">
            <div className="flex items-center gap-1.5">
              <span className="trip-uber-status-dot" style={{ width: '6px', height:'6px' }} />
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#9fe870]">
                Live Route
              </span>
            </div>
            <span className="text-[0.88rem] font-bold text-white tracking-tight mt-[0.1rem]">
              {tripWorkspace?.trip?.title || "Active Trip"}
            </span>
          </div>
          <ArrowRight className="ml-1 size-4 text-[#8a8f87]" />
        </Link>
      </div>
    );
  }

  // ── Clean Drafting State ── //
  return (
    <div className="pointer-events-auto mt-auto pb-[5.7rem] lg:pb-0">
      <section className="mx-auto w-full max-w-[62rem] rounded-[2rem] bg-white/95 backdrop-blur-xl border border-white p-4 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-2 pt-1 pb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#7a8374]">
                Drafting
              </span>
              <span className="bg-[#f4f5f0] text-[#17181a] text-[0.68rem] font-bold px-2 py-0.5 rounded-md">
                {stops.length} {stops.length === 1 ? "stop" : "stops"}
              </span>
            </div>
            <h2 className="mt-1.5 text-[1.15rem] font-bold tracking-tight text-[#17181a] truncate">
              {stops.length > 1 ? `${firstStop.place.title} to ${lastStop.place.title}` : `Starting at ${firstStop.place.title}`}
            </h2>
          </div>

          <Link
            href="/trips"
            className="trip-uber-btn-sm trip-uber-btn-sm--dark !px-5 !py-3 !text-[0.82rem] lg:w-auto w-full justify-center"
          >
            <Route className="size-[1.1rem]" strokeWidth={2.4} />
            My Trip
          </Link>
        </div>

        <div className="explore-trip-timeline-scroll mt-2 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2 sm:gap-3 px-1">
            {stops.map((stop, index) => {
              const isSelected = selectedPlaceSlug === stop.place.slug;
              const isRemoving = removingStopId === stop._id;
              const fallbackSlug = stops[index + 1]?.place.slug ?? stops[index - 1]?.place.slug ?? null;

              return (
                <div key={stop._id} className="flex items-center gap-2 sm:gap-3">
                  {index > 0 ? (
                    <div aria-hidden="true" className="w-5 sm:w-7">
                      <span className="block h-[2px] w-full rounded-full bg-[#e5e8e2]" />
                    </div>
                  ) : null}

                  <article
                    className={`flex items-center rounded-2xl border bg-white p-1.5 shadow-sm transition-colors ${
                      isSelected ? "border-[#17181a] shadow-[0_4px_12px_rgba(0,0,0,0.06)]" : "border-[#e5e8e2]"
                    } ${isRemoving ? "opacity-50" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          setSelectedPlaceSlug(stop.place.slug);
                        });
                      }}
                      className="flex min-w-[11rem] max-w-[14rem] items-center gap-2.5 px-2 py-1.5 text-left"
                    >
                      <span
                        className={`flex h-[1.6rem] w-[1.6rem] shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${
                          isSelected ? "bg-[#17181a] text-[#9fe870]" : "bg-[#f4f5f0] text-[#17181a]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.82rem] font-bold tracking-tight text-[#17181a]">
                          {stop.place.title}
                        </span>
                        <span className="mt-[0.1rem] block truncate text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#7a8374]">
                          {stop.place.region}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleRemoveStop(stop._id, stop.place.slug, fallbackSlug)}
                      disabled={isRemoving}
                      className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-[#9a9f97] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      aria-label={`Remove ${stop.place.title}`}
                    >
                      <X className="size-3.5" strokeWidth={2.5} />
                    </button>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
