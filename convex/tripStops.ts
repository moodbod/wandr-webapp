import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  createDraftTripForViewer,
  ensureNamibiaPlaces,
  ensureViewerPreferences,
  getTripByIdForViewer,
  getTripStops,
  getViewerPreferences,
  requireViewerId,
} from "./planner";
import { DEFAULT_NAMIBIA_TRIP_TITLE } from "../lib/namibia-data";
import type { Id } from "./_generated/dataModel";

async function getOrCreateActiveTripId(
  ctx: MutationCtx,
  userId: Id<"users">,
  requestedTripId?: Id<"trips">,
) {
  if (requestedTripId) {
    const trip = await getTripByIdForViewer(ctx, requestedTripId, userId);
    return trip._id;
  }

  const preferences = await getViewerPreferences(ctx, userId);
  if (preferences?.activeTripId) {
    const trip = await ctx.db.get(preferences.activeTripId);
    if (trip && trip.ownerId === userId) {
      return trip._id;
    }
  }

  const trip = await createDraftTripForViewer(ctx, userId, {
    title: DEFAULT_NAMIBIA_TRIP_TITLE,
  });
  return trip._id;
}

export const addStop = mutation({
  args: {
    tripId: v.optional(v.id("trips")),
    placeId: v.optional(v.id("places")),
    placeSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    await ensureNamibiaPlaces(ctx);

    let placeId = args.placeId ?? null;
    if (!placeId && args.placeSlug) {
      const place = await ctx.db
        .query("places")
        .withIndex("by_slug", (query) => query.eq("slug", args.placeSlug ?? ""))
        .unique();

      if (!place) {
        throw new Error("Place not found.");
      }

      placeId = place._id;
    }

    if (!placeId) {
      throw new Error("A place is required.");
    }

    const tripId = await getOrCreateActiveTripId(ctx, userId, args.tripId);
    const preferences = await ensureViewerPreferences(ctx, userId);
    const existingStop = await ctx.db
      .query("tripStops")
      .withIndex("by_trip_id_and_place_id", (query) =>
        query.eq("tripId", tripId).eq("placeId", placeId),
      )
      .unique();

    if (existingStop) {
      await ctx.db.patch(preferences._id, {
        activeTripId: tripId,
        updatedAt: Date.now(),
      });

      return { tripId, stopId: existingStop._id, created: false };
    }

    const stops = await getTripStops(ctx, tripId);
    const now = Date.now();
    const stopId = await ctx.db.insert("tripStops", {
      tripId,
      placeId,
      orderIndex: stops.length,
      dayNumber: null,
      note: null,
      plannedArrivalTime: null,
      plannedDepartureTime: null,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(preferences._id, {
      activeTripId: tripId,
      updatedAt: now,
    });

    await ctx.db.patch(tripId, {
      updatedAt: now,
    });

    return { tripId, stopId, created: true };
  },
});

export const removeStop = mutation({
  args: {
    stopId: v.id("tripStops"),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const stop = await ctx.db.get(args.stopId);
    if (!stop) {
      throw new Error("Stop not found.");
    }

    await getTripByIdForViewer(ctx, stop.tripId, userId);
    await ctx.db.delete(stop._id);

    const remainingStops = await getTripStops(ctx, stop.tripId);
    const now = Date.now();

    await Promise.all(
      remainingStops.map((remainingStop, index) =>
        ctx.db.patch(remainingStop._id, {
          orderIndex: index,
          updatedAt: now,
        }),
      ),
    );

    await ctx.db.patch(stop.tripId, { updatedAt: now });

    return { success: true };
  },
});

export const reorderStops = mutation({
  args: {
    tripId: v.id("trips"),
    stopId: v.id("tripStops"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    await getTripByIdForViewer(ctx, args.tripId, userId);

    const stops = await getTripStops(ctx, args.tripId);
    const currentIndex = stops.findIndex((stop) => stop._id === args.stopId);

    if (currentIndex === -1) {
      throw new Error("Stop not found.");
    }

    const targetIndex =
      args.direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= stops.length) {
      return { success: false };
    }

    const currentStop = stops[currentIndex];
    const targetStop = stops[targetIndex];
    const now = Date.now();

    await ctx.db.patch(currentStop._id, {
      orderIndex: targetIndex,
      updatedAt: now,
    });
    await ctx.db.patch(targetStop._id, {
      orderIndex: currentIndex,
      updatedAt: now,
    });
    await ctx.db.patch(args.tripId, { updatedAt: now });

    return { success: true };
  },
});

export const updateStopMeta = mutation({
  args: {
    stopId: v.id("tripStops"),
    dayNumber: v.optional(v.union(v.number(), v.null())),
    note: v.optional(v.union(v.string(), v.null())),
    plannedArrivalTime: v.optional(v.union(v.string(), v.null())),
    plannedDepartureTime: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const stop = await ctx.db.get(args.stopId);
    if (!stop) {
      throw new Error("Stop not found.");
    }

    await getTripByIdForViewer(ctx, stop.tripId, userId);
    const now = Date.now();

    await ctx.db.patch(stop._id, {
      ...(args.dayNumber !== undefined ? { dayNumber: args.dayNumber } : {}),
      ...(args.note !== undefined ? { note: args.note } : {}),
      ...(args.plannedArrivalTime !== undefined
        ? { plannedArrivalTime: args.plannedArrivalTime }
        : {}),
      ...(args.plannedDepartureTime !== undefined
        ? { plannedDepartureTime: args.plannedDepartureTime }
        : {}),
      updatedAt: now,
    });

    await ctx.db.patch(stop.tripId, { updatedAt: now });

    return { success: true };
  },
});
