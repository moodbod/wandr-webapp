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
  const stops = tripWorkspace?.stops ?? [];

  if (!isAuthenticated || stops.length === 0) {
    return null;
  }

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];
  const helperCopy =
    stops.length === 1
      ? `Start with ${firstStop.place.title}. Add one more place and the road route will connect automatically.`
      : `${firstStop.place.title} to ${lastStop.place.title}. Tap any stop to focus it on the map.`;

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

  return (
    <div className="pointer-events-auto mt-auto pb-[5.7rem] lg:pb-0">
      <section className="explore-trip-timeline surface-card-strong mx-auto max-w-[62rem] rounded-[1.75rem] p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">Trip In Progress</span>
              <span className="rounded-full bg-[#eef6e7] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#315117]">
                {stops.length} {stops.length === 1 ? "stop" : "stops"}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-[#17181a]">
              Your route is building live on the map.
            </p>
            <p className="mt-1 text-xs leading-5 text-[#656d62]">{helperCopy}</p>
          </div>

          <Link
            href="/trips"
            className="pill-button inline-flex items-center justify-center gap-2 rounded-full bg-[#17181a] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Route className="size-4" />
            Open My Trip
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="explore-trip-timeline-scroll mt-3 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2.5 sm:gap-3">
            {stops.map((stop, index) => {
              const isSelected = selectedPlaceSlug === stop.place.slug;
              const isRemoving = removingStopId === stop._id;
              const fallbackSlug =
                stops[index + 1]?.place.slug ?? stops[index - 1]?.place.slug ?? null;

              return (
                <div key={stop._id} className="flex items-center gap-2.5 sm:gap-3">
                  {index > 0 ? (
                    <div aria-hidden="true" className="explore-trip-connector w-7 sm:w-9">
                      <span className="block h-px w-full rounded-full bg-gradient-to-r from-[#ccd6c0] via-[#dae2d0] to-[#edf1e7]" />
                    </div>
                  ) : null}

                  <article
                    className={`explore-trip-stop-card ${isSelected ? "is-active" : ""} ${isRemoving ? "opacity-70" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          setSelectedPlaceSlug(stop.place.slug);
                        });
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left"
                    >
                      <span
                        className={`explore-trip-stop-number ${isSelected ? "is-active" : ""}`}
                      >
                        {index + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold tracking-[-0.02em] text-[#17181a]">
                          {stop.place.title}
                        </span>
                        <span className="mt-1 block truncate text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#737a70]">
                          {stop.place.region} • {stop.place.category}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleRemoveStop(stop._id, stop.place.slug, fallbackSlug)
                      }
                      disabled={isRemoving}
                      className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f4f5f0] text-[#61695c] transition-colors hover:bg-[#eaede4] hover:text-[#17181a] disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Remove ${stop.place.title} from this trip`}
                    >
                      <X className="size-3.5" />
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
