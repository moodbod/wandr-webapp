import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getTripByIdForViewer, getTripStops, requireViewerId, type PlannerCtx } from "./planner";

const EARTH_RADIUS_KM = 6371;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceInKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const dLat = degreesToRadians(to.latitude - from.latitude);
  const dLon = degreesToRadians(to.longitude - from.longitude);
  const lat1 = degreesToRadians(from.latitude);
  const lat2 = degreesToRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getActiveSession(ctx: PlannerCtx, tripId: Id<"trips">) {
  return await ctx.db
    .query("tripLiveSessions")
    .withIndex("by_trip_id_and_status", (q) =>
      q.eq("tripId", tripId).eq("status", "active"),
    )
    .first();
}

async function findNearestStop(
  ctx: PlannerCtx,
  tripId: Id<"trips">,
  latitude: number,
  longitude: number,
) {
  const stops = await getTripStops(ctx, tripId);
  let nearest: { stopId: Id<"tripStops">; distanceKm: number } | null = null;

  for (const stop of stops) {
    const place = await ctx.db.get(stop.placeId);
    if (!place) {
      continue;
    }

    const distanceKm = distanceInKm(
      { latitude, longitude },
      {
        latitude: place.coordinates[1] ?? 0,
        longitude: place.coordinates[0] ?? 0,
      },
    );

    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { stopId: stop._id, distanceKm };
    }
  }

  return nearest;
}

export async function buildLiveSessionState(ctx: PlannerCtx, trip: Doc<"trips">) {
  const session = await getActiveSession(ctx, trip._id);
  if (!session) {
    return { session: null, nearestStop: null, distanceToNearestKm: null };
  }

  if (session.nearestStopId && session.latestLatitude && session.latestLongitude) {
    const stop = await ctx.db.get(session.nearestStopId);
    const place = stop ? await ctx.db.get(stop.placeId) : null;

    if (stop && place) {
      const distanceToNearestKm = distanceInKm(
        {
          latitude: session.latestLatitude,
          longitude: session.latestLongitude,
        },
        {
          latitude: place.coordinates[1] ?? 0,
          longitude: place.coordinates[0] ?? 0,
        },
      );

      return {
        session,
        nearestStop: { ...stop, place },
        distanceToNearestKm,
      };
    }
  }

  return { session, nearestStop: null, distanceToNearestKm: null };
}

export async function endLiveSessionForTrip(
  ctx: MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">,
) {
  const activeSession = await getActiveSession(ctx, tripId);
  if (!activeSession || activeSession.userId !== userId) {
    return null;
  }

  const now = Date.now();
  await ctx.db.patch(activeSession._id, {
    status: "ended",
    endedAt: now,
    updatedAt: now,
  });

  return activeSession._id;
}

export const getActiveLiveSession = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    return await buildLiveSessionState(ctx, trip);
  },
});

export const startLiveSession = mutation({
  args: {
    tripId: v.id("trips"),
    latitude: v.optional(v.union(v.number(), v.null())),
    longitude: v.optional(v.union(v.number(), v.null())),
    accuracy: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    if (trip.status !== "active") {
      throw new Error("Start the trip before starting live tracking.");
    }

    const existing = await getActiveSession(ctx, trip._id);
    const now = Date.now();
    const latitude = args.latitude ?? null;
    const longitude = args.longitude ?? null;
    const nearest =
      latitude !== null && longitude !== null
        ? await findNearestStop(ctx, trip._id, latitude, longitude)
        : null;

    if (existing) {
      await ctx.db.patch(existing._id, {
        latestLatitude: latitude,
        latestLongitude: longitude,
        latestAccuracy: args.accuracy ?? null,
        latestRecordedAt: latitude !== null && longitude !== null ? now : null,
        nearestStopId: nearest?.stopId ?? existing.nearestStopId,
        updatedAt: now,
      });

      return { sessionId: existing._id };
    }

    const sessionId = await ctx.db.insert("tripLiveSessions", {
      tripId: trip._id,
      userId,
      status: "active",
      consentedAt: now,
      startedAt: now,
      endedAt: null,
      latestLatitude: latitude,
      latestLongitude: longitude,
      latestAccuracy: args.accuracy ?? null,
      latestRecordedAt: latitude !== null && longitude !== null ? now : null,
      nearestStopId: nearest?.stopId ?? null,
      arrivedStopId: null,
      arrivedAt: null,
      departedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return { sessionId };
  },
});

export const updateLatestLocation = mutation({
  args: {
    tripId: v.id("trips"),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    if (trip.status !== "active") {
      throw new Error("Only active trips can receive live locations.");
    }

    const session = await getActiveSession(ctx, trip._id);
    if (!session || session.userId !== userId) {
      throw new Error("Live tracking has not been started for this trip.");
    }

    const nearest = await findNearestStop(
      ctx,
      trip._id,
      args.latitude,
      args.longitude,
    );
    const now = Date.now();
    await ctx.db.patch(session._id, {
      latestLatitude: args.latitude,
      latestLongitude: args.longitude,
      latestAccuracy: args.accuracy ?? null,
      latestRecordedAt: now,
      nearestStopId: nearest?.stopId ?? null,
      updatedAt: now,
    });

    return { nearestStopId: nearest?.stopId ?? null, distanceKm: nearest?.distanceKm ?? null };
  },
});

export const markArrival = mutation({
  args: {
    tripId: v.id("trips"),
    stopId: v.id("tripStops"),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    const stop = await ctx.db.get(args.stopId);
    if (!stop || stop.tripId !== trip._id) {
      throw new Error("Stop not found for this trip.");
    }

    const session = await getActiveSession(ctx, trip._id);
    if (!session || session.userId !== userId) {
      throw new Error("Live tracking has not been started for this trip.");
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      arrivedStopId: stop._id,
      arrivedAt: now,
      departedAt: null,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const markDeparture = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    const session = await getActiveSession(ctx, trip._id);
    if (!session || session.userId !== userId) {
      throw new Error("Live tracking has not been started for this trip.");
    }

    const now = Date.now();
    await ctx.db.patch(session._id, { departedAt: now, updatedAt: now });

    return { success: true };
  },
});

export const endLiveSession = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    await getTripByIdForViewer(ctx, args.tripId, userId);
    const sessionId = await endLiveSessionForTrip(ctx, args.tripId, userId);

    return { sessionId };
  },
});