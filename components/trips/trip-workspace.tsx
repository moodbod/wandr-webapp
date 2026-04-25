"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  Car,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  LoaderCircle,
  MapPin,
  Plus,
  Route,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

/* ── Types ── */

type TripStatus = "draft" | "planned" | "active" | "completed";

type TripSummary = {
  _id: Id<"trips">;
  title: string;
  description: string | null;
  status: TripStatus;
  startDate: string | null;
  endDate: string | null;
  coverImage: string | null;
  stopCount: number;
  dayCount: number;
};

type TripStop = {
  _id: Id<"tripStops">;
  tripId: Id<"trips">;
  orderIndex: number;
  dayNumber: number | null;
  note: string | null;
  plannedArrivalTime: string | null;
  plannedDepartureTime: string | null;
  place: Doc<"places">;
};

type Workspace = {
  trip: TripSummary | null;
  routeCoordinates: [number, number][];
  stops: TripStop[];
  budget: {
    currency: string;
    estimatedTotal: number;
    actualTotal: number;
    items: Array<{ _id: Id<"tripBudgetItems"> }>;
  } | null;
  bookings: {
    activeCount: number;
    requestedCount: number;
    confirmedCount: number;
  } | null;
};

/* ── Helpers ── */

function formatDateRange(start: string | null, end: string | null) {
  if (start && end) return `${start} — ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "Flexible dates";
}

function formatCurrency(value: number, currency = "NAD") {
  return new Intl.NumberFormat("en-NA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function toRadians(v: number) {
  return (v * Math.PI) / 180;
}

function calculateRouteDistanceKm(coordinates: [number, number][]) {
  if (coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [pLng, pLat] = coordinates[i - 1];
    const [lng, lat] = coordinates[i];
    const dLat = toRadians(lat - pLat);
    const dLng = toRadians(lng - pLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(pLat)) * Math.cos(toRadians(lat)) * Math.sin(dLng / 2) ** 2;
    total += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total);
}

function estimateDriveTime(km: number) {
  if (!km) return "—";
  const mins = Math.max(30, Math.round((km / 70) * 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

const PIN_POSITIONS = [
  { left: "62%", top: "10%" },
  { left: "52%", top: "26%" },
  { left: "44%", top: "38%" },
  { left: "40%", top: "50%" },
  { left: "30%", top: "63%" },
  { left: "12%", top: "72%" },
  { left: "12%", top: "86%" },
];

/* ── Loading ── */

function TripLoading() {
  return (
    <div className="tm-loading">
      <LoaderCircle className="size-6 animate-spin" />
      <span>Loading your trip…</span>
    </div>
  );
}

/* ── Empty state ── */

function TripEmpty({
  onCreateTrip,
  isCreating,
}: {
  onCreateTrip: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="tm-empty">
      <div className="tm-empty-icon">
        <Route className="size-7 text-[#9fe870]" />
      </div>
      <h2 className="tm-empty-title">Plan your first trip</h2>
      <p className="tm-empty-desc">
        Discover places on the map, save your favorites, and build
        a road-trip itinerary for Namibia.
      </p>
      <div className="tm-empty-actions">
        <button
          type="button"
          className="tm-btn tm-btn--accent"
          onClick={onCreateTrip}
          disabled={isCreating}
        >
          {isCreating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Create trip
        </button>
        <Link href="/explore" className="tm-btn tm-btn--secondary">
          <Compass className="size-4" />
          Explore places
        </Link>
      </div>
    </div>
  );
}

/* ── Trip header ── */

function TripHeader({
  trip,
  stopCount,
  onStartTrip,
  onEndTrip,
  isBusy,
}: {
  trip: TripSummary;
  stopCount: number;
  onStartTrip: () => void;
  onEndTrip: () => void;
  isBusy: boolean;
}) {
  return (
    <header className="tm-header">
      <div className="tm-header-info">
        <div className="tm-header-top">
          <h1 className="tm-title">{trip.title}</h1>
          <span className={`tm-status tm-status--${trip.status}`}>
            {STATUS_LABELS[trip.status]}
          </span>
        </div>
        <p className="tm-meta">
          <Calendar className="size-3.5" />
          {formatDateRange(trip.startDate, trip.endDate)}
          <span className="tm-meta-dot" />
          {stopCount} {stopCount === 1 ? "stop" : "stops"}
        </p>
      </div>
      <div className="tm-header-actions">
        <Link href="/explore" className="tm-btn-sm tm-btn-sm--ghost">
          <Plus className="size-3.5" />
          Add stop
        </Link>
        {trip.status !== "completed" && (
          <button
            type="button"
            className="tm-btn-sm tm-btn-sm--accent"
            onClick={trip.status === "active" ? onEndTrip : onStartTrip}
            disabled={isBusy || (trip.status !== "active" && stopCount === 0)}
          >
            {trip.status === "active" ? "End trip" : "Start trip"}
          </button>
        )}
      </div>
    </header>
  );
}

/* ── Stats bar ── */

function TripStatsBar({
  routeCoordinates,
  budget,
  stopCount,
  dayCount,
}: {
  routeCoordinates: [number, number][];
  budget: Workspace["budget"];
  stopCount: number;
  dayCount: number;
}) {
  const km = calculateRouteDistanceKm(routeCoordinates);

  return (
    <div className="tm-stats">
      <div className="tm-stat">
        <MapPin className="size-4" />
        <div>
          <strong>{stopCount}</strong>
          <span>Stops</span>
        </div>
      </div>
      <div className="tm-stat">
        <Calendar className="size-4" />
        <div>
          <strong>{dayCount || "—"}</strong>
          <span>Days</span>
        </div>
      </div>
      <div className="tm-stat">
        <Car className="size-4" />
        <div>
          <strong>{km ? `${km} km` : "—"}</strong>
          <span>Distance</span>
        </div>
      </div>
      <div className="tm-stat">
        <WalletCards className="size-4" />
        <div>
          <strong>
            {formatCurrency(budget?.estimatedTotal ?? 0, budget?.currency ?? "NAD")}
          </strong>
          <span>Budget</span>
        </div>
      </div>
    </div>
  );
}

/* ── Day pills ── */

function TripDayPills({
  stops,
  selectedDay,
  onSelectDay,
}: {
  stops: TripStop[];
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}) {
  const days = [...new Set(stops.map((s) => s.dayNumber).filter((d): d is number => d !== null))].sort(
    (a, b) => a - b,
  );

  if (days.length === 0) return null;

  return (
    <div className="tm-day-pills">
      <button
        type="button"
        className={`tm-pill ${selectedDay === null ? "is-active" : ""}`}
        onClick={() => onSelectDay(null)}
      >
        All
      </button>
      {days.map((day) => (
        <button
          key={day}
          type="button"
          className={`tm-pill ${selectedDay === day ? "is-active" : ""}`}
          onClick={() => onSelectDay(day)}
        >
          Day {day}
        </button>
      ))}
    </div>
  );
}

/* ── Timeline ── */

function TripTimeline({
  trip,
  stops,
  selectedStopId,
  selectedDay,
  onSelectStop,
}: {
  trip: TripSummary;
  stops: TripStop[];
  selectedStopId: Id<"tripStops"> | null;
  selectedDay: number | null;
  onSelectStop: (id: Id<"tripStops">) => void;
}) {
  const updateStopMeta = useMutation(api.tripStops.updateStopMeta);
  const removeStop = useMutation(api.tripStops.removeStop);
  const reorderStops = useMutation(api.tripStops.reorderStops);
  const canEdit = trip.status !== "active" && trip.status !== "completed";

  const filtered =
    selectedDay !== null
      ? stops.filter((s) => s.dayNumber === selectedDay)
      : stops;

  if (filtered.length === 0) {
    return (
      <div className="tm-itin-empty">
        <MapPin className="size-6 text-[#868685]" />
        <p>No stops yet</p>
        <Link href="/explore" className="tm-btn-sm tm-btn-sm--accent">
          <Compass className="size-3.5" />
          Browse places
        </Link>
      </div>
    );
  }

  return (
    <ul className="tm-timeline">
      {filtered.map((stop, idx) => {
        const isSelected = selectedStopId === stop._id;
        const isLast = idx === filtered.length - 1;

        return (
          <li key={stop._id} className="tm-timeline-item">
            {/* Rail */}
            <div className="tm-timeline-rail">
              <span
                className={`tm-timeline-marker ${isSelected ? "is-selected" : ""}`}
              >
                {idx + 1}
              </span>
              {!isLast && <div className="tm-timeline-line" />}
            </div>

            {/* Body */}
            <div className="tm-timeline-body">
              <button
                type="button"
                className={`tm-stop-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => onSelectStop(stop._id)}
              >
                <div className="tm-stop-info">
                  <span className="tm-stop-day">
                    Day {stop.dayNumber ?? idx + 1}
                  </span>
                  <strong className="tm-stop-name">
                    {stop.place.title}
                  </strong>
                  {stop.note && (
                    <p className="tm-stop-note">{stop.note}</p>
                  )}
                  {!stop.note && stop.place.teaser && (
                    <p className="tm-stop-note">{stop.place.teaser}</p>
                  )}
                </div>
                {stop.place.heroImage && (
                  <img
                    src={stop.place.heroImage}
                    alt=""
                    className="tm-stop-thumb"
                  />
                )}
                <ChevronRight className="tm-stop-chevron size-4" />
              </button>

              {/* Expanded editor */}
              {isSelected && canEdit && (
                <div className="tm-stop-editor">
                  <div className="tm-stop-fields">
                    <label>
                      <span>Day</span>
                      <input
                        type="number"
                        min={1}
                        value={stop.dayNumber ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          void updateStopMeta({
                            stopId: stop._id,
                            dayNumber: e.currentTarget.value
                              ? Number(e.currentTarget.value)
                              : null,
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Arrive</span>
                      <input
                        type="time"
                        value={stop.plannedArrivalTime ?? ""}
                        onChange={(e) =>
                          void updateStopMeta({
                            stopId: stop._id,
                            plannedArrivalTime:
                              e.currentTarget.value || null,
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Depart</span>
                      <input
                        type="time"
                        value={stop.plannedDepartureTime ?? ""}
                        onChange={(e) =>
                          void updateStopMeta({
                            stopId: stop._id,
                            plannedDepartureTime:
                              e.currentTarget.value || null,
                          })
                        }
                      />
                    </label>
                  </div>
                  <textarea
                    className="tm-stop-notes-input"
                    placeholder="Add notes for this stop…"
                    value={stop.note ?? ""}
                    onChange={(e) =>
                      void updateStopMeta({
                        stopId: stop._id,
                        note: e.currentTarget.value.trim() || null,
                      })
                    }
                  />
                  <div className="tm-stop-actions">
                    <div className="tm-move-group">
                      <button
                        type="button"
                        disabled={stop.orderIndex === 0}
                        onClick={() =>
                          void reorderStops({
                            tripId: trip._id,
                            stopId: stop._id,
                            direction: "up",
                          })
                        }
                      >
                        <ChevronUp className="size-3.5" />
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={stop.orderIndex === stops.length - 1}
                        onClick={() =>
                          void reorderStops({
                            tripId: trip._id,
                            stopId: stop._id,
                            direction: "down",
                          })
                        }
                      >
                        <ChevronDown className="size-3.5" />
                        Down
                      </button>
                    </div>
                    <button
                      type="button"
                      className="tm-remove-btn"
                      onClick={() => void removeStop({ stopId: stop._id })}
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Route map (illustrated) ── */

function TripRouteMap({
  stops,
  routeCoordinates,
  selectedStopId,
  onSelectStop,
  budget,
}: {
  stops: TripStop[];
  routeCoordinates: [number, number][];
  selectedStopId: Id<"tripStops"> | null;
  onSelectStop: (id: Id<"tripStops">) => void;
  budget: Workspace["budget"];
}) {
  const km = calculateRouteDistanceKm(routeCoordinates);
  const driveTime = estimateDriveTime(km);
  const displayStops = stops.slice(0, 7);

  return (
    <div className="tm-map-card">
      {/* Map background texture */}
      <div className="tm-map-bg" aria-hidden="true">
        <div className="tm-map-lake tm-lake-a" />
        <div className="tm-map-lake tm-lake-b" />
      </div>

      {/* Route line */}
      <svg className="tm-route-svg" viewBox="0 0 700 560" aria-hidden="true">
        <path d="M430 60 C410 130 368 145 362 200 C354 278 300 280 294 350 C286 440 180 410 120 480" />
        <path d="M294 350 C254 406 245 466 150 498" />
      </svg>

      {/* Pin markers */}
      {displayStops.map((stop, idx) => (
        <button
          key={stop._id}
          type="button"
          className={`tm-pin ${selectedStopId === stop._id ? "is-selected" : ""}`}
          style={{
            left: PIN_POSITIONS[idx % PIN_POSITIONS.length].left,
            top: PIN_POSITIONS[idx % PIN_POSITIONS.length].top,
          } as CSSProperties}
          onClick={() => onSelectStop(stop._id)}
        >
          <span>{idx + 1}</span>
          <strong>{stop.place.title}</strong>
        </button>
      ))}

      {/* Stats overlay */}
      <div className="tm-map-stats">
        <div className="tm-map-stat">
          <Route className="size-4" />
          <strong>{km ? `${km} km` : "—"}</strong>
        </div>
        <div className="tm-map-stat">
          <Car className="size-4" />
          <strong>{driveTime}</strong>
        </div>
        <div className="tm-map-stat">
          <WalletCards className="size-4" />
          <strong>
            {formatCurrency(
              budget?.estimatedTotal ?? 0,
              budget?.currency ?? "NAD",
            )}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* ── Day strip ── */

function TripDayStrip({
  stops,
  selectedStopId,
  onSelectStop,
}: {
  stops: TripStop[];
  selectedStopId: Id<"tripStops"> | null;
  onSelectStop: (id: Id<"tripStops">) => void;
}) {
  if (stops.length === 0) return null;

  return (
    <div className="tm-day-strip">
      <div className="tm-day-strip-scroll">
        {stops.slice(0, 10).map((stop, idx) => (
          <button
            key={stop._id}
            type="button"
            className={`tm-day-card ${selectedStopId === stop._id ? "is-selected" : ""}`}
            onClick={() => onSelectStop(stop._id)}
          >
            <span className="tm-day-label">
              Day {stop.dayNumber ?? idx + 1}
            </span>
            <strong className="tm-day-name">{stop.place.title}</strong>
            <div
              className="tm-day-img"
              style={{
                backgroundImage: stop.place.heroImage
                  ? `url(${stop.place.heroImage})`
                  : undefined,
              }}
            />
          </button>
        ))}
        <Link href="/explore" className="tm-day-add" aria-label="Add stop">
          <Plus className="size-5" />
        </Link>
      </div>
    </div>
  );
}

/* ── Main component ── */

export function TripWorkspace() {
  const pageState = useQuery(api.trips.getTripsPageState);
  const createDraftTrip = useMutation(api.trips.createDraftTrip);
  const startTrip = useMutation(api.trips.startTrip);
  const endTrip = useMutation(api.trips.endTrip);
  const [selectedStopId, setSelectedStopId] = useState<Id<"tripStops"> | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<
    "create" | "start" | "end" | null
  >(null);
  const workspace = (pageState?.currentTrip ?? null) as Workspace | null;
  const trip = workspace?.trip ?? null;
  const stops = workspace?.stops ?? [];

  useEffect(() => {
    if (!selectedStopId && stops[0]) {
      setSelectedStopId(stops[0]._id);
    }
    if (selectedStopId && !stops.some((s) => s._id === selectedStopId)) {
      setSelectedStopId(stops[0]?._id ?? null);
    }
  }, [selectedStopId, stops]);

  async function runAction(action: "create" | "start" | "end") {
    if (busyAction) return;
    setBusyAction(action);
    try {
      if (action === "create") {
        await createDraftTrip({
          title: "Namibia road trip",
          description: "A flexible road trip plan.",
        });
      } else if (action === "start" && trip) {
        await startTrip({ tripId: trip._id });
      } else if (action === "end" && trip) {
        await endTrip({ tripId: trip._id });
      }
    } finally {
      setBusyAction(null);
    }
  }

  /* Loading */
  if (pageState === undefined) {
    return <TripLoading />;
  }

  /* Empty */
  if (!trip) {
    return (
      <TripEmpty
        onCreateTrip={() => void runAction("create")}
        isCreating={busyAction === "create"}
      />
    );
  }

  /* Active workspace */
  return (
    <section className="tm-workspace">
      <TripHeader
        trip={trip}
        stopCount={stops.length}
        onStartTrip={() => void runAction("start")}
        onEndTrip={() => void runAction("end")}
        isBusy={busyAction !== null}
      />

      <TripStatsBar
        routeCoordinates={workspace?.routeCoordinates ?? []}
        budget={workspace?.budget ?? null}
        stopCount={stops.length}
        dayCount={trip.dayCount}
      />

      <div className="tm-grid">
        {/* Left: itinerary */}
        <div className="tm-itinerary-col">
          <div className="tm-itinerary-header">
            <h2>Itinerary</h2>
            <Link href="/explore" className="tm-btn-sm tm-btn-sm--ghost">
              <Plus className="size-3.5" />
              Add
            </Link>
          </div>
          <TripDayPills
            stops={stops}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
          <div className="tm-itinerary-scroll">
            <TripTimeline
              trip={trip}
              stops={stops}
              selectedStopId={selectedStopId}
              selectedDay={selectedDay}
              onSelectStop={setSelectedStopId}
            />
          </div>
        </div>

        {/* Right: map */}
        <TripRouteMap
          stops={stops}
          routeCoordinates={workspace?.routeCoordinates ?? []}
          selectedStopId={selectedStopId}
          onSelectStop={setSelectedStopId}
          budget={workspace?.budget ?? null}
        />
      </div>

      <TripDayStrip
        stops={stops}
        selectedStopId={selectedStopId}
        onSelectStop={setSelectedStopId}
      />
    </section>
  );
}
