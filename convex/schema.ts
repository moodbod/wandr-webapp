import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authUserId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    createdAt: v.number(),
    onboardingCompleted: v.boolean(),
    homeCountry: v.union(v.string(), v.null()),
    travelStyle: v.union(v.string(), v.null()),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_email", ["email"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    homeCountry: v.union(v.string(), v.null()),
    travelStyle: v.union(v.string(), v.null()),
    preferredActivities: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),
});
