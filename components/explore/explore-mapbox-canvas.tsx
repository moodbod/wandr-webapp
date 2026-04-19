"use client";

import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import mapboxgl, {
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type MapMouseEvent,
} from "mapbox-gl";
import { useMutation, useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useExploreMapState } from "@/components/explore/explore-map-state";
import { useRoutePreview } from "@/components/maps/use-route-preview";
import { buildAddToTripIntent, buildAuthRedirectPath } from "@/lib/trip-intents";

const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPBOX_CENTER: [number, number] = [17.0832, -22.5597];
const MAPBOX_ZOOM = 5.15;
const MAPBOX_CAMERA_STORAGE_KEY = "wandr:explore-map-camera";
const EXPLORE_POI_SOURCE_ID = "wandr-explore-pois-source";
const EXPLORE_POI_LAYER_ID = "wandr-explore-pois-layer";
const EXPLORE_POI_SELECTED_LAYER_ID = "wandr-explore-pois-selected-layer";
const EXPLORE_TRIP_STOP_SOURCE_ID = "wandr-explore-trip-stops-source";
const EXPLORE_TRIP_STOP_LAYER_ID = "wandr-explore-trip-stops-layer";
const EXPLORE_TRIP_STOP_SELECTED_LAYER_ID =
  "wandr-explore-trip-stops-selected-layer";
const EXPLORE_TRIP_STOP_LABEL_LAYER_ID = "wandr-explore-trip-stops-label-layer";
const EXPLORE_ROUTE_SOURCE_ID = "wandr-explore-route-source";
const EXPLORE_ROUTE_GLOW_LAYER_ID = "wandr-explore-route-glow";
const EXPLORE_ROUTE_LAYER_ID = "wandr-explore-route-line";

export const EXPLORE_MAP_INTERACTION_EVENT = "wandr:explore-map-interaction";

type StoredCameraState = {
  bearing: number;
  center: [number, number];
  pitch: number;
  zoom: number;
};

type ExplorePlacePreview = {
  slug: string;
  title: string;
  region: string;
  category: string;
  summary: string;
  coordinates: number[];
  driveTimeFromWindhoek: string;
  estimatedVisitDuration: string;
  highlights: string[];
  featured: boolean;
};

type ExploreMapPoi = ExplorePlacePreview;

type SharedMapState = {
  hostElement: HTMLDivElement | null;
  isReady: boolean;
  listenersAttached: boolean;
  map: mapboxgl.Map | null;
  parkingElement: HTMLDivElement | null;
};

const sharedMapState: SharedMapState = {
  hostElement: null,
  isReady: false,
  listenersAttached: false,
  map: null,
  parkingElement: null,
};

type ExploreMapboxCanvasProps = {
  className?: string;
  isAuthenticated?: boolean;
  isVisible?: boolean;
  showLoader?: boolean;
};

function emitInteractionState(isInteracting: boolean) {
  window.dispatchEvent(
    new CustomEvent(EXPLORE_MAP_INTERACTION_EVENT, {
      detail: { isInteracting },
    }),
  );
}

