"use client";

import Link from "next/link";
import { useRoutePreview } from "@/components/maps/use-route-preview";
import { WandrMap, type WandrMapMarker } from "@/components/maps/wandr-map";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  Flag,
  Hotel,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  ReceiptText,
  Route,
  Send,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TripStatus = "draft" | "planned" | "active" | "completed";
type BoardTab = "plan" | "budget" | "bookings" | "live";
type BudgetCategory = "activity" | "stay" | "transport" | "food" | "park_fees" | "manual";

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
  tripId: Id<"trips">;
  placeId: Id<"places">;
  dayNumber: number | null;
  note: string | null;
  orderIndex: number;
  plannedArrivalTime: string | null;
  plannedDepartureTime: string | null;
  place: {
    _id: Id<"places">;
    coordinates: number[];
    title: string;
    region: string;
    summary: string;
    category: string;
    estimatedVisitDuration: string;
    driveTimeFromWindhoek: string;
  };
};

type BudgetItem = {
  _id: Id<"tripBudgetItems">;
  stopId: Id<"tripStops"> | null;
  category: BudgetCategory;
  label: string;
  estimatedAmount: number;
  actualAmount: number | null;
  currency: string;
};

type BudgetSummary = {
  budget: { _id: Id<"tripBudgets">; targetAmount: number; currency: string } | null;
  items: BudgetItem[];
  currency: string;
  targetAmount: number;
  estimatedTotal: number;
  actualTotal: number;
  remainingAmount: number | null;
  isOverBudget: boolean;
  categories: Array<{ category: BudgetCategory; estimatedTotal: number; actualTotal: number; itemCount: number }>;
};

type BookableOffer = {
  _id: Id<"bookableOffers">;
  placeId: Id<"places">;
  kind: "activity" | "tour" | "stay" | "transport";
  title: string;
  providerName: string;
  description: string;
  priceEstimate: number;
  currency: string;
  duration: string;
};

type BookingRequest = {
  _id: Id<"bookingRequests">;
  stopId: Id<"tripStops"> | null;
  status: "draft" | "requested" | "confirmed" | "declined" | "cancelled";
  requestedDateTime: string | null;
  guestCount: number;
  note: string | null;
  estimatedTotal: number;
  currency: string;
  offer: BookableOffer | null;
  place: { title: string; region: string } | null;
};

type BookingSummary = {
  requests: BookingRequest[];
  requestedCount: number;
  confirmedCount: number;
  activeCount: number;
};

type LiveSessionState = {
  session: {
    _id: Id<"tripLiveSessions">;
    latestLatitude: number | null;
    latestLongitude: number | null;
    latestRecordedAt: number | null;
    nearestStopId: Id<"tripStops"> | null;
    arrivedStopId: Id<"tripStops"> | null;
    arrivedAt: number | null;
    departedAt: number | null;
  } | null;
  nearestStop: TripWorkspaceStop | null;
  distanceToNearestKm: number | null;
};

type CurrentTripState = {
  activeTripId: Id<"trips"> | null;
  trip: TripSummary;
  routeCoordinates: [number, number][];
  stops: TripWorkspaceStop[];
  budget: BudgetSummary | null;
  bookings: BookingSummary | null;
  live: LiveSessionState | null;
};

const EMPTY_STOPS: TripWorkspaceStop[] = [];
const EMPTY_ROUTE_COORDINATES: [number, number][] = [];
const tabs: Array<{ id: BoardTab; label: string; icon: typeof Route }> = [
  { id: "plan", label: "Plan", icon: Route },
  { id: "budget", label: "Budget", icon: WalletCards },
  { id: "bookings", label: "Bookings", icon: Hotel },
  { id: "live", label: "Live", icon: LocateFixed },
];

const categoryLabels: Record<BudgetCategory, string> = {
  activity: "Activities",
  stay: "Stays",
  transport: "Transport",
  food: "Food",
  park_fees: "Park fees",
  manual: "Manual",
};

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function fmtDate(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}

