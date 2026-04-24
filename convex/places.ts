import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  EXPLORE_DISCOVERY_FILTER_POI_SLUGS,
  EXPLORE_MAP_PLACE_SLUGS,
  namibiaPlaceSeed,
  type ExploreDiscoveryFilter,
} from "../lib/namibia-data";
import { ensureNamibiaPlaces } from "./planner";

async function loadPlaces(ctx: QueryCtx) {
  const places = await ctx.db.query("places").collect();

  if (places.length > 0) {
    return places;
  }

  return namibiaPlaceSeed;
}

function placeListingType(
  place: Awaited<ReturnType<typeof loadPlaces>>[number],
  selectedFilter?: ExploreDiscoveryFilter,
) {
  if ("listingType" in place && place.listingType) {
    return place.listingType;
  }

  if (selectedFilter === "Activities") {
    return "activity" as const;
  }

  if (selectedFilter === "Stays" || place.category === "Stay") {
    return "stay" as const;
  }

  return "landmark" as const;
}

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
    const places = await loadPlaces(ctx);

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

export const listExploreMapPois = query({
  args: {
    category: v.union(v.string(), v.null()),
    search: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const normalizedSearch = args.search?.trim().toLowerCase() || null;
    const selectedFilter =
      args.category && args.category in EXPLORE_DISCOVERY_FILTER_POI_SLUGS
        ? (args.category as ExploreDiscoveryFilter)
        : "Landmarks";
    const allowedSlugs = new Set<string>(EXPLORE_MAP_PLACE_SLUGS);
    const filterSlugs = new Set<string>(
      EXPLORE_DISCOVERY_FILTER_POI_SLUGS[selectedFilter],
    );
    const places = await loadPlaces(ctx);

    return places
      .filter((place) => allowedSlugs.has(place.slug))
      .filter((place) => filterSlugs.has(place.slug))
      .filter((place) => !("isVisibleOnMap" in place) || place.isVisibleOnMap !== false)
      .filter((place) => {
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
      })
      .toSorted((left, right) => left.sortOrder - right.sortOrder)
      .map((place) => ({
        ...place,
        listingType: placeListingType(place, selectedFilter),
      }));
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

    const places = await loadPlaces(ctx);
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
    const dbPlace = await ctx.db
      .query("places")
      .withIndex("by_slug", (query) => query.eq("slug", args.slug))
      .unique();

    if (dbPlace) {
      return dbPlace;
    }

    return namibiaPlaceSeed.find((place) => place.slug === args.slug) ?? null;
  },
});
