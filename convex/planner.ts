import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { DEFAULT_TRIP_TITLE, namibiaPlaceSeed } from "../lib/namibia-data";

type PlannerCtx = QueryCtx | MutationCtx;
export type { PlannerCtx };

export async function requireViewerId(ctx: PlannerCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Authenticated user profile is missing.");
  }

  return user._id;
}

export async function getViewerPreferences(ctx: PlannerCtx, userId: Id<"users">) {
  return await ctx.db
    .query("userPreferences")
    .withIndex("by_user_id", (query) => query.eq("userId", userId))
    .unique();
}

export async function ensureViewerPreferences(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const existing = await getViewerPreferences(ctx, userId);
  if (existing) {
    return existing;
  }

  const createdAt = Date.now();
  const preferenceId = await ctx.db.insert("userPreferences", {
    userId,
    homeCountry: null,
    travelStyle: null,
    preferredActivities: [],
    activeTripId: null,
    createdAt,
    updatedAt: createdAt,
  });

  const preferences = await ctx.db.get(preferenceId);
  if (!preferences) {
    throw new Error("Failed to create viewer preferences.");
  }

  return preferences;
}

export async function ensureNamibiaPlaces(ctx: MutationCtx) {
  const existing = await ctx.db.query("places").take(1);
  if (existing.length > 0) {
    return { seeded: false, count: existing.length };
  }

  const timestamp = Date.now();

  for (const place of namibiaPlaceSeed) {
    await ctx.db.insert("places", {
      ...place,
      coordinates: [...place.coordinates],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return { seeded: true, count: namibiaPlaceSeed.length };
}

export async function getTripByIdForViewer(
  ctx: PlannerCtx,
  tripId: Id<"trips">,
  userId: Id<"users">,
) {
  const trip = await ctx.db.get(tripId);
  if (!trip || trip.ownerId !== userId) {
    throw new Error("Trip not found.");
  }

  return trip;
}

export async function getViewerTrips(ctx: PlannerCtx, userId: Id<"users">) {
  const trips = await ctx.db
    .query("trips")
    .withIndex("by_owner_id", (query) => query.eq("ownerId", userId))
    .collect();

  return trips.toSorted((left, right) => right.updatedAt - left.updatedAt);
}

export async function getTripStops(ctx: PlannerCtx, tripId: Id<"trips">) {
  const stops = await ctx.db
    .query("tripStops")
    .withIndex("by_trip_id_and_order", (query) => query.eq("tripId", tripId))
    .collect();

  return stops.toSorted((left, right) => left.orderIndex - right.orderIndex);
}

function isTripInProgress(trip: Doc<"trips"> | null | undefined) {
  return Boolean(trip && trip.status !== "completed");
}

export async function getViewerCurrentTrip(
  ctx: PlannerCtx,
  userId: Id<"users">,
) {
  const preferences = await getViewerPreferences(ctx, userId);
  if (preferences?.activeTripId) {
    const activeTrip = await ctx.db.get(preferences.activeTripId);
    if (
      activeTrip &&
      activeTrip.ownerId === userId &&
      isTripInProgress(activeTrip)
    ) {
      return activeTrip;
    }
  }

  const trips = await getViewerTrips(ctx, userId);
  return trips.find((trip) => isTripInProgress(trip)) ?? null;
}

export async function resolveEffectiveTrip(
  ctx: PlannerCtx,
  userId: Id<"users">,
  requestedTripId?: Id<"trips"> | null,
) {
  if (requestedTripId) {
    return await getTripByIdForViewer(ctx, requestedTripId, userId);
  }

  return await getViewerCurrentTrip(ctx, userId);
}

export async function createDraftTripForViewer(
  ctx: MutationCtx,
  userId: Id<"users">,
  args?: {
    title?: string;
    description?: string | null;
    coverImage?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  },
) {
  const now = Date.now();
  const existingTrip = await getViewerCurrentTrip(ctx, userId);
  if (existingTrip) {
    const preferences = await ensureViewerPreferences(ctx, userId);
    await ctx.db.patch(preferences._id, {
      activeTripId: existingTrip._id,
      updatedAt: now,
    });
    return existingTrip;
  }

  const tripId = await ctx.db.insert("trips", {
    ownerId: userId,
    title: args?.title?.trim() || DEFAULT_TRIP_TITLE,
    description: args?.description ?? null,
    coverImage: args?.coverImage ?? null,
    startDate: args?.startDate ?? null,
    endDate: args?.endDate ?? null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  const preferences = await ensureViewerPreferences(ctx, userId);
  await ctx.db.patch(preferences._id, {
    activeTripId: tripId,
    updatedAt: now,
  });

  const trip = await ctx.db.get(tripId);
  if (!trip) {
    throw new Error("Trip creation failed.");
  }

  return trip;
}

export function getTripDayCount(stops: Array<Doc<"tripStops">>) {
  const dayNumbers = new Set(
    stops
      .map((stop) => stop.dayNumber)
      .filter((dayNumber): dayNumber is number => dayNumber !== null),
  );

  return dayNumbers.size;
}