function readStoredCameraState(): StoredCameraState | null {
  try {
    const rawValue = window.sessionStorage.getItem(MAPBOX_CAMERA_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredCameraState>;
    const center = parsed.center;

    if (
      !Array.isArray(center) ||
      center.length !== 2 ||
      typeof center[0] !== "number" ||
      typeof center[1] !== "number" ||
      typeof parsed.zoom !== "number" ||
      typeof parsed.bearing !== "number" ||
      typeof parsed.pitch !== "number"
    ) {
      return null;
    }

    return {
      bearing: parsed.bearing,
      center: [center[0], center[1]],
      pitch: parsed.pitch,
      zoom: parsed.zoom,
    };
  } catch {
    return null;
  }
}

function persistCameraState(map: mapboxgl.Map) {
  try {
    const center = map.getCenter();

    window.sessionStorage.setItem(
      MAPBOX_CAMERA_STORAGE_KEY,
      JSON.stringify({
        bearing: map.getBearing(),
        center: [center.lng, center.lat],
        pitch: map.getPitch(),
        zoom: map.getZoom(),
      } satisfies StoredCameraState),
    );
  } catch {
    // Ignore storage failures and fall back to the default camera.
  }
}

function getOrCreateHostElement() {
  if (!sharedMapState.hostElement) {
    const hostElement = document.createElement("div");
    hostElement.style.width = "100%";
    hostElement.style.height = "100%";
    sharedMapState.hostElement = hostElement;
  }

  return sharedMapState.hostElement;
}

function getOrCreateParkingElement() {
  if (!sharedMapState.parkingElement) {
    const parkingElement = document.createElement("div");
    parkingElement.setAttribute("data-wandr-mapbox-parking", "true");
    parkingElement.style.position = "fixed";
    parkingElement.style.inset = "0";
    parkingElement.style.opacity = "0";
    parkingElement.style.pointerEvents = "none";
    parkingElement.style.visibility = "hidden";
    parkingElement.style.zIndex = "-1";
    document.body.appendChild(parkingElement);
    sharedMapState.parkingElement = parkingElement;
  }

  return sharedMapState.parkingElement;
}

function attachSharedMapListeners(map: mapboxgl.Map) {
  if (sharedMapState.listenersAttached) {
    return;
  }

  let restoreTimeout: ReturnType<typeof setTimeout> | null = null;

  const emitInteractionStart = () => {
    emitInteractionState(true);
  };

  const scheduleRestore = () => {
    if (restoreTimeout) {
      clearTimeout(restoreTimeout);
    }

    restoreTimeout = setTimeout(() => {
      emitInteractionState(false);
    }, 180);
  };

  map.on("load", () => {
    map.setFog({});
    sharedMapState.isReady = true;
  });
  map.on("dragstart", emitInteractionStart);
  map.on("dragend", scheduleRestore);
  map.on("zoomstart", emitInteractionStart);
  map.on("zoomend", scheduleRestore);
  map.on("rotatestart", emitInteractionStart);
  map.on("rotateend", scheduleRestore);
  map.on("pitchstart", emitInteractionStart);
  map.on("pitchend", scheduleRestore);
  map.on("movestart", emitInteractionStart);
  map.on("moveend", () => {
    persistCameraState(map);
    scheduleRestore();
  });

  sharedMapState.listenersAttached = true;
}

function buildPoiGeoJson(places: ExploreMapPoi[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((place) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [place.coordinates[0] ?? 0, place.coordinates[1] ?? 0],
      },
      properties: {
        featured: place.featured,
        slug: place.slug,
      },
    })),
  };
}

function buildTripStopGeoJson(
  stops: Array<{
    orderIndex: number;
    place: Pick<ExplorePlacePreview, "coordinates" | "slug">;
  }>,
) {
  return {
    type: "FeatureCollection" as const,
    features: stops.map((stop) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [stop.place.coordinates[0] ?? 0, stop.place.coordinates[1] ?? 0],
      },
      properties: {
        label: String(stop.orderIndex + 1),
        slug: stop.place.slug,
      },
    })),
  };
}

function getButtonState({
  isAdding,
  isAlreadyInTrip,
  isTripActive,
  wasJustAdded,
}: {
  isAdding: boolean;
  isAlreadyInTrip: boolean;
  isTripActive: boolean;
  wasJustAdded: boolean;
}) {
  if (isAdding) {
    return { disabled: true, hint: null, label: "Adding…" };
  }

  if (wasJustAdded) {
    return { disabled: true, hint: null, label: "Added" };
  }

  if (isTripActive) {
    return {
      disabled: true,
      hint: "This trip is active now. Open My Trip to add notes or end it before planning more stops.",
      label: "Trip is active",
    };
  }

  if (isAlreadyInTrip) {
    return { disabled: true, hint: null, label: "Already in trip" };
  }

  return { disabled: false, hint: null, label: "Add to trip" };
}

function disposePopupRoot(root: Root | null, container: HTMLDivElement | null) {
  if (!root) {
    return;
  }

  window.setTimeout(() => {
    root.unmount();
    container?.remove();
  }, 0);
}

