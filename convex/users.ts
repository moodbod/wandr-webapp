import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

type AuthCtx = MutationCtx | QueryCtx;

async function safeGetAuthUserId(ctx: AuthCtx) {
  try {
    return await getAuthUserId(ctx);
  } catch {
    return null;
  }
}

export const getViewerProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await safeGetAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    return {
      userId: user._id,
      profileId: user._id,
      name: user.name ?? "Traveler",
      email: user.email ?? "",
      avatarUrl: user.image ?? user.avatarUrl ?? null,
      onboardingCompleted: user.onboardingCompleted ?? false,
      homeCountry: preferences?.homeCountry ?? user.homeCountry ?? null,
      travelStyle: preferences?.travelStyle ?? user.travelStyle ?? null,
      preferredActivities: preferences?.preferredActivities ?? [],
      role: user.role ?? "traveler",
    };
  },
});

export const updateViewerPreferences = mutation({
  args: {
    homeCountry: v.union(v.string(), v.null()),
    travelStyle: v.union(v.string(), v.null()),
    preferredActivities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await safeGetAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    await ctx.db.patch(user._id, {
      homeCountry: args.homeCountry,
      travelStyle: args.travelStyle,
    });

    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, {
        homeCountry: args.homeCountry,
        travelStyle: args.travelStyle,
        preferredActivities: args.preferredActivities,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: user._id,
        homeCountry: args.homeCountry,
        travelStyle: args.travelStyle,
        preferredActivities: args.preferredActivities,
        activeTripId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
    };
  },
});