function fmtRange(s: string | null | undefined, e: string | null | undefined) {
  const a = fmtDate(s);
  const b = fmtDate(e);
  if (a && b) return `${a} - ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return "Flexible dates";
}

function money(value: number, currency = "NAD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition | null>((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 12000,
    });
  });
}

function TripsLoadingState() {
  return (
    <section className="trip-uber-screen">
      <WandrMap className="trip-uber-map" markers={[]} routeCoordinates={[]} showLoader={false} />
      <div className="trip-uber-loading">
        <div className="trip-uber-loading-spinner" />
        <p className="trip-uber-loading-text">Loading your trip...</p>
      </div>
    </section>
  );
}

function EmptyTripState() {
  return (
    <section className="trip-uber-screen">
      <WandrMap className="trip-uber-map" markers={[]} routeCoordinates={[]} showLoader={false} />
      <div className="trip-uber-sheet trip-uber-sheet--centered">
        <div className="trip-uber-empty-icon">
          <Navigation className="size-7 text-[#9fe870]" strokeWidth={2.2} />
        </div>
        <h1 className="trip-uber-empty-title">Where to?</h1>
        <p className="trip-uber-empty-desc">Start on Explore and add landmarks, stays, and activities to shape your route.</p>
        <Link href="/explore" className="trip-uber-btn trip-uber-btn--primary">
          <Compass className="size-[1.1rem]" strokeWidth={2.4} />
          Explore places
        </Link>
      </div>
    </section>
  );
}

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
      <WandrMap className="trip-uber-map" markers={[]} routeCoordinates={[]} showLoader={false} />
      <div className="trip-uber-sheet">
        <div className="trip-uber-completed-badge">
          <Flag className="size-3.5" />
          Trip completed
        </div>
        <h1 className="trip-uber-sheet-title">{trip.title}</h1>
        <p className="trip-uber-sheet-meta">{fmtRange(trip.startDate, trip.endDate)} . {trip.stopCount} stops</p>
        <p className="trip-uber-sheet-caption">This journey is saved. Start another one from Explore whenever you are ready.</p>
        <div className="trip-uber-actions">
          <button type="button" onClick={onStartNextTrip} disabled={isStartingNextTrip} className="trip-uber-btn trip-uber-btn--accent">
            <Route className="size-[1.1rem]" strokeWidth={2.2} />
            {isStartingNextTrip ? "Starting..." : "New trip"}
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

function JourneyBoard({
  activeTab,
  bookingStopId,
  canStartTrip,
  currentTrip,
  isPlanningUnlocked,
  markers,
  offers,
  onCancelBooking,
  onCreateBooking,
  onEnableLive,
  onEndTrip,
  onMarkArrival,
  onMarkDeparture,
  onRemoveBudgetItem,
  onRemoveStop,
  onReorder,
  onSetActiveTab,
  onSetBookingStopId,
  onSetBudget,
  onStartTrip,
  onUpdateBudgetItem,
  onUpdateMeta,
  pendingAction,
  routeCoordinates,
}: {
  activeTab: BoardTab;
  bookingStopId: Id<"tripStops"> | null;
  canStartTrip: boolean;
  currentTrip: CurrentTripState;
  isPlanningUnlocked: boolean;
  markers: WandrMapMarker[];
  offers: BookableOffer[] | undefined;
  onCancelBooking: (requestId: Id<"bookingRequests">) => void;
  onCreateBooking: (offerId: Id<"bookableOffers">, stopId: Id<"tripStops"> | null) => void;
  onEnableLive: () => void;
  onEndTrip: () => void;
  onMarkArrival: (stopId: Id<"tripStops">) => void;
  onMarkDeparture: () => void;
  onRemoveBudgetItem: (itemId: Id<"tripBudgetItems">) => void;
  onRemoveStop: (stopId: Id<"tripStops">) => void;
  onReorder: (stopId: Id<"tripStops">, direction: "up" | "down") => void;
  onSetActiveTab: (tab: BoardTab) => void;
  onSetBookingStopId: (stopId: Id<"tripStops"> | null) => void;
  onSetBudget: (targetAmount: number, currency: string) => void;
  onStartTrip: () => void;
  onUpdateBudgetItem: (input: { category: BudgetCategory; label: string; estimatedAmount: number; stopId: Id<"tripStops"> | null }) => void;
  onUpdateMeta: (stopId: Id<"tripStops">, patch: { dayNumber?: number | null; note?: string | null; plannedArrivalTime?: string | null; plannedDepartureTime?: string | null }) => void;
  pendingAction: "budget" | "booking" | "end" | "live" | "next" | "start" | null;
  routeCoordinates: [number, number][];
}) {
  const { budget, bookings, live, stops, trip } = currentTrip;
  const isActive = trip.status === "active";
  const selectedBookingStop = stops.find((stop) => stop._id === bookingStopId) ?? stops[0] ?? null;

  return (
    <section className="trip-uber-screen">
      <WandrMap className="trip-uber-map" markers={markers} routeCoordinates={routeCoordinates} fitToData />
      <div className="trip-uber-status-pill">
        <span className={isActive ? "trip-uber-status-badge-active" : "trip-uber-status-badge-draft"}>
          {isActive ? <span className="trip-uber-status-dot" /> : null}
          {isActive ? "Live" : trip.status === "draft" ? "Draft" : "Planned"}
        </span>
        <span className="trip-uber-status-trip-name">{trip.title}</span>
        <span className="trip-uber-status-date">{fmtRange(trip.startDate, trip.endDate)}</span>
      </div>

      <div className="trip-uber-sheet trip-uber-sheet--itinerary !gap-4">
        <div className="trip-uber-sheet-handle" />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="trip-uber-itin-title">Journey board</h2>
            <p className="trip-uber-itin-count">{stops.length} stops . {money(budget?.estimatedTotal ?? 0, budget?.currency ?? "NAD")} planned</p>
          </div>
          <div className="trip-uber-itin-actions">
            {isPlanningUnlocked ? (
              <Link href="/explore" className="trip-uber-btn-sm trip-uber-btn-sm--dark"><Plus className="size-3.5" /> Add</Link>
            ) : null}
            {!isActive ? (
              <button type="button" onClick={onStartTrip} disabled={!canStartTrip || pendingAction !== null} className="trip-uber-btn-sm trip-uber-btn-sm--accent">
                <Navigation className="size-3.5" /> {pendingAction === "start" ? "Starting..." : "Go"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-[#f2f3ee] p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => onSetActiveTab(tab.id)} className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-[0.72rem] font-bold transition-colors ${selected ? "bg-white text-[#17181a] shadow-sm" : "text-[#737a70]"}`}>
                <Icon className="size-3.5" /> <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "plan" ? <PlanTab isPlanningUnlocked={isPlanningUnlocked} onRemoveStop={onRemoveStop} onReorder={onReorder} onUpdateMeta={onUpdateMeta} stops={stops} /> : null}
        {activeTab === "budget" ? <BudgetTab budget={budget} isLocked={!isPlanningUnlocked && !isActive} onRemoveBudgetItem={onRemoveBudgetItem} onSetBudget={onSetBudget} onUpdateBudgetItem={onUpdateBudgetItem} pending={pendingAction === "budget"} stops={stops} /> : null}
        {activeTab === "bookings" ? <BookingsTab bookingStopId={bookingStopId} bookings={bookings} offers={offers} onCancelBooking={onCancelBooking} onCreateBooking={onCreateBooking} onSetBookingStopId={onSetBookingStopId} pending={pendingAction === "booking"} selectedStop={selectedBookingStop} stops={stops} /> : null}
        {activeTab === "live" ? <LiveTab canStartTrip={canStartTrip} isActive={isActive} live={live} onEnableLive={onEnableLive} onEndTrip={onEndTrip} onMarkArrival={onMarkArrival} onMarkDeparture={onMarkDeparture} onStartTrip={onStartTrip} pendingAction={pendingAction} stops={stops} /> : null}
      </div>
    </section>
  );
}

