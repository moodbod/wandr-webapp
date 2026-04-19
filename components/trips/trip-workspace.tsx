"use client";

import Link from "next/link";
import { useRoutePreview } from "@/components/maps/use-route-preview";
import { WandrMap, type WandrMapMarker } from "@/components/maps/wandr-map";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronUp, Compass, MapPin, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

/* ── Formatters ── */

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
type TripWorkspaceStop = {
  _id: Id<"tripStops">;
  dayNumber: number | null;
  note: string | null;
  orderIndex: number;
  place: {
    coordinates: number[];
    title: string;
    region: string;
    summary: string;
    category: string;
    estimatedVisitDuration: string;
    driveTimeFromWindhoek: string;
  };
};

const EMPTY_STOPS: TripWorkspaceStop[] = [];
const EMPTY_ROUTE_COORDINATES: [number, number][] = [];

function fmtDate(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}

function fmtRange(s: string | null | undefined, e: string | null | undefined) {
  const a = fmtDate(s);
  const b = fmtDate(e);
  if (a && b) return `${a} – ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return "Dates flexible";
}

function fmtStatus(status: "draft" | "planned" | "active" | "completed") {
  switch (status) {
    case "draft":
      return "Draft";
    case "planned":
      return "Planned";
    case "active":
      return "Active trip";
    case "completed":
      return "Completed";
  }
}

/* ── Component ── */

export function TripWorkspace() {
  const workspace = useQuery(api.trips.getTripWorkspace, {
    tripId: null,
  });
  const removeStop = useMutation(api.tripStops.removeStop);
  const reorder = useMutation(api.tripStops.reorderStops);
  const updateMeta = useMutation(api.tripStops.updateStopMeta);

  const trip = workspace?.trip ?? null;
  const stops = workspace?.stops ?? EMPTY_STOPS;
  const routeCoordinates = useRoutePreview(
    workspace?.routeCoordinates ?? EMPTY_ROUTE_COORDINATES,
  );

  const markers = useMemo<WandrMapMarker[]>(
    () =>
      stops.map((s, i) => ({
        id: s._id,
        label: `${i + 1}. ${s.place.title}`,
        coordinates: [s.place.coordinates[0] ?? 0, s.place.coordinates[1] ?? 0],
        note: s.dayNumber ? `Day ${s.dayNumber}` : undefined,
        emphasis: i === 0,
      })),
    [stops],
  );

  const dayLimit = Math.max(trip?.dayCount ?? 0, stops.length, 5);

  /* Loading */
  if (workspace === undefined) {
    return (
      <div className="space-y-5">
        <div className="h-[360px] animate-pulse rounded-2xl bg-black/[0.03]" />
        <div className="space-y-3">
          <div className="h-5 w-48 rounded-full bg-black/[0.04]" />
          <div className="h-4 w-32 rounded-full bg-black/[0.03]" />
        </div>
      </div>
    );
  }

  /* Empty — no active or draft trip */
  if (!trip) {
    return (
      <div className="space-y-5">
        {/* Map */}
        <div className="relative h-[360px] overflow-hidden rounded-2xl lg:h-[420px]">
          <WandrMap
            className="absolute inset-0"
            markers={[]}
            routeCoordinates={[]}
            showLoader={false}
          />
        </div>

        {/* Empty CTA */}
        <div className="mx-auto max-w-md py-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#17181a]">
            No active trip yet
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#71776e]">
            Browse places, add your first stop, and we&apos;ll open your draft
            trip here automatically.
          </p>
          <Link
            href="/explore"
            className="pill-button mt-5 inline-flex items-center gap-2 bg-[#9fe870] px-6 py-3.5 text-sm font-bold text-[#163300] shadow-sm"
          >
            <Compass className="size-4" />
            Browse places
          </Link>
        </div>
      </div>
    );
  }

  /* Active trip workspace */
  return (
    <div className="space-y-4">
      {/* ── Map ── */}
      <div className="relative h-[340px] overflow-hidden rounded-2xl lg:h-[440px]">
        <WandrMap
          className="absolute inset-0"
          markers={markers}
          routeCoordinates={routeCoordinates}
          fitToData
        />
        {/* Stop count pill */}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#3a3f38] shadow-sm backdrop-blur-sm">
          {stops.length} {stops.length === 1 ? "stop" : "stops"}
        </div>
      </div>

      {/* ── Trip header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#17181a] lg:text-2xl">
              {trip.title}
            </h1>
            <span className="rounded-full bg-[#eef6e7] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#315117]">
              {fmtStatus(trip.status)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#9a9f97]">
            {fmtRange(trip.startDate, trip.endDate)} · {trip.dayCount}{" "}
            {trip.dayCount === 1 ? "day" : "days"}
          </p>
        </div>
        <Link
          href="/explore"
          className="pill-button inline-flex items-center gap-2 bg-[#17181a] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Compass className="size-4" />
          Add stops
        </Link>
      </div>

      {/* ── Stops list ── */}
      <div>
        <h2 className="text-sm font-semibold text-[#17181a]">Stops</h2>

        {stops.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#e0e0de] px-5 py-10 text-center">
            <MapPin className="mx-auto size-7 text-[#7b8577]" />
            <p className="mt-3 text-sm font-bold text-[#17181a]">
              Your itinerary is empty
            </p>
            <p className="mt-1 text-xs text-[#3a4138]">
              Discover places and add them to this trip to build your route.
            </p>
            <Link
              href="/explore"
              className="pill-button mt-5 inline-flex items-center gap-2 bg-[#9fe870] px-6 py-2.5 text-sm font-bold text-[#163300] shadow-sm"
            >
              <Compass className="size-4" />
              Browse places
            </Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[#f0f0ee]">
            {stops.map((stop, i) => (
              <StopRow
                key={stop._id}
                stop={stop}
                index={i}
                isFirst={i === 0}
                isLast={i === stops.length - 1}
                dayLimit={dayLimit}
                onRemove={() => void removeStop({ stopId: stop._id })}
                onMoveUp={() =>
                  void reorder({
                    tripId: trip._id,
                    stopId: stop._id,
                    direction: "up",
                  })
                }
                onMoveDown={() =>
                  void reorder({
                    tripId: trip._id,
                    stopId: stop._id,
                    direction: "down",
                  })
                }
                onUpdateMeta={(patch) =>
                  void updateMeta({ stopId: stop._id, ...patch })
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Stop row ── */

function StopRow({
  stop,
  index,
  isFirst,
  isLast,
  dayLimit,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdateMeta,
}: {
  stop: TripWorkspaceStop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  dayLimit: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateMeta: (patch: { note?: string | null; dayNumber?: number | null }) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="py-3.5">
      {/* Collapsed row */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 text-left"
      >
        {/* Number */}
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#17181a] text-[0.65rem] font-bold text-white">
          {index + 1}
        </span>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#17181a]">
            {stop.place.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#9a9f97]">
            {stop.place.region}
            {stop.dayNumber ? ` · Day ${stop.dayNumber}` : ""}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`size-4 shrink-0 text-[#bfc3bb] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded */}
      {open ? (
        <div className="mt-3 ml-10 space-y-3 animate-[fadeSlide_180ms_ease]">
          <p className="text-[0.82rem] leading-relaxed text-[#5d635a]">
            {stop.place.summary}
          </p>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#f2f2f0] px-2.5 py-1 text-[0.68rem] font-medium text-[#5d635a]">
              {stop.place.category}
            </span>
            <span className="rounded-full bg-[#f2f2f0] px-2.5 py-1 text-[0.68rem] font-medium text-[#5d635a]">
              {stop.place.estimatedVisitDuration}
            </span>
            {stop.place.driveTimeFromWindhoek ? (
              <span className="rounded-full bg-[#f2f2f0] px-2.5 py-1 text-[0.68rem] font-medium text-[#5d635a]">
                {stop.place.driveTimeFromWindhoek} from Windhoek
              </span>
            ) : null}
          </div>

          {/* Day + Note */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stop.dayNumber ?? 0}
              onChange={(e) =>
                onUpdateMeta({
                  dayNumber:
                    Number(e.target.value) === 0
                      ? null
                      : Number(e.target.value),
                })
              }
              className="rounded-lg border border-[#e5e5e3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3a3f38] outline-none"
            >
              <option value={0}>No day</option>
              {Array.from({ length: dayLimit }, (_, d) => (
                <option key={d + 1} value={d + 1}>
                  Day {d + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <textarea
            defaultValue={stop.note ?? ""}
            onBlur={(e) =>
              onUpdateMeta({ note: e.target.value.trim() || null })
            }
            placeholder="Add a note…"
            className="w-full resize-none rounded-lg border border-[#e5e5e3] bg-white px-3 py-2 text-xs leading-relaxed text-[#3a3f38] outline-none placeholder:text-[#c0c4bc] focus:border-[#17181a]/20"
            rows={2}
          />

          {/* Actions */}
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={isFirst}
              onClick={onMoveUp}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e5e5e3] bg-white px-2.5 py-1.5 text-[0.68rem] font-medium text-[#5d635a] transition-colors hover:bg-[#f5f5f3] disabled:opacity-30"
            >
              <ChevronUp className="size-3" />
              Up
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={onMoveDown}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e5e5e3] bg-white px-2.5 py-1.5 text-[0.68rem] font-medium text-[#5d635a] transition-colors hover:bg-[#f5f5f3] disabled:opacity-30"
            >
              <ChevronDown className="size-3" />
              Down
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-[0.68rem] font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="size-3" />
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
