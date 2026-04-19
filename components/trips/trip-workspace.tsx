"use client";

import Link from "next/link";
import { useRoutePreview } from "@/components/maps/use-route-preview";
import { WandrMap, type WandrMapMarker } from "@/components/maps/wandr-map";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  Flag,
  MapPin,
  Navigation,
  NotebookPen,
  Plus,
  Route,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ─── Types ─── */

type TripStatus = "draft" | "planned" | "active" | "completed";

type TripSummary = {
  _id: Id<"trips">;
  title: string;
  description: string | null;
  status: TripStatus;
  startDate: string | null;
  endDate: string | null;
  coverImage: string | null;
  createdAt: number;
  updatedAt: number;
  stopCount: number;
  dayCount: number;
};

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

type CurrentTripState = {
  activeTripId: Id<"trips"> | null;
  trip: TripSummary;
  routeCoordinates: [number, number][];
  stops: TripWorkspaceStop[];
};

/* ─── Constants ─── */

const EMPTY_STOPS: TripWorkspaceStop[] = [];
const EMPTY_ROUTE_COORDINATES: [number, number][] = [];

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/* ─── Helpers ─── */

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
  return "Flexible dates";
}

/* ─── Loading ─── */

function TripsLoadingState() {
  return (
    <section className="trip-uber-screen">
      <WandrMap
        className="trip-uber-map"
        markers={[]}
        routeCoordinates={[]}
        showLoader={false}
      />
      <div className="trip-uber-loading">
        <div className="trip-uber-loading-spinner" />
        <p className="trip-uber-loading-text">Loading your trip…</p>
      </div>
    </section>
  );
}

/* ─── Empty state ─── */

function EmptyTripState() {
  return (
    <section className="trip-uber-screen">
      <WandrMap
        className="trip-uber-map"
        markers={[]}
        routeCoordinates={[]}
        showLoader={false}
      />

      <div className="trip-uber-sheet trip-uber-sheet--centered">
        <div className="trip-uber-empty-icon">
          <Navigation className="size-7 text-[#9fe870]" strokeWidth={2.2} />
        </div>
        <h1 className="trip-uber-empty-title">Where to?</h1>
        <p className="trip-uber-empty-desc">
          Start exploring Namibia and add places to build your road trip route.
        </p>
        <Link href="/explore" className="trip-uber-btn trip-uber-btn--primary">
          <Compass className="size-[1.1rem]" strokeWidth={2.4} />
          Explore places
        </Link>
      </div>
    </section>
  );
}

/* ─── Completed state ─── */