function PlanTab({
  isPlanningUnlocked,
  onRemoveStop,
  onReorder,
  onUpdateMeta,
  stops,
}: {
  isPlanningUnlocked: boolean;
  onRemoveStop: (stopId: Id<"tripStops">) => void;
  onReorder: (stopId: Id<"tripStops">, direction: "up" | "down") => void;
  onUpdateMeta: (stopId: Id<"tripStops">, patch: { dayNumber?: number | null; note?: string | null; plannedArrivalTime?: string | null; plannedDepartureTime?: string | null }) => void;
  stops: TripWorkspaceStop[];
}) {
  const dayLimit = Math.max(...stops.map((stop) => stop.dayNumber ?? 0), stops.length, 5);

  if (stops.length === 0) {
    return (
      <div className="trip-uber-itin-empty">
        <MapPin className="size-6 text-[#9a9f97]" />
        <p className="trip-uber-itin-empty-title">No stops yet</p>
        <p className="trip-uber-itin-empty-desc">Explore and add landmarks to begin.</p>
      </div>
    );
  }

  return (
    <ul className="trip-uber-stop-list max-h-[48vh] overflow-y-auto pr-1">
      {stops.map((stop, index) => (
        <li key={stop._id} className="trip-uber-stop-row">
          <div className="trip-uber-stop-timeline">
            <span className="trip-uber-stop-num">{index + 1}</span>
            {index < stops.length - 1 ? <div className="trip-uber-stop-connector" /> : null}
          </div>
          <StopPlannerCard
            dayLimit={dayLimit}
            index={index}
            isFirst={index === 0}
            isLast={index === stops.length - 1}
            isPlanningUnlocked={isPlanningUnlocked}
            onRemoveStop={onRemoveStop}
            onReorder={onReorder}
            onUpdateMeta={onUpdateMeta}
            stop={stop}
          />
        </li>
      ))}
    </ul>
  );
}

