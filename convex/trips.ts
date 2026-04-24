import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  createDraftTripForViewer,
  ensureViewerPreferences,
  getTripDayCount,
  getTripByIdForViewer,
  getTripStops,
  getViewerTrips,
  getOptionalViewerId,
  type PlannerCtx,
  requireViewerId,
  resolveEffectiveTrip,
} from "./planner";
import type { Doc, Id } from "./_generated/dataModel";
import { buildBudgetSummary } from "./budgets";
import { buildBookingSummary } from "./bookings";
import { buildLiveSessionState, endLiveSessionForTrip } from "./liveTrips";
import {
  DEFAULT_TRIP_TITLE,
  LEGACY_DEFAULT_NAMIBIA_TRIP_TITLE,
} from "../lib/namibia-data";

function summarizeTrip(trip: Doc<"trips">, stopCount: number, dayCount: number) {
  const normalizedTitle =
    trip.title === LEGACY_DEFAULT_NAMIBIA_TRIP_TITLE
      ? DEFAULT_TRIP_TITLE
      : trip.title;

  return {
    _id: trip._id,
    title: normalizedTitle,
    description: trip.description,
    status: trip.status,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverImage: trip.coverImage,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    stopCount,
    dayCount,
  };
}

type TripSummary = ReturnType<typeof summarizeTrip>;

type TripWorkspaceStop = {
  _id: Id<"tripStops">;
  tripId: Id<"trips">;
  placeId: Id<"places">;
  orderIndex: number;
  dayNumber: number | null;
  note: string | null;
  plannedArrivalTime: string | null;
  plannedDepartureTime: string | null;
  place: Doc<"places">;
};

type TripWorkspaceState = {
  activeTripId: Id<"trips"> | null;
  trip: TripSummary | null;
  routeCoordinates: [number, number][];
  stops: TripWorkspaceStop[];
  budget: Awaited<ReturnType<typeof buildBudgetSummary>> | null;
  bookings: Awaited<ReturnType<typeof buildBookingSummary>> | null;
  live: Awaited<ReturnType<typeof buildLiveSessionState>> | null;
};

async function buildTripSummaries(ctx: PlannerCtx, trips: Doc<"trips">[]) {
  return await Promise.all(
    trips.map(async (trip) => {
      const stops = await getTripStops(ctx, trip._id);
      return summarizeTrip(trip, stops.length, getTripDayCount(stops));
    }),
  );
}

async function buildTripWorkspace(
  ctx: PlannerCtx,
  trip: Doc<"trips"> | null,
): Promise<TripWorkspaceState> {
  if (!trip) {
    return {
      activeTripId: null,
      trip: null,
      routeCoordinates: [],
      stops: [],
      budget: null,
      bookings: null,
      live: null,
    };
  }

  const stops = await getTripStops(ctx, trip._id);
  const stopsWithPlaces = await Promise.all(
    stops.map(async (stop) => {
      const place = await ctx.db.get(stop.placeId);
      if (!place) {
        throw new Error("Trip stop place is missing.");
      }

      return {
        _id: stop._id,
        tripId: stop.tripId,
        placeId: stop.placeId,
        orderIndex: stop.orderIndex,
        dayNumber: stop.dayNumber,
        note: stop.note,
        plannedArrivalTime: stop.plannedArrivalTime,
        plannedDepartureTime: stop.plannedDepartureTime,
        place,
      };
    }),
  );

  const [budget, bookings, live] = await Promise.all([
    buildBudgetSummary(ctx, trip),
    buildBookingSummary(ctx, trip),
    buildLiveSessionState(ctx, trip),
  ]);

  return {
    activeTripId: trip._id,
    trip: summarizeTrip(trip, stops.length, getTripDayCount(stops)),
    routeCoordinates: stopsWithPlaces.map((stop) => [
      stop.place.coordinates[0] ?? 0,
      stop.place.coordinates[1] ?? 0,
    ]) as [number, number][],
    stops: stopsWithPlaces,
    budget,
    bookings,
    live,
  };
}

export const listViewerTrips = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireViewerId(ctx);
    const trips = await getViewerTrips(ctx, userId);
    return await buildTripSummaries(ctx, trips);
  },
});

export const getActiveTrip = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireViewerId(ctx);
    const trip = await resolveEffectiveTrip(ctx, userId);
    return trip?._id ?? null;
  },
});

export const createDraftTrip = mutation({
  args: {
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    coverImage: v.optional(v.union(v.string(), v.null())),
    startDate: v.optional(v.union(v.string(), v.null())),
    endDate: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await createDraftTripForViewer(ctx, userId, args);
    return { tripId: trip._id };
  },
});

export const setActiveTrip = mutation({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    if (trip.status === "completed") {
      throw new Error("Completed trips cannot be set as the current trip.");
    }

    const preferences = await ensureViewerPreferences(ctx, userId);
    await ctx.db.patch(preferences._id, {
      activeTripId: trip._id,
      updatedAt: Date.now(),
    });

    return { tripId: trip._id };
  },
});

export const startTrip = mutation({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);

    if (trip.status !== "draft") {
      throw new Error("Only draft trips can be started.");
    }

    const stops = await getTripStops(ctx, trip._id);
    if (stops.length === 0) {
      throw new Error("Add at least one stop before starting this trip.");
    }

    const now = Date.now();
    await ctx.db.patch(trip._id, {
      status: "active",
      updatedAt: now,
    });

    const preferences = await ensureViewerPreferences(ctx, userId);
    await ctx.db.patch(preferences._id, {
      activeTripId: trip._id,
      updatedAt: now,
    });

    return { tripId: trip._id, status: "active" as const };
  },
});

export const endTrip = mutation({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);

    if (trip.status !== "active") {
      throw new Error("Only active trips can be ended.");
    }

    const now = Date.now();
    await ctx.db.patch(trip._id, {
      status: "completed",
      updatedAt: now,
    });
    await endLiveSessionForTrip(ctx, trip._id, userId);

    const preferences = await ensureViewerPreferences(ctx, userId);
    if (preferences.activeTripId === trip._id) {
      await ctx.db.patch(preferences._id, {
        activeTripId: null,
        updatedAt: now,
      });
    }

    return { tripId: trip._id, status: "completed" as const };
  },
});

export const getTripWorkspace = query({
  args: {
    tripId: v.optional(v.union(v.id("trips"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getOptionalViewerId(ctx);
    if (!userId) {
      return await buildTripWorkspace(ctx, null);
    }

    const trip = await resolveEffectiveTrip(ctx, userId, args.tripId ?? null);
    return await buildTripWorkspace(ctx, trip);
  },
});

export const getTripsPageState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireViewerId(ctx);
    const currentTrip = await resolveEffectiveTrip(ctx, userId);

    if (currentTrip) {
      return {
        currentTrip: await buildTripWorkspace(ctx, currentTrip),
        recentCompletedTrip: null,
      };
    }

    const trips = await getViewerTrips(ctx, userId);
    const recentCompleted = trips.find((trip) => trip.status === "completed");

    if (!recentCompleted) {
      return {
        currentTrip: null,
        recentCompletedTrip: null,
      };
    }

    const stops = await getTripStops(ctx, recentCompleted._id);
    return {
      currentTrip: null,
      recentCompletedTrip: summarizeTrip(
        recentCompleted,
        stops.length,
        getTripDayCount(stops),
      ),
    };
  },
});
