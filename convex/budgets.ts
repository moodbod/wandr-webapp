import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { getTripByIdForViewer, requireViewerId, type PlannerCtx } from "./planner";

const budgetCategoryValidator = v.union(
  v.literal("activity"),
  v.literal("stay"),
  v.literal("transport"),
  v.literal("food"),
  v.literal("park_fees"),
  v.literal("manual"),
);

const BUDGET_CATEGORIES = [
  "activity",
  "stay",
  "transport",
  "food",
  "park_fees",
  "manual",
] as const;

type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

function emptyCategoryTotals() {
  return BUDGET_CATEGORIES.map((category) => ({
    category,
    estimatedTotal: 0,
    actualTotal: 0,
    itemCount: 0,
  }));
}

export async function buildBudgetSummary(ctx: PlannerCtx, trip: Doc<"trips">) {
  const budget = await ctx.db
    .query("tripBudgets")
    .withIndex("by_trip_id", (q) => q.eq("tripId", trip._id))
    .unique();
  const items = (
    await ctx.db
      .query("tripBudgetItems")
      .withIndex("by_trip_id", (q) => q.eq("tripId", trip._id))
      .collect()
  ).filter((item) => item.sourceBookingRequestId);
  const currency = budget?.currency ?? items[0]?.currency ?? "NAD";
  const estimatedTotal = items.reduce(
    (total, item) => total + item.estimatedAmount,
    0,
  );
  const actualTotal = items.reduce(
    (total, item) => total + (item.actualAmount ?? item.estimatedAmount),
    0,
  );
  const targetAmount = budget?.targetAmount ?? 0;
  const categoriesByName = new Map<
    BudgetCategory,
    { category: BudgetCategory; estimatedTotal: number; actualTotal: number; itemCount: number }
  >(emptyCategoryTotals().map((entry) => [entry.category, entry]));

  for (const item of items) {
    const category = categoriesByName.get(item.category);
    if (!category) {
      continue;
    }

    category.estimatedTotal += item.estimatedAmount;
    category.actualTotal += item.actualAmount ?? item.estimatedAmount;
    category.itemCount += 1;
  }

  return {
    budget,
    items: items.toSorted((left, right) => right.updatedAt - left.updatedAt),
    currency,
    targetAmount,
    estimatedTotal,
    actualTotal,
    remainingAmount: targetAmount > 0 ? targetAmount - estimatedTotal : null,
    isOverBudget: targetAmount > 0 && estimatedTotal > targetAmount,
    categories: Array.from(categoriesByName.values()),
  };
}

async function assertEditableTrip(ctx: PlannerCtx, tripId: Doc<"trips">["_id"]) {
  const userId = await requireViewerId(ctx);
  const trip = await getTripByIdForViewer(ctx, tripId, userId);

  if (trip.status === "completed") {
    throw new Error("Completed trips can no longer be edited.");
  }

  return { trip, userId };
}

async function assertStopBelongsToTrip(
  ctx: PlannerCtx,
  tripId: Doc<"trips">["_id"],
  stopId: Doc<"tripStops">["_id"] | null,
) {
  if (!stopId) {
    return;
  }

  const stop = await ctx.db.get(stopId);
  if (!stop || stop.tripId !== tripId) {
    throw new Error("Stop not found for this trip.");
  }
}

export const getTripBudgetSummary = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const trip = await getTripByIdForViewer(ctx, args.tripId, userId);
    return await buildBudgetSummary(ctx, trip);
  },
});

export const setTripBudget = mutation({
  args: {
    tripId: v.id("trips"),
    currency: v.string(),
    targetAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const { trip, userId } = await assertEditableTrip(ctx, args.tripId);
    const existing = await ctx.db
      .query("tripBudgets")
      .withIndex("by_trip_id", (q) => q.eq("tripId", trip._id))
      .unique();
    const now = Date.now();
    const targetAmount = Math.max(0, args.targetAmount);
    const currency = args.currency.trim().toUpperCase() || "NAD";

    if (existing) {
      await ctx.db.patch(existing._id, { currency, targetAmount, updatedAt: now });
      return { budgetId: existing._id };
    }

    const budgetId = await ctx.db.insert("tripBudgets", {
      tripId: trip._id,
      userId,
      currency,
      targetAmount,
      createdAt: now,
      updatedAt: now,
    });

    return { budgetId };
  },
});

export const upsertBudgetItem = mutation({
  args: {
    tripId: v.id("trips"),
    itemId: v.optional(v.union(v.id("tripBudgetItems"), v.null())),
    stopId: v.optional(v.union(v.id("tripStops"), v.null())),
    category: budgetCategoryValidator,
    label: v.string(),
    estimatedAmount: v.number(),
    actualAmount: v.optional(v.union(v.number(), v.null())),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const { trip } = await assertEditableTrip(ctx, args.tripId);
    const stopId = args.stopId ?? null;
    await assertStopBelongsToTrip(ctx, trip._id, stopId);

    const now = Date.now();
    const patch = {
      stopId,
      category: args.category,
      label: args.label.trim() || "Trip cost",
      estimatedAmount: Math.max(0, args.estimatedAmount),
      actualAmount:
        args.actualAmount === undefined || args.actualAmount === null
          ? null
          : Math.max(0, args.actualAmount),
      currency: args.currency.trim().toUpperCase() || "NAD",
      updatedAt: now,
    };

    if (args.itemId) {
      const item = await ctx.db.get(args.itemId);
      if (!item || item.tripId !== trip._id) {
        throw new Error("Budget item not found.");
      }

      await ctx.db.patch(item._id, patch);
      await ctx.db.patch(trip._id, { updatedAt: now });
      return { itemId: item._id };
    }

    const itemId = await ctx.db.insert("tripBudgetItems", {
      tripId: trip._id,
      ...patch,
      createdAt: now,
    });
    await ctx.db.patch(trip._id, { updatedAt: now });

    return { itemId };
  },
});

export const removeBudgetItem = mutation({
  args: { itemId: v.id("tripBudgetItems") },
  handler: async (ctx, args) => {
    const userId = await requireViewerId(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Budget item not found.");
    }

    const trip = await getTripByIdForViewer(ctx, item.tripId, userId);
    if (trip.status === "completed") {
      throw new Error("Completed trips can no longer be edited.");
    }

    await ctx.db.delete(item._id);
    await ctx.db.patch(trip._id, { updatedAt: Date.now() });
    return { success: true };
  },
});