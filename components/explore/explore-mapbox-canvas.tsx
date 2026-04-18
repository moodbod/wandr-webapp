"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPBOX_CENTER: [number, number] = [17.0832, -22.5597];
const MAPBOX_ZOOM = 5.15;
const MAPBOX_CAMERA_STORAGE_KEY = "wandr:explore-map-camera";
export const EXPLORE_MAP_INTERACTION_EVENT = "wandr:explore-map-interaction";

type StoredCameraState = {
  bearing: number;
  center: [number, number];
  pitch: number;
  zoom: number;
};

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

export function hasExploreMapSession() {
  return sharedMapState.map !== null;
}

export function ExploreMapboxCanvas({
  className = "",
  isVisible = true,
  showLoader = true,
}: ExploreMapboxCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMapReady, setIsMapReady] = useState(
    () => sharedMapState.isReady || sharedMapState.map?.isStyleLoaded() === true,
  );
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!token) {
      return;
    }

    const containerElement = containerRef.current;
    const hostElement = getOrCreateHostElement();
    mapboxgl.accessToken = token;

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
    } else {
      map.on("load", handleLoad);
    }

    const resizeFrame = window.requestAnimationFrame(() => {
      map.resize();
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(resizeFrame);
      map.off("load", handleLoad);
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
