import type { ReactNode } from "react";
import { Navigation, Plus } from "lucide-react";

type Marker = {
  id?: string;
  label: string;
  note?: string;
  top: string;
  left: string;
  emphasis?: boolean;
};

export function FauxMap({
  children,
  className = "",
  markers,
  topBar,
  showControls = false,
  selectedMarkerId,
  onMarkerSelect,
}: {
  children?: ReactNode;
  className?: string;
  markers: Marker[];
  topBar?: ReactNode;
  showControls?: boolean;
  selectedMarkerId?: string;
  onMarkerSelect?: (markerId: string) => void;
}) {
  return (
    <section className={`map-canvas p-5 ${className}`}>
      <div className="map-road left-[6%] top-[28%] w-[42%] rotate-[11deg]" />
      <div className="map-road left-[38%] top-[54%] w-[28%] rotate-[-16deg]" />
      <div className="map-road left-[58%] top-[40%] w-[24%] rotate-[20deg]" />

      {topBar ? <div className="relative z-10">{topBar}</div> : null}

      {markers.map((marker) => {
        const markerId = marker.id ?? `${marker.label}-${marker.top}-${marker.left}`;
        const isSelected = selectedMarkerId === markerId;

        return (
          <div
            key={markerId}
            className="absolute z-10"
            style={{ top: marker.top, left: marker.left }}
          >
            <button
              type="button"
              onClick={onMarkerSelect ? () => onMarkerSelect(markerId) : undefined}
              className="flex flex-col items-center gap-2 text-left"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-full border-4 border-white text-[#274218] shadow-[0_10px_20px_rgba(0,0,0,0.12)] transition-transform duration-150 ${
                  isSelected
                    ? "scale-110 bg-[#9fe870]"
                    : marker.emphasis
                      ? "bg-[#9fe870]"
                      : "bg-[#c4f49f]"
                }`}
              >
                <span className="size-2 rounded-full bg-[#355a20]" />
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-colors ${
                  isSelected
                    ? "bg-[#17181a] text-white"
                    : "bg-white text-[#303632]"
                }`}
              >
                {marker.label}
                {marker.note ? ` • ${marker.note}` : ""}
              </div>
            </button>
          </div>
        );
      })}

      {showControls ? (
        <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2">
          <button className="surface-card-strong flex size-12 items-center justify-center rounded-full">
            <Plus className="size-4" />
          </button>
          <button className="surface-card-strong flex size-12 items-center justify-center rounded-full">
            <Navigation className="size-4" />
          </button>
        </div>
      ) : null}

      {children}
    </section>
  );
}
