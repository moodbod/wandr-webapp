import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureNamibiaPlaces } from "./planner";

export const seedNamibiaPlacesIfNeeded = mutation({
  args: {},
  handler: async (ctx) => {
    return await ensureNamibiaPlaces(ctx);
  },
});

export const listExplorePlaces = query({
  args: {
    category: v.union(v.string(), v.null()),
    search: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const normalizedCategory = args.category?.trim() || null;
    const normalizedSearch = args.search?.trim().toLowerCase() || null;
    const places = await ctx.db.query("places").collect();

    const sortedPlaces = places.toSorted((left, right) => left.sortOrder - right.sortOrder);
    const filteredPlaces = sortedPlaces.filter((place) => {
      const matchesCategory =
        !normalizedCategory || normalizedCategory === "All"
          ? true
          : place.category === normalizedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        place.title,
        place.region,
        place.category,
        place.summary,
        ...place.tags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    return {
      featuredPlaces: filteredPlaces.filter((place) => place.featured),
      places: filteredPlaces,
      total: filteredPlaces.length,
    };
  },
});

export const searchPlaces = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    const search = args.search.trim().toLowerCase();
    if (!search) {
      return [];
    }

    const places = await ctx.db.query("places").collect();
    return places
      .filter((place) =>
        [place.title, place.region, ...place.tags]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
      .toSorted((left, right) => left.sortOrder - right.sortOrder);
  },
});

export const getPlaceBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("places")
      .withIndex("by_slug", (query) => query.eq("slug", args.slug))
      .unique();
  },
});
