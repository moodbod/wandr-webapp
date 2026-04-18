import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  createDraftTripForViewer,
  ensureViewerPreferences,
  getTripDayCount,
  getTripStops,
  getViewerTrips,
  type PlannerCtx,
  requireViewerId,
  resolveEffectiveTrip,
} from "./planner";
import type { Doc, Id } from "./_generated/dataModel";

function summarizeTrip(trip: Doc<"trips">, stopCount: number, dayCount: number) {
  return {
    _id: trip._id,
    title: trip.title,
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

async function buildTripSummaries(
  ctx: PlannerCtx,
  trips: Doc<"trips">[],
) {
  return await Promise.all(
    trips.map(async (trip) => {
      const stops = await getTripStops(ctx, trip._id);
      return summarizeTrip(trip, stops.length, getTripDayCount(stops));
    }),
  );
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
    const trip = await resolveEffectiveTrip(ctx, userId, args.tripId);
    if (!trip) {
      throw new Error("Trip not found.");
    }

    const preferences = await ensureViewerPreferences(ctx, userId);
    await ctx.db.patch(preferences._id, {
      activeTripId: trip._id,
      updatedAt: Date.now(),
    });

    return { tripId: trip._id };
  },
});

export const getTripWorkspace = query({
  args: {
    tripId: v.optional(v.union(v.id("trips"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await resolveEffectiveTrip(ctx, userId, args.tripId ?? null);

    if (!trip) {
      return {
        activeTripId: null,
        trip: null,
        routeCoordinates: [] as [number, number][],
        stops: [] as Array<{
          _id: Id<"tripStops">;
          tripId: Id<"trips">;
          placeId: Id<"places">;
          orderIndex: number;
          dayNumber: number | null;
          note: string | null;
          plannedArrivalTime: string | null;
          plannedDepartureTime: string | null;
          place: Doc<"places">;
        }>,
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

    return {
      activeTripId: trip._id,
      trip: summarizeTrip(trip, stops.length, getTripDayCount(stops)),
      routeCoordinates: stopsWithPlaces.map((stop) => [
        stop.place.coordinates[0] ?? 0,
        stop.place.coordinates[1] ?? 0,
      ]) as [number, number][],
      stops: stopsWithPlaces,
    };
  },
});
