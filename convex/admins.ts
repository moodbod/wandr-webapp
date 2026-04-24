import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdminUser } from "./planner";

const bookingStatusValidator = v.union(
  v.literal("draft"),
  v.literal("requested"),
  v.literal("confirmed"),
  v.literal("declined"),
  v.literal("cancelled"),
);

const listingTypeValidator = v.union(
  v.literal("landmark"),
  v.literal("activity"),
  v.literal("stay"),
);

function offerListingType(kind: "activity" | "tour" | "stay" | "transport") {
  return kind === "stay" ? "stay" as const : "activity" as const;
}

export const getAdminPanelState = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminUser(ctx);

    const [places, offers, requests] = await Promise.all([
      ctx.db.query("places").collect(),
      ctx.db.query("bookableOffers").collect(),
      ctx.db.query("bookingRequests").collect(),
    ]);

    const placesById = new Map(places.map((place) => [place._id, place]));
    const offersById = new Map(offers.map((offer) => [offer._id, offer]));

    return {
      listings: places
        .toSorted((left, right) => left.sortOrder - right.sortOrder)
        .map((place) => {
          const placeOffers = offers.filter((offer) => offer.placeId === place._id);
          const primaryOffer = placeOffers[0] ?? null;

          return {
            _id: place._id,
            title: place.title,
            region: place.region,
            category: place.category,
            listingType:
              place.listingType ??
              (primaryOffer ? offerListingType(primaryOffer.kind) : "landmark"),
            isVisibleOnMap: place.isVisibleOnMap ?? true,
            offers: placeOffers.map((offer) => ({
              _id: offer._id,
              title: offer.title,
              listingType: offerListingType(offer.kind),
              status: offer.status,
              priceEstimate: offer.priceEstimate,
              currency: offer.currency,
            })),
          };
        }),
      bookingRequests: await Promise.all(
        requests
          .toSorted((left, right) => right.updatedAt - left.updatedAt)
          .map(async (request) => {
            const user = await ctx.db.get(request.userId);
            const offer = offersById.get(request.offerId) ?? null;
            const place = placesById.get(request.placeId) ?? null;

            return {
              _id: request._id,
              status: request.status,
              guestCount: request.guestCount,
              estimatedTotal: request.estimatedTotal,
              currency: request.currency,
              travelerName: user?.name ?? user?.email ?? "Traveler",
              offerTitle: offer?.title ?? "Booking request",
              placeTitle: place?.title ?? "Listing",
              updatedAt: request.updatedAt,
            };
          }),
      ),
    };
  },
});

export const updateListingVisibility = mutation({
  args: {
    placeId: v.id("places"),
    isVisibleOnMap: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    await ctx.db.patch(args.placeId, {
      isVisibleOnMap: args.isVisibleOnMap,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateListingType = mutation({
  args: {
    placeId: v.id("places"),
    listingType: listingTypeValidator,
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    await ctx.db.patch(args.placeId, {
      listingType: args.listingType,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateOfferStatus = mutation({
  args: {
    offerId: v.id("bookableOffers"),
    status: v.union(v.literal("active"), v.literal("paused")),
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    await ctx.db.patch(args.offerId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateBookingStatus = mutation({
  args: {
    requestId: v.id("bookingRequests"),
    status: bookingStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Booking request not found.");
    }

    const now = Date.now();
    await ctx.db.patch(request._id, {
      status: args.status,
      updatedAt: now,
    });

    if (args.status === "cancelled" || args.status === "declined") {
      const budgetItems = await ctx.db
        .query("tripBudgetItems")
        .withIndex("by_trip_id", (q) => q.eq("tripId", request.tripId))
        .collect();

      await Promise.all(
        budgetItems
          .filter((item) => item.sourceBookingRequestId === request._id)
          .map((item) => ctx.db.delete(item._id)),
      );
    }

    return { success: true };
  },
});