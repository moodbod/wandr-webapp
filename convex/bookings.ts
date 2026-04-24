import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ensureNamibiaPlaces,
  getTripByIdForViewer,
  requireViewerId,
  type PlannerCtx,
} from "./planner";

const requestStatusValidator = v.union(
  v.literal("draft"),
  v.literal("requested"),
  v.literal("confirmed"),
  v.literal("declined"),
  v.literal("cancelled"),
);

function budgetCategoryForOffer(kind: Doc<"bookableOffers">["kind"]) {
  return kind === "stay" ? "stay" as const : "activity" as const;
}

function publicListingTypeForOffer(kind: Doc<"bookableOffers">["kind"]) {
  return kind === "stay" ? "stay" as const : "activity" as const;
}

async function getPlaceByArgs(
  ctx: PlannerCtx,
  args: { placeId?: Id<"places">; placeSlug?: string },
) {
  if (args.placeId) {
    const place = await ctx.db.get(args.placeId);
    if (place) {
      return place;
    }
  }

  if (args.placeSlug) {
    return await ctx.db
      .query("places")
      .withIndex("by_slug", (q) => q.eq("slug", args.placeSlug ?? ""))
      .unique();
  }

  return null;
}

async function listTripBookingRequests(ctx: PlannerCtx, tripId: Id<"trips">) {
  const requests = await ctx.db
    .query("bookingRequests")
    .withIndex("by_trip_id", (q) => q.eq("tripId", tripId))
    .collect();

  return await Promise.all(
    requests
      .toSorted((left, right) => right.updatedAt - left.updatedAt)
      .map(async (request) => {
        const offer = await ctx.db.get(request.offerId);
        const place = await ctx.db.get(request.placeId);

        return { ...request, offer, place };
      }),
  );
}

export async function buildBookingSummary(ctx: PlannerCtx, trip: Doc<"trips">) {
  const requests = await listTripBookingRequests(ctx, trip._id);
  const activeRequests = requests.filter(
    (request) => request.status !== "cancelled" && request.status !== "declined",
  );
  const requestedCount = activeRequests.filter(
    (request) => request.status === "requested",
  ).length;
  const confirmedCount = activeRequests.filter(
    (request) => request.status === "confirmed",
  ).length;

  return {
    requests,
    requestedCount,
    confirmedCount,
    activeCount: activeRequests.length,
  };
}

export const listOffersForPlace = query({
  args: {
    placeId: v.optional(v.id("places")),
    placeSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const place = await getPlaceByArgs(ctx, args);
    if (!place) {
      return [];
    }

    const offers = await ctx.db
      .query("bookableOffers")
      .withIndex("by_place_id", (q) => q.eq("placeId", place._id))
      .collect();

    return offers
      .filter((offer) => offer.status === "active")
      .toSorted((left, right) => left.priceEstimate - right.priceEstimate)
      .map((offer) => ({
        ...offer,
        listingType: publicListingTypeForOffer(offer.kind),
      }));
  },
});

export const getTripBookingSummary = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    return await buildBookingSummary(ctx, trip);
  },
});

export const createBookingRequest = mutation({
  args: {
    tripId: v.id("trips"),
    stopId: v.optional(v.union(v.id("tripStops"), v.null())),
    offerId: v.id("bookableOffers"),
    requestedDateTime: v.optional(v.union(v.string(), v.null())),
    guestCount: v.number(),
    note: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    await ensureNamibiaPlaces(ctx);

    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    if (trip.status === "completed") {
      throw new Error("Completed trips can no longer receive booking requests.");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer || offer.status !== "active") {
      throw new Error("Offer is not available.");
    }

    const stopId = args.stopId ?? null;
    if (stopId) {
      const stop = await ctx.db.get(stopId);
      if (!stop || stop.tripId !== trip._id || stop.placeId !== offer.placeId) {
        throw new Error("Stop does not match this offer.");
      }
    }

    const existingRequests = await ctx.db
      .query("bookingRequests")
      .withIndex("by_trip_id", (q) => q.eq("tripId", trip._id))
      .collect();
    const existingRequest = existingRequests.find(
      (request) =>
        request.offerId === offer._id &&
        request.stopId === stopId &&
        request.status !== "cancelled" &&
        request.status !== "declined",
    );

    if (existingRequest) {
      return { requestId: existingRequest._id, created: false };
    }

    const now = Date.now();
    const guestCount = Math.max(1, Math.floor(args.guestCount));
    const estimatedTotal = offer.priceEstimate * guestCount;
    const requestId = await ctx.db.insert("bookingRequests", {
      userId,
      tripId: trip._id,
      stopId,
      offerId: offer._id,
      placeId: offer.placeId,
      status: "requested",
      requestedDateTime: args.requestedDateTime ?? null,
      guestCount,
      note: args.note?.trim() || null,
      estimatedTotal,
      currency: offer.currency,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tripBudgetItems", {
      tripId: trip._id,
      stopId,
      category: budgetCategoryForOffer(offer.kind),
      label: offer.title,
      estimatedAmount: estimatedTotal,
      actualAmount: null,
      currency: offer.currency,
      sourceBookingRequestId: requestId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(trip._id, { updatedAt: now });

    return { requestId, created: true };
  },
});

export const updateBookingRequestStatus = mutation({
  args: {
    requestId: v.id("bookingRequests"),
    status: requestStatusValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Booking request not found.");
    }

    const trip = await getTripByIdForViewer(ctx, request.tripId, userId);
    if (trip.status === "completed" && args.status !== "cancelled") {
      throw new Error("Completed trip bookings can only be cancelled.");
    }

    const now = Date.now();
    await ctx.db.patch(request._id, { status: args.status, updatedAt: now });

    if (args.status === "cancelled" || args.status === "declined") {
      const budgetItems = await ctx.db
        .query("tripBudgetItems")
        .withIndex("by_trip_id", (q) => q.eq("tripId", trip._id))
        .collect();

      await Promise.all(
        budgetItems
          .filter((item) => item.sourceBookingRequestId === request._id)
          .map((item) => ctx.db.delete(item._id)),
      );
    }

    await ctx.db.patch(trip._id, { updatedAt: now });

    return { success: true };
  },
});