function StopPlannerCard({
  dayLimit,
  index,
  isFirst,
  isLast,
  isPlanningUnlocked,
  onRemoveStop,
  onReorder,
  onUpdateMeta,
  stop,
}: {
  dayLimit: number;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isPlanningUnlocked: boolean;
  onRemoveStop: (stopId: Id<"tripStops">) => void;
  onReorder: (stopId: Id<"tripStops">, direction: "up" | "down") => void;
  onUpdateMeta: (stopId: Id<"tripStops">, patch: { dayNumber?: number | null; note?: string | null; plannedArrivalTime?: string | null; plannedDepartureTime?: string | null }) => void;
  stop: TripWorkspaceStop;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="trip-uber-stop-content">
      <button type="button" onClick={() => setOpen((current) => !current)} className="trip-uber-stop-header">
        <div className="trip-uber-stop-header-text">
          <p className="trip-uber-stop-title">{stop.place.title}</p>
          <p className="trip-uber-stop-subtitle">
            {stop.place.region}{stop.dayNumber ? ` . Day ${stop.dayNumber}` : " . Unscheduled"}{stop.plannedArrivalTime ? ` . ${stop.plannedArrivalTime}` : ""}
          </p>
        </div>
        <ChevronDown className={`size-4 shrink-0 text-[#9a9f97] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="trip-uber-stop-detail">
          <p className="trip-uber-stop-summary">{stop.place.summary}</p>
          <div className="trip-uber-stop-tags">
            <span className="trip-uber-tag">{stop.place.category}</span>
            <span className="trip-uber-tag">{stop.place.estimatedVisitDuration}</span>
            <span className="trip-uber-tag">{stop.place.driveTimeFromWindhoek} drive</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="space-y-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[#7a8374]">
              Day
              <select value={stop.dayNumber ?? 0} disabled={!isPlanningUnlocked} onChange={(event) => onUpdateMeta(stop._id, { dayNumber: Number(event.target.value) === 0 ? null : Number(event.target.value) })} className="trip-uber-day-select !mt-1">
                <option value={0}>None</option>
                {Array.from({ length: dayLimit }, (_, day) => <option key={day + 1} value={day + 1}>Day {day + 1}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[#7a8374]">
              Arrive
              <input type="time" defaultValue={stop.plannedArrivalTime ?? ""} disabled={!isPlanningUnlocked} onBlur={(event) => onUpdateMeta(stop._id, { plannedArrivalTime: event.target.value || null })} className="trip-uber-day-select !mt-1" />
            </label>
            <label className="space-y-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[#7a8374]">
              Leave
              <input type="time" defaultValue={stop.plannedDepartureTime ?? ""} disabled={!isPlanningUnlocked} onBlur={(event) => onUpdateMeta(stop._id, { plannedDepartureTime: event.target.value || null })} className="trip-uber-day-select !mt-1" />
            </label>
          </div>
          <textarea defaultValue={stop.note ?? ""} onBlur={(event) => onUpdateMeta(stop._id, { note: event.target.value.trim() || null })} placeholder="Add a note for this stop..." className="trip-uber-note-input" rows={2} />
          {isPlanningUnlocked ? (
            <div className="trip-uber-stop-actions">
              <div className="trip-uber-move-group">
                <button type="button" disabled={isFirst} onClick={() => onReorder(stop._id, "up")} className="trip-uber-move-btn"><ChevronUp className="size-3.5" /> Up</button>
                <button type="button" disabled={isLast} onClick={() => onReorder(stop._id, "down")} className="trip-uber-move-btn"><ChevronDown className="size-3.5" /> Down</button>
              </div>
              <button type="button" onClick={() => onRemoveStop(stop._id)} className="trip-uber-remove-btn"><Trash2 className="size-3.5" /> Remove</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function BudgetTab({
  budget,
}: {
  budget: BudgetSummary | null;
  isLocked: boolean;
  onRemoveBudgetItem: (itemId: Id<"tripBudgetItems">) => void;
  onSetBudget: (targetAmount: number, currency: string) => void;
  onUpdateBudgetItem: (input: { category: BudgetCategory; label: string; estimatedAmount: number; stopId: Id<"tripStops"> | null }) => void;
  pending: boolean;
  stops: TripWorkspaceStop[];
}) {
  const currency = budget?.currency ?? "NAD";
  const items = budget?.items ?? [];

  return (
    <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-1">
      <div className="rounded-2xl border border-[#e5e8e2] bg-white p-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#7a8374]">Automatic trip budget</p>
        <h3 className="mt-1 text-3xl font-black tracking-tight text-[#17181a]">
          {money(budget?.estimatedTotal ?? 0, currency)}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#66705f]">
          Budget is calculated only from activities and stays requested through Wandr. Landmarks do not add cost.
        </p>
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5e8e2] bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#17181a]">{item.label}</p>
              <p className="text-xs font-semibold text-[#7a8374]">{categoryLabels[item.category]}</p>
            </div>
            <span className="text-sm font-black text-[#17181a]">{money(item.estimatedAmount, item.currency)}</span>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#e5e8e2] bg-white p-5 text-center text-sm font-bold text-[#66705f]">
            Book an activity or stay to start your budget.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BookingsTab({ bookingStopId, bookings, offers, onCancelBooking, onCreateBooking, onSetBookingStopId, pending, selectedStop, stops }: {
  bookingStopId: Id<"tripStops"> | null;
  bookings: BookingSummary | null;
  offers: BookableOffer[] | undefined;
  onCancelBooking: (requestId: Id<"bookingRequests">) => void;
  onCreateBooking: (offerId: Id<"bookableOffers">, stopId: Id<"tripStops"> | null) => void;
  onSetBookingStopId: (stopId: Id<"tripStops"> | null) => void;
  pending: boolean;
  selectedStop: TripWorkspaceStop | null;
  stops: TripWorkspaceStop[];
}) {
  return (
    <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-1">
      <div className="rounded-2xl border border-[#e5e8e2] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#7a8374]">Book from a stop</p>
            <h3 className="mt-1 text-lg font-black text-[#17181a]">{selectedStop?.place.title ?? "Choose a stop"}</h3>
          </div>
          <ReceiptText className="size-5 text-[#9fe870]" />
        </div>
        <select value={bookingStopId ?? selectedStop?._id ?? ""} onChange={(event) => onSetBookingStopId(event.target.value ? (event.target.value as Id<"tripStops">) : null)} className="trip-uber-day-select mt-3">
          {stops.map((stop) => <option key={stop._id} value={stop._id}>{stop.place.title}</option>)}
        </select>
        <div className="mt-3 grid gap-2">
          {(offers ?? []).length === 0 ? <p className="rounded-2xl bg-[#f5f6f1] px-4 py-3 text-sm font-semibold text-[#66705f]">No requestable activities or stays for this stop yet.</p> : null}
          {(offers ?? []).map((offer) => (
            <div key={offer._id} className="rounded-2xl border border-[#e5e8e2] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#17181a]">{offer.title}</p>
                  <p className="mt-1 text-xs font-semibold text-[#70786b]">{offer.providerName} . {offer.duration}</p>
                  <p className="mt-2 text-xs leading-5 text-[#5d655f]">{offer.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#eef6e7] px-2.5 py-1 text-xs font-black text-[#315117]">{money(offer.priceEstimate, offer.currency)}</span>
              </div>
              <button type="button" disabled={pending} onClick={() => onCreateBooking(offer._id, selectedStop?._id ?? null)} className="trip-uber-btn-sm trip-uber-btn-sm--dark mt-3 w-full justify-center"><Send className="size-3.5" /> Request booking</button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        {(bookings?.requests ?? []).map((request) => (
          <div key={request._id} className="rounded-2xl border border-[#e5e8e2] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-[#17181a]">{request.offer?.title ?? "Booking request"}</p>
                <p className="mt-1 text-xs font-semibold text-[#70786b]">{request.place?.title ?? "Trip stop"} . {request.guestCount} traveler{request.guestCount === 1 ? "" : "s"}</p>
              </div>
              <span className="rounded-full bg-[#f2f3ee] px-2.5 py-1 text-xs font-black uppercase text-[#4c5549]">{request.status}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-sm font-black text-[#17181a]">{money(request.estimatedTotal, request.currency)}</span>
              {request.status !== "cancelled" ? <button type="button" onClick={() => onCancelBooking(request._id)} className="trip-uber-remove-btn">Cancel</button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveTab({ canStartTrip, isActive, live, onEnableLive, onEndTrip, onMarkArrival, onMarkDeparture, onStartTrip, pendingAction, stops }: {
  canStartTrip: boolean;
  isActive: boolean;
  live: LiveSessionState | null;
  onEnableLive: () => void;
  onEndTrip: () => void;
  onMarkArrival: (stopId: Id<"tripStops">) => void;
  onMarkDeparture: () => void;
  onStartTrip: () => void;
  pendingAction: "budget" | "booking" | "end" | "live" | "next" | "start" | null;
  stops: TripWorkspaceStop[];
}) {
  const nextStop = live?.nearestStop ?? stops[0] ?? null;

  if (!isActive) {
    return (
      <div className="rounded-2xl border border-[#e5e8e2] bg-white p-4 text-center">
        <LocateFixed className="mx-auto size-7 text-[#9fe870]" />
        <h3 className="mt-3 text-lg font-black text-[#17181a]">Start live trip mode</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#66705f]">Wandr will ask for foreground location permission, then use it to highlight your nearest planned stop.</p>
        <button type="button" disabled={!canStartTrip || pendingAction !== null} onClick={onStartTrip} className="trip-uber-btn trip-uber-btn--accent trip-uber-btn--full mt-4">
          <Navigation className="size-[1.1rem]" /> {pendingAction === "start" ? "Starting..." : "Start trip"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-1">
      <div className="rounded-2xl border border-[#e5e8e2] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#7a8374]">Active trip</p>
            <h3 className="mt-1 text-xl font-black text-[#17181a]">{nextStop ? nextStop.place.title : "Live route"}</h3>
          </div>
          <span className="trip-uber-status-badge-active"><span className="trip-uber-status-dot" /> Live</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#66705f]">
          {live?.session ? live.distanceToNearestKm !== null ? `${live.distanceToNearestKm.toFixed(1)} km from the nearest planned stop.` : "Location is enabled. Wandr will update the nearest stop as you move." : "Location tracking is not enabled for this active trip yet."}
        </p>
        {!live?.session ? <button type="button" disabled={pendingAction === "live"} onClick={onEnableLive} className="trip-uber-btn trip-uber-btn--accent trip-uber-btn--full mt-4"><LocateFixed className="size-[1.1rem]" /> {pendingAction === "live" ? "Enabling..." : "Enable location"}</button> : null}
        {nextStop && live?.session ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onMarkArrival(nextStop._id)} className="trip-uber-btn-sm trip-uber-btn-sm--dark justify-center"><CheckCircle2 className="size-3.5" /> Arrived</button>
            <button type="button" onClick={onMarkDeparture} className="trip-uber-btn-sm trip-uber-btn-sm--dark justify-center"><Clock3 className="size-3.5" /> Departed</button>
          </div>
        ) : null}
      </div>
      <button type="button" disabled={pendingAction === "end"} onClick={onEndTrip} className="trip-uber-btn trip-uber-btn--dark trip-uber-btn--full"><Route className="size-[1.1rem]" /> {pendingAction === "end" ? "Ending..." : "End trip"}</button>
    </div>
  );
}

export function TripWorkspace() {
  const tripsPage = useQuery(api.trips.getTripsPageState);
  const createDraftTrip = useMutation(api.trips.createDraftTrip);
  const endTrip = useMutation(api.trips.endTrip);
  const removeStop = useMutation(api.tripStops.removeStop);
  const reorder = useMutation(api.tripStops.reorderStops);
  const startTrip = useMutation(api.trips.startTrip);
  const updateMeta = useMutation(api.tripStops.updateStopMeta);
  const setTripBudget = useMutation(api.budgets.setTripBudget);
  const upsertBudgetItem = useMutation(api.budgets.upsertBudgetItem);
  const removeBudgetItem = useMutation(api.budgets.removeBudgetItem);
  const createBookingRequest = useMutation(api.bookings.createBookingRequest);
  const updateBookingRequestStatus = useMutation(api.bookings.updateBookingRequestStatus);
  const startLiveSession = useMutation(api.liveTrips.startLiveSession);
  const updateLatestLocation = useMutation(api.liveTrips.updateLatestLocation);
  const markArrival = useMutation(api.liveTrips.markArrival);
  const markDeparture = useMutation(api.liveTrips.markDeparture);
  const [activeTab, setActiveTab] = useState<BoardTab>("plan");
  const [bookingStopId, setBookingStopId] = useState<Id<"tripStops"> | null>(null);
  const [pendingAction, setPendingAction] = useState<"budget" | "booking" | "end" | "live" | "next" | "start" | null>(null);

  const currentTrip = (tripsPage?.currentTrip ?? null) as CurrentTripState | null;
  const recentCompletedTrip = (tripsPage?.recentCompletedTrip ?? null) as TripSummary | null;
  const currentStops = currentTrip?.stops ?? EMPTY_STOPS;
  const selectedBookingStop = currentStops.find((stop) => stop._id === bookingStopId) ?? currentStops[0] ?? null;
  const offers = useQuery(api.bookings.listOffersForPlace, selectedBookingStop ? { placeId: selectedBookingStop.placeId } : "skip") as BookableOffer[] | undefined;
  const routeCoordinates = useRoutePreview(currentTrip?.routeCoordinates ?? EMPTY_ROUTE_COORDINATES);

  const markers = useMemo<WandrMapMarker[]>(
    () => currentStops.map((stop, index) => ({
      id: stop._id,
      label: `${index + 1}. ${stop.place.title}`,
      coordinates: [stop.place.coordinates[0] ?? 0, stop.place.coordinates[1] ?? 0],
      note: stop.dayNumber ? `Day ${stop.dayNumber}` : undefined,
      emphasis: stop._id === currentTrip?.live?.session?.nearestStopId || index === 0,
    })),
    [currentStops, currentTrip?.live?.session?.nearestStopId],
  );

  useEffect(() => {
    if (!bookingStopId && currentStops[0]?._id) {
      setBookingStopId(currentStops[0]._id);
    }
  }, [bookingStopId, currentStops]);

  useEffect(() => {
    if (currentTrip?.trip.status !== "active" || !currentTrip.live?.session) return;
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void updateLatestLocation({
          tripId: currentTrip.trip._id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentTrip?.live?.session, currentTrip?.trip._id, currentTrip?.trip.status, updateLatestLocation]);

  async function enableLiveForTrip(tripId: Id<"trips">) {
    const position = await getCurrentPosition();
    if (!position) return false;
    await startLiveSession({
      tripId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
    return true;
  }

  async function handleStartTrip() {
    if (!currentTrip || pendingAction) return;
    setPendingAction("start");
    try {
      await startTrip({ tripId: currentTrip.trip._id });
      await enableLiveForTrip(currentTrip.trip._id);
      setActiveTab("live");
    } finally {
      setPendingAction(null);
    }
  }

  if (tripsPage === undefined) return <TripsLoadingState />;

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
  const isPlanningUnlocked = trip.status !== "active" && trip.status !== "completed";
  const canStartTrip = trip.status === "draft" && currentTrip.stops.length > 0;

  return (
    <JourneyBoard
      activeTab={activeTab}
      bookingStopId={bookingStopId}
      canStartTrip={canStartTrip}
      currentTrip={currentTrip}
      isPlanningUnlocked={isPlanningUnlocked}
      markers={markers}
      offers={offers}
      onCancelBooking={(requestId) => {
        setPendingAction("booking");
        void updateBookingRequestStatus({ requestId, status: "cancelled" }).finally(() => setPendingAction(null));
      }}
      onCreateBooking={(offerId, stopId) => {
        setPendingAction("booking");
        void createBookingRequest({ tripId: trip._id, stopId, offerId, guestCount: 1, requestedDateTime: null, note: null }).finally(() => setPendingAction(null));
      }}
      onEnableLive={() => {
        setPendingAction("live");
        void enableLiveForTrip(trip._id).finally(() => setPendingAction(null));
      }}
      onEndTrip={() => {
        setPendingAction("end");
        void endTrip({ tripId: trip._id }).finally(() => setPendingAction(null));
      }}
      onMarkArrival={(stopId) => void markArrival({ tripId: trip._id, stopId })}
      onMarkDeparture={() => void markDeparture({ tripId: trip._id })}
      onRemoveBudgetItem={(itemId) => void removeBudgetItem({ itemId })}
      onRemoveStop={(stopId) => void removeStop({ stopId })}
      onReorder={(stopId, direction) => void reorder({ tripId: trip._id, stopId, direction })}
      onSetActiveTab={setActiveTab}
      onSetBookingStopId={setBookingStopId}
      onSetBudget={(targetAmount, currency) => {
        setPendingAction("budget");
        void setTripBudget({ tripId: trip._id, targetAmount, currency }).finally(() => setPendingAction(null));
      }}
      onStartTrip={() => void handleStartTrip()}
      onUpdateBudgetItem={(input) => {
        setPendingAction("budget");
        void upsertBudgetItem({
          tripId: trip._id,
          itemId: null,
          stopId: input.stopId,
          category: input.category,
          label: input.label,
          estimatedAmount: input.estimatedAmount,
          actualAmount: null,
          currency: currentTrip.budget?.currency ?? "NAD",
        }).finally(() => setPendingAction(null));
      }}
      onUpdateMeta={(stopId, patch) => void updateMeta({ stopId, ...patch })}
      pendingAction={pendingAction}
      routeCoordinates={routeCoordinates}
    />
  );
}