function CompletedTripState({
  isStartingNextTrip,
  onStartNextTrip,
  trip,
}: {
  isStartingNextTrip: boolean;
  onStartNextTrip: () => void;
  trip: TripSummary;
}) {
  return (
    <section className="trip-uber-screen">
      <WandrMap
        className="trip-uber-map"
        markers={[]}
        routeCoordinates={[]}
        showLoader={false}
      />

      <div className="trip-uber-sheet">
        <div className="trip-uber-completed-badge">
          <Flag className="size-3.5" />
          Trip completed
        </div>

        <h1 className="trip-uber-sheet-title">{trip.title}</h1>
        <p className="trip-uber-sheet-meta">
          {fmtRange(trip.startDate, trip.endDate)} · {trip.stopCount}{" "}
          {trip.stopCount === 1 ? "stop" : "stops"}
        </p>
        <p className="trip-uber-sheet-caption">
          This route is wrapped and saved. Start another trip whenever you&apos;re
          ready.
        </p>

        <div className="trip-uber-actions">
          <button
            type="button"
            onClick={onStartNextTrip}
            disabled={isStartingNextTrip}
            className="trip-uber-btn trip-uber-btn--accent"
          >
            <Route className="size-[1.1rem]" strokeWidth={2.2} />
            {isStartingNextTrip ? "Starting…" : "New trip"}
          </button>
          <Link href="/explore" className="trip-uber-btn trip-uber-btn--ghost">
            <Compass className="size-[1.1rem]" strokeWidth={2.2} />
            Explore
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Active trip — the Uber ride experience ─── */

function ActiveTripExperience({
  isEndingTrip,
  onEndTrip,
  onUpdateMeta,
  routeCoordinates,
  stops,
  trip,
}: {
  isEndingTrip: boolean;
  onEndTrip: () => void;
  onUpdateMeta: (stopId: Id<"tripStops">, note: string | null) => void;
  routeCoordinates: [number, number][];
  stops: TripWorkspaceStop[];
  trip: TripSummary;
}) {
  const [selectedStopId, setSelectedStopId] = useState<Id<"tripStops"> | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const selectedStop =
    stops.find((stop) => stop._id === selectedStopId) ?? stops[0] ?? null;
  const selectedStopIndex = selectedStop
    ? stops.findIndex((stop) => stop._id === selectedStop._id)
    : -1;
  const progress = stops.length > 0 ? ((selectedStopIndex + 1) / stops.length) * 100 : 0;

  const markers = useMemo<WandrMapMarker[]>(
    () =>
      stops.map((stop) => ({
        id: stop._id,
        label: `${stop.orderIndex + 1}. ${stop.place.title}`,
        coordinates: [stop.place.coordinates[0] ?? 0, stop.place.coordinates[1] ?? 0],
        note:
          stop._id === selectedStop?._id
            ? "Current"
            : `Stop ${stop.orderIndex + 1}`,
        emphasis: stop._id === selectedStop?._id,
      })),
    [selectedStop?._id, stops],
  );

  if (!selectedStop) {
    return null;
  }

  return (
    <section className="trip-uber-screen">
      <WandrMap
        className="trip-uber-map"
        fitToData={false}
        focusSelectedMarker
        markers={markers}
        onMarkerSelect={(markerId) =>
          setSelectedStopId(markerId as Id<"tripStops">)
        }
        routeCoordinates={routeCoordinates}
        selectedMarkerId={selectedStop._id}
        showLoader={false}
      />

      {/* ── Floating status pill ── */}
      <div className="trip-uber-status-pill">
        <div className="trip-uber-status-badge-active">
          <span className="trip-uber-status-dot" /> Live
        </div>
        <span className="trip-uber-status-trip-name">{trip.title}</span>
      </div>

      {/* ── Bottom sheet ── */}
      <div className="trip-uber-sheet trip-uber-sheet--ride">
        <div className="trip-uber-sheet-handle" />

        {/* Segmented Progress */}
        <div className="trip-uber-ride-progress-container">
          <div className="trip-uber-ride-segments">
            {stops.map((stop, i) => (
               <div 
                 key={stop._id} 
                 className={`trip-uber-ride-segment ${i <= selectedStopIndex ? 'is-completed' : ''} ${i === selectedStopIndex ? 'is-current' : ''}`} 
               />
            ))}
          </div>
          <p className="trip-uber-ride-eta">
            {selectedStopIndex + 1} of {stops.length} stops
          </p>
        </div>

        {/* Current stop hero */}
        <div className="trip-uber-ride-hero">
          <h2 className="trip-uber-ride-title">{selectedStop.place.title}</h2>
          <p className="trip-uber-ride-subtitle">
            {selectedStop.place.region} · {selectedStop.place.category}
          </p>
        </div>

        {/* Minimal stats */}
        <div className="trip-uber-ride-stats">
          <div className="trip-uber-ride-stat">
            <p className="trip-uber-ride-stat-val">
              {selectedStop.place.driveTimeFromWindhoek}
            </p>
            <p className="trip-uber-ride-stat-lbl">Drive</p>
          </div>
          <div className="trip-uber-ride-stat">
            <p className="trip-uber-ride-stat-val">
              {selectedStop.place.estimatedVisitDuration}
            </p>
            <p className="trip-uber-ride-stat-lbl">Visit</p>
          </div>
          <div className="trip-uber-ride-stat">
            <p className="trip-uber-ride-stat-val">
              {Math.max(stops.length - selectedStopIndex - 1, 0)}
            </p>
            <p className="trip-uber-ride-stat-lbl">Remaining</p>
          </div>
        </div>

        {/* Note toggle */}
        <button
          type="button"
          onClick={() => setShowNotes((c) => !c)}
          className="trip-uber-note-toggle"
        >
          <NotebookPen className="size-4" />
          <span>Trip note</span>
          <ChevronDown
            className={`size-4 ml-auto transition-transform duration-200 ${showNotes ? "rotate-180" : ""}`}
          />
        </button>

        {showNotes && (
          <textarea
            key={selectedStop._id}
            defaultValue={selectedStop.note ?? ""}
            onBlur={(event) =>
              onUpdateMeta(selectedStop._id, event.target.value.trim() || null)
            }
            placeholder="Quick note for this stop…"
            className="trip-uber-note-input"
            rows={3}
          />
        )}

        {/* Stop chips */}
        <div className="trip-uber-stops-row">
          {stops.map((stop) => {
            const isSelected = stop._id === selectedStop._id;
            return (
              <button
                key={stop._id}
                type="button"
                onClick={() => setSelectedStopId(stop._id)}
                className={`trip-uber-stop-chip ${isSelected ? "is-active" : ""}`}
              >
                <span className={`trip-uber-stop-chip-num ${isSelected ? "is-active" : ""}`}>
                  {stop.orderIndex + 1}
                </span>
                <span className="trip-uber-stop-chip-name">{stop.place.title}</span>
              </button>
            );
          })}
        </div>

        {/* End trip */}
        <button
          type="button"
          onClick={onEndTrip}
          disabled={isEndingTrip}
          className="trip-uber-btn trip-uber-btn--dark trip-uber-btn--full"
        >
          <Route className="size-[1.1rem]" strokeWidth={2.2} />
          {isEndingTrip ? "Ending trip…" : "End trip"}
        </button>
      </div>
    </section>
  );
}

/* ─── Draft / planned itinerary ─── */

function DraftItinerary({
  canStartTrip,
  isPlanningUnlocked,
  markers,
  onRemove,
  onReorder,
  onStartTrip,
  onUpdateMeta,
  pendingAction,
  routeCoordinates,
  stops,
  trip,
}: {
  canStartTrip: boolean;
  isPlanningUnlocked: boolean;
  markers: WandrMapMarker[];
  onRemove: (stopId: Id<"tripStops">) => void;
  onReorder: (tripId: Id<"trips">, stopId: Id<"tripStops">, direction: "up" | "down") => void;
  onStartTrip: () => void;
  onUpdateMeta: (stopId: Id<"tripStops">, patch: { dayNumber?: number | null; note?: string | null }) => void;
  pendingAction: "end" | "next" | "start" | null;
  routeCoordinates: [number, number][];
  stops: TripWorkspaceStop[];
  trip: TripSummary;
}) {
  const isDraft = trip.status === "draft";
  const dayLimit = Math.max(trip.dayCount, stops.length, 5);

  return (
    <section className="trip-uber-screen">
      <WandrMap
        className="trip-uber-map"
        markers={markers}
        routeCoordinates={routeCoordinates}
        fitToData
      />

      {/* ── Top status bar ── */}
      <div className="trip-uber-status-pill">
        <span className="trip-uber-status-badge-draft">
          {trip.status === "draft" ? "Draft" : "Planned"}
        </span>
        <span className="trip-uber-status-trip-name">{trip.title}</span>
        <span className="trip-uber-status-date">{fmtRange(trip.startDate, trip.endDate)}</span>
      </div>

      {/* ── Bottom sheet ── */}
      <div className="trip-uber-sheet trip-uber-sheet--itinerary">
        <div className="trip-uber-sheet-handle" />

        {/* Header */}
        <div className="trip-uber-itin-header">
          <div>
            <h2 className="trip-uber-itin-title">Itinerary</h2>
            <p className="trip-uber-itin-count">
              {stops.length} {stops.length === 1 ? "stop" : "stops"}
            </p>
          </div>
          <div className="trip-uber-itin-actions">
            {isPlanningUnlocked && (
              <Link href="/explore" className="trip-uber-btn-sm trip-uber-btn-sm--dark">
                <Plus className="size-3.5" strokeWidth={2.6} />
                Add
              </Link>
            )}
            {isDraft && (
              <button
                type="button"
                onClick={onStartTrip}
                disabled={!canStartTrip || pendingAction !== null}
                className="trip-uber-btn-sm trip-uber-btn-sm--accent"
              >
                <Navigation className="size-3.5" strokeWidth={2.4} />
                {pendingAction === "start" ? "Starting…" : "Go"}
              </button>
            )}
          </div>
        </div>

        {/* Stop list */}
        <div className="trip-uber-itin-list">
          {stops.length === 0 ? (
            <div className="trip-uber-itin-empty">
              <MapPin className="size-6 text-[#9a9f97]" />
              <p className="trip-uber-itin-empty-title">No stops yet</p>
              <p className="trip-uber-itin-empty-desc">
                Explore and add places to build your route.
              </p>
            </div>
          ) : (
            <ul className="trip-uber-stop-list">
              {stops.map((stop, index) => (
                <StopRow
                  key={stop._id}
                  dayLimit={dayLimit}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === stops.length - 1}
                  isStructureLocked={!isPlanningUnlocked}
                  onMoveDown={() => onReorder(trip._id, stop._id, "down")}
                  onMoveUp={() => onReorder(trip._id, stop._id, "up")}
                  onRemove={() => onRemove(stop._id)}
                  onUpdateMeta={(patch) => onUpdateMeta(stop._id, patch)}
                  stop={stop}
                  totalStops={stops.length}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Stop row ─── */

function StopRow({
  dayLimit,
  index,
  isFirst,
  isLast,
  isStructureLocked,
  onMoveDown,
  onMoveUp,
  onRemove,
  onUpdateMeta,
  stop,
  totalStops,
}: {
  dayLimit: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isStructureLocked: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onUpdateMeta: (patch: { dayNumber?: number | null; note?: string | null }) => void;
  stop: TripWorkspaceStop;
  totalStops: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="trip-uber-stop-row">
      {/* Timeline connector */}
      <div className="trip-uber-stop-timeline">
        <span className="trip-uber-stop-num">{index + 1}</span>
        {index < totalStops - 1 && <div className="trip-uber-stop-connector" />}
      </div>

      {/* Content */}
      <div className="trip-uber-stop-content">
        <button
          type="button"
          onClick={() => setOpen((c) => !c)}
          className="trip-uber-stop-header"
        >
          <div className="trip-uber-stop-header-text">
            <p className="trip-uber-stop-title">{stop.place.title}</p>
            <p className="trip-uber-stop-subtitle">
              {stop.place.region}
              {stop.dayNumber ? ` · Day ${stop.dayNumber}` : ""}
            </p>
          </div>
          <ChevronDown
            className={`size-4 shrink-0 text-[#9a9f97] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="trip-uber-stop-detail">
            <p className="trip-uber-stop-summary">{stop.place.summary}</p>

            <div className="trip-uber-stop-tags">
              <span className="trip-uber-tag">{stop.place.category}</span>
              <span className="trip-uber-tag">{stop.place.estimatedVisitDuration}</span>
              {stop.place.driveTimeFromWindhoek && (
                <span className="trip-uber-tag">{stop.place.driveTimeFromWindhoek} drive</span>
              )}
            </div>

            {!isStructureLocked && (
              <select
                value={stop.dayNumber ?? 0}
                onChange={(e) =>
                  onUpdateMeta({
                    dayNumber: Number(e.target.value) === 0 ? null : Number(e.target.value),
                  })
                }
                className="trip-uber-day-select"
              >
                <option value={0}>No day</option>
                {Array.from({ length: dayLimit }, (_, day) => (
                  <option key={day + 1} value={day + 1}>
                    Day {day + 1}
                  </option>
                ))}
              </select>
            )}

            <textarea
              defaultValue={stop.note ?? ""}
              onBlur={(e) => onUpdateMeta({ note: e.target.value.trim() || null })}
              placeholder="Add a note…"
              className="trip-uber-note-input"
              rows={2}
            />

            {!isStructureLocked && (
              <div className="trip-uber-stop-actions">
                <div className="trip-uber-move-group">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={onMoveUp}
                    className="trip-uber-move-btn"
                  >
                    <ChevronUp className="size-3.5" /> Up
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={onMoveDown}
                    className="trip-uber-move-btn"
                  >
                    <ChevronDown className="size-3.5" /> Down
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onRemove}
                  className="trip-uber-remove-btn"
                >
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* ─── Main workspace ─── */

export function TripWorkspace() {
  const tripsPage = useQuery(api.trips.getTripsPageState);
  const createDraftTrip = useMutation(api.trips.createDraftTrip);
  const endTrip = useMutation(api.trips.endTrip);
  const removeStop = useMutation(api.tripStops.removeStop);
  const reorder = useMutation(api.tripStops.reorderStops);
  const startTrip = useMutation(api.trips.startTrip);
  const updateMeta = useMutation(api.tripStops.updateStopMeta);
  const [pendingAction, setPendingAction] = useState<"end" | "next" | "start" | null>(null);

  const currentTrip = (tripsPage?.currentTrip ?? null) as CurrentTripState | null;
  const recentCompletedTrip = (tripsPage?.recentCompletedTrip ?? null) as TripSummary | null;
  const currentStops = currentTrip?.stops ?? EMPTY_STOPS;
  const routeCoordinates = useRoutePreview(
    currentTrip?.routeCoordinates ?? EMPTY_ROUTE_COORDINATES,
  );

  const markers = useMemo<WandrMapMarker[]>(
    () =>
      currentStops.map((stop, index) => ({
        id: stop._id,
        label: `${index + 1}. ${stop.place.title}`,
        coordinates: [stop.place.coordinates[0] ?? 0, stop.place.coordinates[1] ?? 0],
        note: stop.dayNumber ? `Day ${stop.dayNumber}` : undefined,
        emphasis: index === 0,
      })),
    [currentStops],
  );

  if (tripsPage === undefined) {
    return <TripsLoadingState />;
  }

  if (!currentTrip) {
    if (recentCompletedTrip) {
      return (
        <CompletedTripState
          isStartingNextTrip={pendingAction === "next"}
          onStartNextTrip={() => {
            if (pendingAction) return;
            setPendingAction("next");
            void createDraftTrip({}).finally(() => setPendingAction(null));
          }}
          trip={recentCompletedTrip}
        />
      );
    }

    return <EmptyTripState />;
  }

  const trip = currentTrip.trip;
  const stops = currentTrip.stops;
  const isDraft = trip.status === "draft";
  const isActive = trip.status === "active";
  const isPlanningUnlocked = trip.status !== "active" && trip.status !== "completed";
  const canStartTrip = isDraft && stops.length > 0;

  if (isActive) {
    return (
      <ActiveTripExperience
        isEndingTrip={pendingAction === "end"}
        onEndTrip={() => {
          if (pendingAction) return;
          setPendingAction("end");
          void endTrip({ tripId: trip._id }).finally(() => setPendingAction(null));
        }}
        onUpdateMeta={(stopId, note) => {
          void updateMeta({ stopId, note });
        }}
        routeCoordinates={routeCoordinates}
        stops={stops}
        trip={trip}
      />
    );
  }

  return (
    <DraftItinerary
      canStartTrip={canStartTrip}
      isPlanningUnlocked={isPlanningUnlocked}
      markers={markers}
      onRemove={(stopId) => void removeStop({ stopId })}
      onReorder={(tripId, stopId, direction) =>
        void reorder({ tripId, stopId, direction })
      }
      onStartTrip={() => {
        if (!canStartTrip || pendingAction) return;
        setPendingAction("start");
        void startTrip({ tripId: trip._id }).finally(() => setPendingAction(null));
      }}
      onUpdateMeta={(stopId, patch) => void updateMeta({ stopId, ...patch })}
      pendingAction={pendingAction}
      routeCoordinates={routeCoordinates}
      stops={stops}
      trip={trip}
    />
  );
}
