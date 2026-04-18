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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),
});
