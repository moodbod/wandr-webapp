import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeCoordinates(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as [number, number][];
  }

  return input.flatMap((entry) => {
    if (
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === "number" &&
      typeof entry[1] === "number"
    ) {
      return [[entry[0], entry[1]] as [number, number]];
    }

    return [];
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    coordinates?: unknown;
  };
  const fallbackCoordinates = normalizeCoordinates(payload.coordinates);

  if (fallbackCoordinates.length < 2) {
    return NextResponse.json({
      routeCoordinates: fallbackCoordinates,
      source: "fallback",
    });
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({
      routeCoordinates: fallbackCoordinates,
      source: "fallback",
    });
  }

  const coordinateString = fallbackCoordinates
    .map(([longitude, latitude]) => `${longitude},${latitude}`)
    .join(";");
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinateString}`,
  );

  url.searchParams.set("access_token", token);
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "false");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Directions request failed.");
    }

    const directions = (await response.json()) as {
      routes?: Array<{
        geometry?: {
          coordinates?: unknown;
        };
      }>;
    };
    const primaryRoute = directions.routes?.[0];
    const routeCoordinates = normalizeCoordinates(
      primaryRoute?.geometry?.coordinates,
    );

    return NextResponse.json({
      routeCoordinates:
        routeCoordinates.length > 1 ? routeCoordinates : fallbackCoordinates,
      source: routeCoordinates.length > 1 ? "directions" : "fallback",
    });
  } catch {
    return NextResponse.json({
      routeCoordinates: fallbackCoordinates,
      source: "fallback",
    });
  }
}
