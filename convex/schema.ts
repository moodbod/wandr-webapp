import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    authUserId: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    avatarUrl: v.optional(v.union(v.string(), v.null())),
    createdAt: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
    homeCountry: v.optional(v.union(v.string(), v.null())),
    travelStyle: v.optional(v.union(v.string(), v.null())),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    homeCountry: v.union(v.string(), v.null()),
    travelStyle: v.union(v.string(), v.null()),
    preferredActivities: v.array(v.string()),
    activeTripId: v.optional(v.union(v.id("trips"), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  places: defineTable({
    slug: v.string(),
    title: v.string(),
    region: v.string(),
    country: v.string(),
    category: v.string(),
    summary: v.string(),
    teaser: v.string(),
    description: v.string(),
    coordinates: v.array(v.number()),
    heroImage: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    tags: v.array(v.string()),
    featured: v.boolean(),
    rating: v.string(),
    estimatedVisitDuration: v.string(),
    bestTimeToVisit: v.string(),
    roadAccessNote: v.string(),
    driveTimeFromWindhoek: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sort_order", ["sortOrder"]),

  trips: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    coverImage: v.union(v.string(), v.null()),
    startDate: v.union(v.string(), v.null()),
    endDate: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("draft"),
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_id", ["ownerId"]),

  tripStops: defineTable({
    tripId: v.id("trips"),
    placeId: v.id("places"),
    orderIndex: v.number(),
    dayNumber: v.union(v.number(), v.null()),
    note: v.union(v.string(), v.null()),
    plannedArrivalTime: v.union(v.string(), v.null()),
    plannedDepartureTime: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trip_id_and_order", ["tripId", "orderIndex"])
    .index("by_trip_id_and_place_id", ["tripId", "placeId"]),
});
