import type { AuthFunctions, GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", doc._id))
          .unique();

        const userId =
          existingUser?._id ??
          (await ctx.db.insert("users", {
            authUserId: doc._id,
            name: doc.name ?? "Traveler",
            email: doc.email ?? "",
            avatarUrl: doc.image ?? null,
            createdAt: Date.now(),
            onboardingCompleted: false,
            homeCountry: null,
            travelStyle: null,
          }));

        const existingPreferences = await ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique();

        if (!existingPreferences) {
          await ctx.db.insert("userPreferences", {
            userId,
            homeCountry: null,
            travelStyle: null,
            preferredActivities: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      },

      onUpdate: async (ctx, newDoc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", newDoc._id))
          .unique();

        if (!user) {
          return;
        }

        await ctx.db.patch(user._id, {
          name: newDoc.name ?? user.name,
          email: newDoc.email ?? user.email,
          avatarUrl: newDoc.image ?? null,
        });
      },

      onDelete: async (ctx, doc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", doc._id))
          .unique();

        if (!user) {
          return;
        }

        const preferences = await ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .unique();

        if (preferences) {
          await ctx.db.delete(preferences._id);
        }

        await ctx.db.delete(user._id);
      },
    },
  },
});

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
      }),
    ],
  });

export const { getAuthUser } = authComponent.clientApi();
export const { onCreate, onDelete, onUpdate } = authComponent.triggersApi();

export const getCurrentAuthUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});
