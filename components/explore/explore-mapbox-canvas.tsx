"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const MAPBOX_CENTER: [number, number] = [17.0832, -22.5597];
const MAPBOX_ZOOM = 5.15;

type ExploreMapboxCanvasProps = {
  className?: string;
};

export function ExploreMapboxCanvas({
  className = "",
}: ExploreMapboxCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) {
      return;
    }

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
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  if (!token) {
    return (
      <div
        className={`explore-map-fallback ${className}`}
        aria-label="Mapbox token missing fallback background"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,225,137,0.3),transparent_0,transparent_20%),radial-gradient(circle_at_100%_0%,rgba(120,232,238,0.26),transparent_0,transparent_34%),linear-gradient(115deg,rgba(187,175,117,0.86)_0%,rgba(215,214,186,0.9)_34%,rgba(223,231,203,0.88)_68%,rgba(130,220,223,0.82)_100%)]" />
        <div className="absolute left-5 top-5 rounded-full border border-white/60 bg-white/86 px-4 py-2 text-xs font-bold tracking-[0.02em] text-[#334127] shadow-[0_10px_24px_rgba(35,42,31,0.08)]">
          Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the live map
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`explore-mapbox-canvas ${className}`}
      aria-label="Explore map"
    />
  );
}
