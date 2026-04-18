import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const getViewerProfile = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
      .unique();

    const preferences = user
      ? await ctx.db
          .query("userPreferences")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .unique()
      : null;

    return {
      authUserId: authUser._id,
      profileId: user?._id ?? null,
      name: user?.name ?? authUser.name ?? "Traveler",
      email: user?.email ?? authUser.email ?? "",
      avatarUrl: user?.avatarUrl ?? authUser.image ?? null,
      onboardingCompleted: user?.onboardingCompleted ?? false,
      homeCountry: preferences?.homeCountry ?? user?.homeCountry ?? null,
      travelStyle: preferences?.travelStyle ?? user?.travelStyle ?? null,
      preferredActivities: preferences?.preferredActivities ?? [],
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
    const authUser = await authComponent.getAuthUser(ctx);

    let user = await ctx.db
      .query("users")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        authUserId: authUser._id,
        name: authUser.name ?? "Traveler",
        email: authUser.email ?? "",
        avatarUrl: authUser.image ?? null,
        createdAt: Date.now(),
        onboardingCompleted: false,
        homeCountry: args.homeCountry,
        travelStyle: args.travelStyle,
      });

      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, {
        homeCountry: args.homeCountry,
        travelStyle: args.travelStyle,
      });
    }

    if (!user) {
      throw new Error("Unable to create the viewer profile.");
    }

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
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
    };
  },
});
