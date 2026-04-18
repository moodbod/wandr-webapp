"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPBOX_CENTER: [number, number] = [17.0832, -22.5597];
const MAPBOX_ZOOM = 5.15;
export const EXPLORE_MAP_INTERACTION_EVENT = "wandr:explore-map-interaction";

type ExploreMapboxCanvasProps = {
  className?: string;
};

export function ExploreMapboxCanvas({
  className = "",
}: ExploreMapboxCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    setIsMapReady(false);

    if (!token) {
      return;
    }

    let restoreTimeout: ReturnType<typeof setTimeout> | null = null;

    const emitInteractionState = (isInteracting: boolean) => {
      window.dispatchEvent(
        new CustomEvent(EXPLORE_MAP_INTERACTION_EVENT, {
          detail: { isInteracting },
        }),
      );
    };

    const scheduleRestore = () => {
      if (restoreTimeout) {
        clearTimeout(restoreTimeout);
      }

      restoreTimeout = setTimeout(() => {
        emitInteractionState(false);
      }, 180);
    };

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: MAPBOX_CENTER,
      zoom: MAPBOX_ZOOM,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      dragRotate: false,
      touchPitch: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "top-left");
    mapRef.current = map;

    map.on("load", () => {
      map.setFog({});
      setIsMapReady(true);
    });
    map.on("dragstart", () => emitInteractionState(true));
    map.on("dragend", scheduleRestore);
    map.on("zoomstart", () => emitInteractionState(true));
    map.on("zoomend", scheduleRestore);
    map.on("rotatestart", () => emitInteractionState(true));
    map.on("rotateend", scheduleRestore);
    map.on("pitchstart", () => emitInteractionState(true));
    map.on("pitchend", scheduleRestore);
    map.on("movestart", () => emitInteractionState(true));
    map.on("moveend", scheduleRestore);

    return () => {
      if (restoreTimeout) {
        clearTimeout(restoreTimeout);
      }
      emitInteractionState(false);
      setIsMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  return (
    <div
      ref={containerRef}
      className={`explore-mapbox-canvas ${isMapReady ? "is-ready" : ""} ${className}`}
      aria-label="Explore map"
    >
      <div
        className={`explore-mapbox-loader ${isMapReady ? "is-hidden" : ""}`}
        aria-hidden="true"
      />
    </div>
  );
}
