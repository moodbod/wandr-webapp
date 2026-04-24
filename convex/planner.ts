import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { DEFAULT_TRIP_TITLE, namibiaPlaceSeed } from "../lib/namibia-data";


type OfferTemplate = {
  slug: string;
  offers: Array<{
    kind: "activity" | "stay";
    title: string;
    providerName: string;
    description: string;
    priceEstimate: number;
    duration: string;
  }>;
};

const bookableOfferSeed: OfferTemplate[] = [
  {
    slug: "sossusvlei-deadvlei",
    offers: [
      {
        kind: "activity",
        title: "Sunrise dunes guide",
        providerName: "Sesriem Desert Guides",
        description: "Early pickup, Deadvlei shuttle timing, and a guided dune walk.",
        priceEstimate: 1250,
        duration: "5 hours",
      },
      {
        kind: "stay",
        title: "Sesriem base camp room",
        providerName: "Wandr Stay Desk",
        description: "Request a nearby stay before an early Sossusvlei entry.",
        priceEstimate: 2400,
        duration: "1 night",
      },
    ],
  },
  {
    slug: "etosha-national-park",
    offers: [
      {
        kind: "activity",
        title: "Waterhole safari drive",
        providerName: "Etosha Field Guides",
        description: "A guided half-day drive focused on active waterholes.",
        priceEstimate: 1600,
        duration: "4 hours",
      },
      {
        kind: "stay",
        title: "Park rest camp request",
        providerName: "Wandr Stay Desk",
        description: "Request a camp stay near the next day of your route.",
        priceEstimate: 2950,
        duration: "1 night",
      },
    ],
  },
  {
    slug: "swakopmund",
    offers: [
      {
        kind: "activity",
        title: "Dune skydiving request",
        providerName: "Coast Adventure Desk",
        description: "Request a tandem skydiving slot over the desert coast.",
        priceEstimate: 4200,
        duration: "3 hours",
      },
      {
        kind: "activity",
        title: "Airport and coast transfer",
        providerName: "Wandr Transfers",
        description: "Request a transfer between Walvis Bay, Swakopmund, and your stay.",
        priceEstimate: 850,
        duration: "1 hour",
      },
    ],
  },
  {
    slug: "sandwich-harbour",
    offers: [
      {
        kind: "activity",
        title: "Tide-timed 4x4 dunes tour",
        providerName: "Harbour Dune Guides",
        description: "A guided 4x4 route planned around tides and sand conditions.",
        priceEstimate: 2350,
        duration: "5 hours",
      },
    ],
  },
  {
    slug: "spitzkoppe",
    offers: [
      {
        kind: "stay",
        title: "Stargazing campsite request",
        providerName: "Wandr Stay Desk",
        description: "Request a simple overnight base close to the granite arches.",
        priceEstimate: 900,
        duration: "1 night",
      },
    ],
  },
  {
    slug: "fish-river-canyon",
    offers: [
      {
        kind: "activity",
        title: "Canyon lookout drive",
        providerName: "South Route Guides",
        description: "A flexible guide request for the canyon viewpoints and timing.",
        priceEstimate: 1350,
        duration: "3 hours",
      },
    ],
  },
];
type PlannerCtx = QueryCtx | MutationCtx;
export type { PlannerCtx };

async function safeGetAuthUserId(ctx: PlannerCtx) {
  try {
    return await getAuthUserId(ctx);
  } catch {
    return null;
  }
}

export async function requireViewerId(ctx: PlannerCtx) {
  const userId = await safeGetAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated.");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Authenticated user profile is missing.");
  }

  return user._id;
}

export async function getOptionalViewerId(ctx: PlannerCtx) {
  const userId = await safeGetAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId);
  return user?._id ?? null;
}

export async function requireAdminUser(ctx: PlannerCtx) {
  const userId = await requireViewerId(ctx);
  const user = await ctx.db.get(userId);

  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
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
  const timestamp = Date.now();
  let seededPlaces = false;

  if (existing.length === 0) {
    for (const place of namibiaPlaceSeed) {
      await ctx.db.insert("places", {
        ...place,
        coordinates: [...place.coordinates],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    seededPlaces = true;
  }

  const seededOffers = await ensureBookableOffers(ctx);
  const placeCount = seededPlaces ? namibiaPlaceSeed.length : existing.length;

  return {
    seeded: seededPlaces,
    count: placeCount,
    seededOffers: seededOffers.seeded,
    offerCount: seededOffers.count,
  };
}

export async function ensureBookableOffers(ctx: MutationCtx) {
  const existingOffers = await ctx.db.query("bookableOffers").take(1);
  if (existingOffers.length > 0) {
    return { seeded: false, count: existingOffers.length };
  }

  const places = await ctx.db.query("places").collect();
  const placesBySlug = new Map(places.map((place) => [place.slug, place]));
  const now = Date.now();
  let offerCount = 0;

  for (const placeSeed of bookableOfferSeed) {
    const place = placesBySlug.get(placeSeed.slug);
    if (!place) {
      continue;
    }

    for (const offer of placeSeed.offers) {
      await ctx.db.insert("bookableOffers", {
        placeId: place._id,
        kind: offer.kind,
        title: offer.title,
        providerName: offer.providerName,
        description: offer.description,
        priceEstimate: offer.priceEstimate,
        currency: "NAD",
        duration: offer.duration,
        bookingMode: "request",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      offerCount += 1;
    }
  }

  return { seeded: offerCount > 0, count: offerCount };
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
