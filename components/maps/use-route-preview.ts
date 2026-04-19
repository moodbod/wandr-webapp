"use client";

import { useEffect, useMemo, useState } from "react";

export type RouteCoordinate = [number, number];

const ROUTE_LEG_CACHE_STORAGE_KEY = "wandr:route-leg-cache:v1";
const MAX_CACHED_ROUTE_LEGS = 48;

const routeLegCache = new Map<string, RouteCoordinate[]>();
const pendingRouteLegRequests = new Map<string, Promise<boolean>>();
let hasHydratedRouteLegCache = false;

function normalizeRouteCoordinates(coordinates: unknown) {
  if (!Array.isArray(coordinates)) {
    return [] as RouteCoordinate[];
  }

  return coordinates.flatMap((entry) => {
    if (
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === "number" &&
      typeof entry[1] === "number"
    ) {
      return [[entry[0], entry[1]] as RouteCoordinate];
    }

    return [];
  });
}

function getRouteLegKey(start: RouteCoordinate, end: RouteCoordinate) {
  return `${start[0]},${start[1]}:${end[0]},${end[1]}`;
}

function touchRouteLegCacheEntry(key: string, coordinates: RouteCoordinate[]) {
  routeLegCache.delete(key);
  routeLegCache.set(key, coordinates);

  while (routeLegCache.size > MAX_CACHED_ROUTE_LEGS) {
    const oldestKey = routeLegCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    routeLegCache.delete(oldestKey);
  }
}

function persistRouteLegCache() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const serializedCache = Object.fromEntries(routeLegCache.entries());
    window.sessionStorage.setItem(
      ROUTE_LEG_CACHE_STORAGE_KEY,
      JSON.stringify(serializedCache),
    );
  } catch {
    // Ignore storage failures so route rendering stays functional.
  }
}

function hydrateRouteLegCache() {
  if (hasHydratedRouteLegCache || typeof window === "undefined") {
    return;
  }

  hasHydratedRouteLegCache = true;

  try {
    const rawValue = window.sessionStorage.getItem(ROUTE_LEG_CACHE_STORAGE_KEY);

    if (!rawValue) {
      return;
    }

    const parsed = JSON.parse(rawValue) as Record<string, unknown>;

    Object.entries(parsed).forEach(([key, coordinates]) => {
      const normalizedCoordinates = normalizeRouteCoordinates(coordinates);

      if (normalizedCoordinates.length > 1) {
        touchRouteLegCacheEntry(key, normalizedCoordinates);
      }
    });
  } catch {
    // Ignore cache hydration issues and fetch a fresh route instead.
  }
}

function composeRouteLegs(routeLegs: RouteCoordinate[][]) {
  if (routeLegs.length === 0) {
    return [] as RouteCoordinate[];
  }

  return routeLegs.flatMap((routeLeg, index) =>
    index === 0 ? routeLeg : routeLeg.slice(1),
  );
}

async function fetchRouteLeg(
  key: string,
  start: RouteCoordinate,
  end: RouteCoordinate,
) {
  const pendingRequest = pendingRouteLegRequests.get(key);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    try {
      const response = await fetch("/api/explore-route-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates: [start, end] }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Route preview failed.");
      }

      const payload = (await response.json()) as {
        routeCoordinates?: unknown;
        source?: string;
      };

      const routeCoordinates = normalizeRouteCoordinates(payload.routeCoordinates);

      if (payload.source !== "directions" || routeCoordinates.length < 2) {
        return false;
      }

      touchRouteLegCacheEntry(key, routeCoordinates);
      persistRouteLegCache();

      return true;
    } catch {
      return false;
    } finally {
      pendingRouteLegRequests.delete(key);
    }
  })();

  pendingRouteLegRequests.set(key, request);

  return request;
}

export function useRoutePreview(
  coordinates: RouteCoordinate[],
  enabled = true,
) {
  const [cacheVersion, setCacheVersion] = useState(() => {
    hydrateRouteLegCache();
    return 0;
  });
  const routeLegs = useMemo(
    () =>
      coordinates.slice(0, -1).map((start, index) => ({
        end: coordinates[index + 1] as RouteCoordinate,
        key: getRouteLegKey(start, coordinates[index + 1] as RouteCoordinate),
        start,
      })),
    [coordinates],
  );
  const routeLegsKey = useMemo(
    () => routeLegs.map((routeLeg) => routeLeg.key).join("|"),
    [routeLegs],
  );

  useEffect(() => {
    if (!enabled || routeLegs.length === 0) {
      return;
    }

    const missingRouteLegs = routeLegs.filter(
      (routeLeg) => !routeLegCache.has(routeLeg.key),
    );

    if (missingRouteLegs.length === 0) {
      return;
    }

    let isMounted = true;

    async function fetchMissingRouteLegs() {
      const results = await Promise.all(
        missingRouteLegs.map((routeLeg) =>
          fetchRouteLeg(routeLeg.key, routeLeg.start, routeLeg.end),
        ),
      );

      if (isMounted && results.some(Boolean)) {
        setCacheVersion((currentVersion) => currentVersion + 1);
      }
    }

    void fetchMissingRouteLegs();

    return () => {
      isMounted = false;
    };
  }, [enabled, routeLegs, routeLegsKey]);

  return useMemo(() => {
    if (!enabled || coordinates.length < 2) {
      return coordinates;
    }

    void cacheVersion;

    const contiguousRouteLegs: RouteCoordinate[][] = [];

    for (const routeLeg of routeLegs) {
      const cachedRouteLeg = routeLegCache.get(routeLeg.key);

      if (!cachedRouteLeg || cachedRouteLeg.length < 2) {
        break;
      }

      contiguousRouteLegs.push(cachedRouteLeg);
    }

    return composeRouteLegs(contiguousRouteLegs);
  }, [cacheVersion, coordinates, enabled, routeLegs]);
}