export function hasExploreMapSession() {
  return sharedMapState.map !== null;
}

export function ExploreMapboxCanvas({
  className = "",
  isAuthenticated = false,
  isVisible = true,
  showLoader = true,
}: ExploreMapboxCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const seededOnceRef = useRef(false);
  const processedIntentRef = useRef<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(
    () => sharedMapState.isReady || sharedMapState.map?.isStyleLoaded() === true,
  );
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [recentlyAddedSlug, setRecentlyAddedSlug] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeFilter, searchQuery, selectedPlaceSlug, setSelectedPlaceSlug } =
    useExploreMapState();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const seedNamibiaPlaces = useMutation(api.places.seedNamibiaPlacesIfNeeded);
  const addStop = useMutation(api.tripStops.addStop);
  const explorePois = useQuery(api.places.listExploreMapPois, {
    category: activeFilter,
    search: deferredSearchQuery,
  });
  const tripWorkspace = useQuery(
    api.trips.getTripWorkspace,
    isAuthenticated ? { tripId: null } : "skip",
  );
  const intent = searchParams.get("intent");
  const intentPlaceSlug = searchParams.get("place");
  const places = useMemo(() => explorePois ?? [], [explorePois]);
  const tripStops = useMemo(() => tripWorkspace?.stops ?? [], [tripWorkspace]);
  const currentTripIsActive = tripWorkspace?.trip?.status === "active";
  const visiblePlaceMap = useMemo(
    () => new Map(places.map((place) => [place.slug, place] as const)),
    [places],
  );
  const tripPlaceMap = useMemo(() => {
    const nextMap = new Map<string, ExplorePlacePreview>();

    tripStops.forEach((stop) => {
      nextMap.set(stop.place.slug, stop.place);
    });

    return nextMap;
  }, [tripStops]);
  const tripStopsBySlug = useMemo(() => {
    const nextMap = new Map<string, (typeof tripStops)[number]>();

    tripStops.forEach((stop) => {
      nextMap.set(stop.place.slug, stop);
    });

    return nextMap;
  }, [tripStops]);
  const selectedPlace = useMemo(
    () =>
      selectedPlaceSlug
        ? visiblePlaceMap.get(selectedPlaceSlug) ??
          tripPlaceMap.get(selectedPlaceSlug) ??
          null
        : null,
    [selectedPlaceSlug, tripPlaceMap, visiblePlaceMap],
  );
  const selectedTripStop = useMemo(
    () =>
      selectedPlaceSlug ? tripStopsBySlug.get(selectedPlaceSlug) ?? null : null,
    [selectedPlaceSlug, tripStopsBySlug],
  );
  const stopPlaceSlugs = useMemo(
    () => tripStops.map((stop) => stop.place.slug),
    [tripStops],
  );
  const stopCoordinates = useMemo(
    () =>
      tripStops.map(
        (stop) =>
          [stop.place.coordinates[0] ?? 0, stop.place.coordinates[1] ?? 0] as [
            number,
            number,
          ],
      ),
    [tripStops],
  );
  const tripPlaceSlugSet = useMemo(
    () => new Set(stopPlaceSlugs),
    [stopPlaceSlugs],
  );
  const availableSelectionSlugs = useMemo(
    () => new Set([...places.map((place) => place.slug), ...stopPlaceSlugs]),
    [places, stopPlaceSlugs],
  );
  const activeRouteCoordinates = useRoutePreview(
    stopCoordinates,
    isAuthenticated,
  );

  const handlePopupClose = useEffectEvent(() => {
    setSelectedPlaceSlug(null);
  });

  const handleAddToTrip = useEffectEvent(async (placeSlug: string) => {
    if (!isAuthenticated) {
      router.push(buildAuthRedirectPath(buildAddToTripIntent(placeSlug)));
      return;
    }

    if (currentTripIsActive || addingSlug === placeSlug) {
      return;
    }

    setAddingSlug(placeSlug);

    try {
      const result = await addStop({ placeSlug });

      if (result.created) {
        setRecentlyAddedSlug(placeSlug);
      }
    } finally {
      setAddingSlug(null);
    }
  });

  useEffect(() => {
    if (!recentlyAddedSlug) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRecentlyAddedSlug((currentSlug) =>
        currentSlug === recentlyAddedSlug ? null : currentSlug,
      );
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [recentlyAddedSlug]);

  useEffect(() => {
    if (seededOnceRef.current) {
      return;
    }

    seededOnceRef.current = true;
    void seedNamibiaPlaces({});
  }, [seedNamibiaPlaces]);

  useEffect(() => {
    if (!containerRef.current || !token) {
      return;
    }

    const containerElement = containerRef.current;
    const hostElement = getOrCreateHostElement();
    mapboxgl.accessToken = token;
    let readyFrame: number | null = null;

    containerElement.appendChild(hostElement);

    if (!sharedMapState.map) {
      const storedCamera = readStoredCameraState();
      const map = new mapboxgl.Map({
        attributionControl: false,
        bearing: storedCamera?.bearing ?? 0,
        center: storedCamera?.center ?? MAPBOX_CENTER,
        container: hostElement,
        dragRotate: false,
        pitch: storedCamera?.pitch ?? 0,
        style: MAPBOX_STYLE,
        touchPitch: false,
        zoom: storedCamera?.zoom ?? MAPBOX_ZOOM,
      });

      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "top-left");
      sharedMapState.map = map;
      sharedMapState.isReady = false;
      attachSharedMapListeners(map);
    }

    const map = sharedMapState.map;
    let isMounted = true;
    const handleLoad = () => {
      sharedMapState.isReady = true;

      if (isMounted) {
        setIsMapReady(true);
      }
    };

    if (sharedMapState.isReady || map.isStyleLoaded()) {
      sharedMapState.isReady = true;
      readyFrame = window.requestAnimationFrame(() => {
        if (isMounted) {
          setIsMapReady(true);
        }
      });
    } else {
      map.on("load", handleLoad);
    }

    const resizeFrame = window.requestAnimationFrame(() => {
      map.resize();
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(resizeFrame);
      if (readyFrame !== null) {
        window.cancelAnimationFrame(readyFrame);
      }
      map.off("load", handleLoad);
      const popupRoot = popupRootRef.current;
      const popupContainer = popupContainerRef.current;
      popupRef.current?.remove();
      popupRef.current = null;
      popupRootRef.current = null;
      popupContainerRef.current = null;
      disposePopupRoot(popupRoot, popupContainer);
      emitInteractionState(false);
      getOrCreateParkingElement().appendChild(hostElement);
    };
  }, [token]);

  useEffect(() => {
    if (!sharedMapState.map || !isVisible) {
      if (!isVisible) {
        emitInteractionState(false);
      }

      return;
    }

    const resizeFrame = window.requestAnimationFrame(() => {
      sharedMapState.map?.resize();
    });

    return () => {
      window.cancelAnimationFrame(resizeFrame);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!selectedPlaceSlug || explorePois === undefined) {
      return;
    }

    if (isAuthenticated && tripWorkspace === undefined) {
      return;
    }

    if (!availableSelectionSlugs.has(selectedPlaceSlug)) {
      setSelectedPlaceSlug(null);
    }
  }, [
    availableSelectionSlugs,
    explorePois,
    isAuthenticated,
    selectedPlaceSlug,
    setSelectedPlaceSlug,
    tripWorkspace,
  ]);

  useEffect(() => {
    if (intent === "add-stop" && intentPlaceSlug) {
      setSelectedPlaceSlug(intentPlaceSlug);
      return;
    }

    processedIntentRef.current = null;
  }, [intent, intentPlaceSlug, setSelectedPlaceSlug]);

  useEffect(() => {
    if (intent !== "add-stop" || !intentPlaceSlug || !isAuthenticated) {
      return;
    }

    if (tripWorkspace === undefined) {
      return;
    }

    const targetSlug = intentPlaceSlug;
    const intentKey = `${intent}:${targetSlug}`;
    if (processedIntentRef.current === intentKey) {
      return;
    }

    processedIntentRef.current = intentKey;

    if (currentTripIsActive) {
      router.replace(pathname);
      return;
    }

    let isActive = true;

    async function consumeAddIntent() {
      setAddingSlug(targetSlug);

      try {
        const result = await addStop({ placeSlug: targetSlug });

        if (isActive && result.created) {
          setRecentlyAddedSlug(targetSlug);
        }
      } finally {
        if (isActive) {
          setAddingSlug(null);
          router.replace(pathname);
        }
      }
    }

    void consumeAddIntent();

    return () => {
      isActive = false;
    };
  }, [
    addStop,
    currentTripIsActive,
    intent,
    intentPlaceSlug,
    isAuthenticated,
    pathname,
    router,
    tripWorkspace,
  ]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady) {
      return;
    }

    const handleMapClick = (event: MapMouseEvent) => {
      const interactiveLayers = [
        EXPLORE_TRIP_STOP_SELECTED_LAYER_ID,
        EXPLORE_TRIP_STOP_LAYER_ID,
        EXPLORE_TRIP_STOP_LABEL_LAYER_ID,
        EXPLORE_POI_SELECTED_LAYER_ID,
        EXPLORE_POI_LAYER_ID,
      ].filter((layerId) => map.getLayer(layerId));

      if (interactiveLayers.length === 0) {
        setSelectedPlaceSlug(null);
        return;
      }

      const clickedPois = map.queryRenderedFeatures(event.point, {
        layers: interactiveLayers,
      });

      if (clickedPois.length > 0) {
        return;
      }

      setSelectedPlaceSlug(null);
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [isMapReady, setSelectedPlaceSlug]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady) {
      return;
    }

    const poiData = buildPoiGeoJson(places);
    const existingSource = map.getSource(EXPLORE_POI_SOURCE_ID) as
      | GeoJSONSource
      | undefined;

    if (!existingSource) {
      map.addSource(EXPLORE_POI_SOURCE_ID, {
        type: "geojson",
        data: poiData,
      });

      map.addLayer({
        id: EXPLORE_POI_LAYER_ID,
        type: "circle",
        source: EXPLORE_POI_SOURCE_ID,
        paint: {
          "circle-color": [
            "case",
            ["get", "featured"],
            "#17181a",
            "#9fe870",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            6,
            7,
            8,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: EXPLORE_POI_SELECTED_LAYER_ID,
        type: "circle",
        source: EXPLORE_POI_SOURCE_ID,
        filter: ["==", ["get", "slug"], ""],
        paint: {
          "circle-color": "#9fe870",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            9,
            7,
            12,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 4,
          "circle-opacity": 0.95,
        },
      });

      return;
    }

    existingSource.setData(poiData);
  }, [isMapReady, places]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady || !map.getLayer(EXPLORE_POI_SELECTED_LAYER_ID)) {
      return;
    }

    map.setFilter(EXPLORE_POI_SELECTED_LAYER_ID, [
      "==",
      ["get", "slug"],
      selectedPlaceSlug ?? "",
    ]);
  }, [isMapReady, places, selectedPlaceSlug]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady) {
      return;
    }

    const layerIds = [
      EXPLORE_POI_LAYER_ID,
      EXPLORE_POI_SELECTED_LAYER_ID,
      EXPLORE_TRIP_STOP_LAYER_ID,
      EXPLORE_TRIP_STOP_SELECTED_LAYER_ID,
      EXPLORE_TRIP_STOP_LABEL_LAYER_ID,
    ].filter((layerId) => map.getLayer(layerId));

    if (layerIds.length === 0) {
      return;
    }

    const handleClick = (event: MapLayerMouseEvent) => {
      const clickedFeature = event.features?.[0];
      const slug =
        clickedFeature?.properties &&
        typeof clickedFeature.properties.slug === "string"
          ? clickedFeature.properties.slug
          : null;

      if (slug) {
        setSelectedPlaceSlug(slug);
      }
    };
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    layerIds.forEach((layerId) => {
      map.on("click", layerId, handleClick);
      map.on("mouseenter", layerId, handleMouseEnter);
      map.on("mouseleave", layerId, handleMouseLeave);
    });

    return () => {
      layerIds.forEach((layerId) => {
        map.off("click", layerId, handleClick);
        map.off("mouseenter", layerId, handleMouseEnter);
        map.off("mouseleave", layerId, handleMouseLeave);
      });
      map.getCanvas().style.cursor = "";
    };
  }, [isMapReady, places, setSelectedPlaceSlug, tripStops]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady) {
      return;
    }

    const routeData = {
      type: "FeatureCollection" as const,
      features:
        activeRouteCoordinates.length > 1
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "LineString" as const,
                  coordinates: activeRouteCoordinates,
                },
                properties: {},
              },
            ]
          : [],
    };

    const existingSource = map.getSource(
      EXPLORE_ROUTE_SOURCE_ID,
    ) as GeoJSONSource | undefined;

    if (!existingSource) {
      map.addSource(EXPLORE_ROUTE_SOURCE_ID, {
        type: "geojson",
        data: routeData,
      });

      map.addLayer({
        id: EXPLORE_ROUTE_GLOW_LAYER_ID,
        type: "line",
        source: EXPLORE_ROUTE_SOURCE_ID,
        paint: {
          "line-color": "#9fe870",
          "line-opacity": 0.28,
          "line-width": 11,
        },
      });

      map.addLayer({
        id: EXPLORE_ROUTE_LAYER_ID,
        type: "line",
        source: EXPLORE_ROUTE_SOURCE_ID,
        paint: {
          "line-color": "#294115",
          "line-opacity": 0.84,
          "line-width": 4,
        },
      });

      return;
    }

    existingSource.setData(routeData);
  }, [activeRouteCoordinates, isMapReady]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady) {
      return;
    }

    const tripStopData = buildTripStopGeoJson(tripStops);
    const existingSource = map.getSource(EXPLORE_TRIP_STOP_SOURCE_ID) as
      | GeoJSONSource
      | undefined;

    if (!existingSource) {
      map.addSource(EXPLORE_TRIP_STOP_SOURCE_ID, {
        type: "geojson",
        data: tripStopData,
      });

      map.addLayer({
        id: EXPLORE_TRIP_STOP_LAYER_ID,
        type: "circle",
        source: EXPLORE_TRIP_STOP_SOURCE_ID,
        paint: {
          "circle-color": "#17181a",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            11,
            7,
            14,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: EXPLORE_TRIP_STOP_SELECTED_LAYER_ID,
        type: "circle",
        source: EXPLORE_TRIP_STOP_SOURCE_ID,
        filter: ["==", ["get", "slug"], ""],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            15,
            7,
            18,
          ],
          "circle-stroke-color": "#9fe870",
          "circle-stroke-width": 4,
        },
      });

      map.addLayer({
        id: EXPLORE_TRIP_STOP_LABEL_LAYER_ID,
        type: "symbol",
        source: EXPLORE_TRIP_STOP_SOURCE_ID,
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            11,
            7,
            13,
          ],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      return;
    }

    existingSource.setData(tripStopData);
  }, [isMapReady, tripStops]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady || !map.getLayer(EXPLORE_TRIP_STOP_SELECTED_LAYER_ID)) {
      return;
    }

    map.setFilter(EXPLORE_TRIP_STOP_SELECTED_LAYER_ID, [
      "==",
      ["get", "slug"],
      selectedTripStop?.place.slug ?? "",
    ]);
  }, [isMapReady, selectedTripStop]);

  useEffect(() => {
    const map = sharedMapState.map;
    if (!map || !isMapReady || !selectedPlace) {
      return;
    }

    map.flyTo({
      center: [selectedPlace.coordinates[0] ?? 0, selectedPlace.coordinates[1] ?? 0],
      duration: 700,
      zoom: Math.max(map.getZoom(), 6.25),
    });
  }, [isMapReady, selectedPlace]);

  useEffect(() => {
    const map = sharedMapState.map;

    if (!map || !isMapReady) {
      return;
    }

    if (!selectedPlace) {
      popupRef.current?.remove();
      return;
    }

    if (!popupContainerRef.current) {
      popupContainerRef.current = document.createElement("div");
      popupRootRef.current = createRoot(popupContainerRef.current);
      popupRef.current = new mapboxgl.Popup({
        anchor: "bottom",
        className: "explore-mapbox-popup",
        closeButton: false,
        closeOnClick: false,
        maxWidth: "320px",
        offset: 22,
      }).setDOMContent(popupContainerRef.current);
    }

    const buttonState = getButtonState({
      isAdding: addingSlug === selectedPlace.slug,
      isAlreadyInTrip: tripPlaceSlugSet.has(selectedPlace.slug),
      isTripActive: currentTripIsActive,
      wasJustAdded: recentlyAddedSlug === selectedPlace.slug,
    });

    popupRootRef.current?.render(
      <ExplorePoiPopup
        buttonDisabled={buttonState.disabled}
        buttonHint={buttonState.hint}
        buttonLabel={buttonState.label}
        isAuthenticated={isAuthenticated}
        onAddToTrip={handleAddToTrip}
        onClose={handlePopupClose}
        place={selectedPlace}
        tripStopNumber={selectedTripStop ? selectedTripStop.orderIndex + 1 : null}
      />,
    );

    popupRef.current
      ?.setLngLat([selectedPlace.coordinates[0] ?? 0, selectedPlace.coordinates[1] ?? 0])
      .addTo(map);
  }, [
    addingSlug,
    currentTripIsActive,
    isAuthenticated,
    isMapReady,
    recentlyAddedSlug,
    selectedPlace,
    selectedTripStop,
    tripPlaceSlugSet,
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
    <div
      ref={containerRef}
      className={`explore-mapbox-canvas ${isMapReady ? "is-ready" : ""} ${isVisible ? "" : "is-hidden"} ${className}`}
      aria-hidden={!isVisible}
      aria-label={isVisible ? "Explore map" : undefined}
    >
      {showLoader ? (
        <div
          className={`explore-mapbox-loader ${isMapReady || !isVisible ? "is-hidden" : ""}`}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

function ExplorePoiPopup({
  buttonDisabled,
  buttonHint,
  buttonLabel,
  isAuthenticated,
  onAddToTrip,
  onClose,
  place,
  tripStopNumber,
}: {
  buttonDisabled: boolean;
  buttonHint: string | null;
  buttonLabel: string;
  isAuthenticated: boolean;
  onAddToTrip: (placeSlug: string) => void;
  onClose: () => void;
  place: ExplorePlacePreview;
  tripStopNumber: number | null;
}) {
  return (
    <div className="w-[min(19rem,70vw)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7f866d]">
              {place.category}
            </p>
            {tripStopNumber ? (
              <span className="rounded-full bg-[#eef6e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#315117]">
                Stop {tripStopNumber}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 text-base font-bold tracking-[-0.03em] text-[#17181a]">
            {place.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-[#71776e]">{place.region}</p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f3f4ef] text-sm font-bold text-[#606852] transition-colors hover:bg-[#eaede4]"
          aria-label={`Close ${place.title}`}
        >
          ×
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#51584c]">{place.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[0.7rem] font-semibold text-[#4b5345]">
          {place.driveTimeFromWindhoek} from Windhoek
        </span>
        <span className="rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[0.7rem] font-semibold text-[#4b5345]">
          {place.estimatedVisitDuration}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {place.highlights.slice(0, 3).map((highlight) => (
          <span
            key={highlight}
            className="rounded-full border border-[#e5e8dd] bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-[#394038]"
          >
            {highlight}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAddToTrip(place.slug);
        }}
        disabled={buttonDisabled}
        className={`pill-button mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold transition-opacity ${
          isAuthenticated
            ? "bg-[#17181a] text-white"
            : "bg-[#9fe870] text-[#163300]"
        } ${buttonDisabled ? "opacity-70" : ""}`}
      >
        {buttonLabel}
      </button>

      {buttonHint ? (
        <p className="mt-2 text-xs leading-5 text-[#66705f]">{buttonHint}</p>
      ) : null}
    </div>
  );
}
