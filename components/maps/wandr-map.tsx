"use client";

import { NAMIBIA_CENTER } from "@/lib/namibia-data";
import mapboxgl, { type GeoJSONSource, type LngLatBoundsLike } from "mapbox-gl";
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";

const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";
const MAPBOX_MIN_TILE_CACHE_SIZE = 384;
const MAPBOX_MAX_TILE_CACHE_SIZE = 1400;
const MAPBOX_TRACKPAD_ZOOM_RATE = 1 / 125;
const MAPBOX_WHEEL_ZOOM_RATE = 1 / 620;

let isMapboxRuntimePrepared = false;

type StoredCameraState = {
  bearing: number;
  center: [number, number];
  pitch: number;
  zoom: number;
};

export type WandrMapMarker = {
  id: string;
  label: string;
  coordinates: [number, number];
  note?: string;
  emphasis?: boolean;
};

export function WandrMap({
  className = "",
  markers,
  selectedMarkerId = null,
  routeCoordinates = [],
  onMarkerSelect,
  onInteractionChange,
  cameraStorageKey,
  initialCenter = NAMIBIA_CENTER,
  initialZoom = 5.15,
  initialBearing = 0,
  initialPitch = 0,
  fitToData = false,
  focusSelectedMarker = true,
  showLoader = true,
}: {
  className?: string;
  markers: WandrMapMarker[];
  selectedMarkerId?: string | null;
  routeCoordinates?: [number, number][];
  onMarkerSelect?: (markerId: string) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  cameraStorageKey?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  initialBearing?: number;
  initialPitch?: number;
  fitToData?: boolean;
  focusSelectedMarker?: boolean;
  showLoader?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerStoreRef = useRef(
    new Map<
      string,
      {
        element: HTMLButtonElement;
        marker: mapboxgl.Marker;
      }
    >(),
  );
  const [isReady, setIsReady] = useState(false);
  const routeIdBase = useId().replaceAll(":", "");
  const lastFitSignatureRef = useRef<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const handleMarkerSelect = useEffectEvent((markerId: string) => {
    onMarkerSelect?.(markerId);
  });

  const handleInteractionChange = useEffectEvent((nextValue: boolean) => {
    onInteractionChange?.(nextValue);
  });

  useEffect(() => {
    if (!containerRef.current || !token) {
      return;
    }

    const markerStore = markerStoreRef.current;
    prepareMapboxRuntime(token);
    const storedCamera = readStoredCameraState(cameraStorageKey);
    const map = new mapboxgl.Map({
      attributionControl: false,
      bearing: storedCamera?.bearing ?? initialBearing,
      center: storedCamera?.center ?? initialCenter,
      container: containerRef.current,
      dragRotate: false,
      fadeDuration: 0,
      maxTileCacheSize: MAPBOX_MAX_TILE_CACHE_SIZE,
      minTileCacheSize: MAPBOX_MIN_TILE_CACHE_SIZE,
      pitch: storedCamera?.pitch ?? initialPitch,
      refreshExpiredTiles: false,
      style: MAPBOX_STYLE,
      touchPitch: false,
      zoom: storedCamera?.zoom ?? initialZoom,
    });

    mapRef.current = map;
    tuneMapboxZoom(map);
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "top-left");

    let restoreTimeout: ReturnType<typeof setTimeout> | null = null;
    const emitInteractionStart = () => handleInteractionChange(true);
    const scheduleRestore = () => {
      if (restoreTimeout) {
        clearTimeout(restoreTimeout);
      }

      restoreTimeout = setTimeout(() => {
        handleInteractionChange(false);
      }, 180);
    };

    const handleLoad = () => {
      map.setFog({});
      setIsReady(true);
    };

    map.on("load", handleLoad);
    map.on("dragstart", emitInteractionStart);
    map.on("zoomstart", emitInteractionStart);
    map.on("rotatestart", emitInteractionStart);
    map.on("pitchstart", emitInteractionStart);
    map.on("movestart", emitInteractionStart);
    map.on("dragend", scheduleRestore);
    map.on("zoomend", scheduleRestore);
    map.on("rotateend", scheduleRestore);
    map.on("pitchend", scheduleRestore);
    map.on("moveend", () => {
      persistCameraState(cameraStorageKey, map);
      scheduleRestore();
    });

    return () => {
      if (restoreTimeout) {
        clearTimeout(restoreTimeout);
      }

      markerStore.forEach(({ marker }) => marker.remove());
      markerStore.clear();
      map.remove();
      mapRef.current = null;
      handleInteractionChange(false);
    };
  }, [
    cameraStorageKey,
    initialBearing,
    initialCenter,
    initialPitch,
    initialZoom,
    token,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    const routeSourceId = `${routeIdBase}-source`;
    const routeGlowLayerId = `${routeIdBase}-glow`;
    const routeLayerId = `${routeIdBase}-line`;
    const routeData = {
      type: "FeatureCollection" as const,
      features:
        routeCoordinates.length > 1
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "LineString" as const,
                  coordinates: routeCoordinates,
                },
                properties: {},
              },
            ]
          : [],
    };

    const existingSource = map.getSource(routeSourceId) as GeoJSONSource | undefined;
    if (!existingSource) {
      map.addSource(routeSourceId, {
        type: "geojson",
        data: routeData,
      });

      map.addLayer({
        id: routeGlowLayerId,
        type: "line",
        source: routeSourceId,
        paint: {
          "line-color": "#9fe870",
          "line-opacity": 0.22,
          "line-width": 10,
        },
      });

      map.addLayer({
        id: routeLayerId,
        type: "line",
        source: routeSourceId,
        paint: {
          "line-color": "#294115",
          "line-opacity": 0.78,
          "line-width": 4,
        },
      });

      return;
    }

    existingSource.setData(routeData);
  }, [isReady, routeCoordinates, routeIdBase]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    const existingIds = new Set(markerStoreRef.current.keys());

    for (const marker of markers) {
      const existing = markerStoreRef.current.get(marker.id);

      if (!existing) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "wandr-map-marker";
        element.setAttribute("aria-label", marker.label);
        element.title = marker.note ? `${marker.label} • ${marker.note}` : marker.label;

        const dot = document.createElement("span");
        dot.className = "wandr-map-marker-dot";
        element.append(dot);
        element.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          handleMarkerSelect(marker.id);
        });

        const mapMarker = new mapboxgl.Marker({
          anchor: "bottom",
          element,
        })
          .setLngLat(marker.coordinates)
          .addTo(map);

        markerStoreRef.current.set(marker.id, {
          element,
          marker: mapMarker,
        });
      } else {
        existing.element.title = marker.note
          ? `${marker.label} • ${marker.note}`
          : marker.label;
        existing.marker.setLngLat(marker.coordinates);
      }

      const markerEntry = markerStoreRef.current.get(marker.id);
      if (markerEntry) {
        markerEntry.element.classList.toggle(
          "is-selected",
          selectedMarkerId === marker.id,
        );
        markerEntry.element.classList.toggle(
          "is-emphasis",
          marker.emphasis ?? false,
        );
      }

      existingIds.delete(marker.id);
    }

    existingIds.forEach((markerId) => {
      const staleMarker = markerStoreRef.current.get(markerId);
      staleMarker?.marker.remove();
      markerStoreRef.current.delete(markerId);
    });
  }, [isReady, markers, selectedMarkerId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    if (fitToData) {
      const coordinates =
        routeCoordinates.length > 1
          ? routeCoordinates
          : markers.map((marker) => marker.coordinates);

      if (coordinates.length === 0) {
        return;
      }

      const signature = JSON.stringify(coordinates);
      if (signature === lastFitSignatureRef.current) {
        return;
      }

      lastFitSignatureRef.current = signature;

      if (coordinates.length === 1) {
        map.flyTo({
          center: coordinates[0],
          duration: 700,
          zoom: 6.4,
        });
        return;
      }

      const bounds = coordinates.reduce<mapboxgl.LngLatBounds>(
        (result, coordinate) => result.extend(coordinate),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      );

      map.fitBounds(bounds as LngLatBoundsLike, {
        duration: 800,
        padding: {
          bottom: 88,
          left: 72,
          right: 72,
          top: 72,
        },
      });

      return;
    }

    const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId);
    if (selectedMarker && focusSelectedMarker) {
      map.flyTo({
        center: selectedMarker.coordinates,
        duration: 700,
        zoom: Math.max(map.getZoom(), 6.1),
      });
    }
  }, [
    fitToData,
    focusSelectedMarker,
    isReady,
    markers,
    routeCoordinates,
    selectedMarkerId,
  ]);

  if (!token) {
    return (
      <div
        className={`flex h-full items-center justify-center rounded-[2rem] bg-[#eef0e7] text-center text-sm font-semibold text-[#586158] ${className}`}
      >
        Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to render the live map.
      </div>
    );
  }

  return (
    <div className={`explore-mapbox-canvas ${isReady ? "is-ready" : ""} ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {showLoader ? (
        <div
          className={`explore-mapbox-loader ${isReady ? "is-hidden" : ""}`}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

function prepareMapboxRuntime(token: string) {
  mapboxgl.accessToken = token;

  if (isMapboxRuntimePrepared) {
    return;
  }

  const hardwareConcurrency =
    typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency;
  mapboxgl.workerCount = Math.min(4, Math.max(2, hardwareConcurrency ?? 2));
  mapboxgl.prewarm();
  isMapboxRuntimePrepared = true;
}

function tuneMapboxZoom(map: mapboxgl.Map) {
  map.scrollZoom.setZoomRate(MAPBOX_TRACKPAD_ZOOM_RATE);
  map.scrollZoom.setWheelZoomRate(MAPBOX_WHEEL_ZOOM_RATE);
}

function readStoredCameraState(storageKey?: string): StoredCameraState | null {
  if (!storageKey) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredCameraState>;
    if (
      !Array.isArray(parsed.center) ||
      parsed.center.length !== 2 ||
      typeof parsed.center[0] !== "number" ||
      typeof parsed.center[1] !== "number" ||
      typeof parsed.zoom !== "number" ||
      typeof parsed.bearing !== "number" ||
      typeof parsed.pitch !== "number"
    ) {
      return null;
    }

    return {
      bearing: parsed.bearing,
      center: [parsed.center[0], parsed.center[1]],
      pitch: parsed.pitch,
      zoom: parsed.zoom,
    };
  } catch {
    return null;
  }
}

function persistCameraState(storageKey: string | undefined, map: mapboxgl.Map) {
  if (!storageKey) {
    return;
  }

  try {
    const center = map.getCenter();
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        bearing: map.getBearing(),
        center: [center.lng, center.lat],
        pitch: map.getPitch(),
        zoom: map.getZoom(),
      } satisfies StoredCameraState),
    );
  } catch {
    // Ignore storage failures and keep the map usable.
  }
}
