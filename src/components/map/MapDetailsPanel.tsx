"use client";

import { useId, useState, useRef, useEffect } from "react";

import {
  MAP_LAYER_OPTIONS,
  type MapLayerId,
} from "@/lib/map/mapLayers";
import type { MapViewMode } from "@/lib/map/mapViewStorage";

type MapDetailsPanelProps = {
  activeLayerId: MapLayerId;
  onLayerChange: (id: MapLayerId) => void;
  measureActive: boolean;
  onMeasureToggle: () => void;
  mapViewMode: MapViewMode;
  onMapViewModeChange: (mode: MapViewMode) => void;
};

export function MapDetailsPanel({
  activeLayerId,
  onLayerChange,
  measureActive,
  onMeasureToggle,
  mapViewMode,
  onMapViewModeChange,
}: MapDetailsPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const el = containerRef.current;
    const stopWheel = (e: Event) => e.stopPropagation();
    el.addEventListener("wheel", stopWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", stopWheel, { capture: true });
  }, [open]);

  const layerChoices = MAP_LAYER_OPTIONS.filter((o) => o.enabled);

  return (
    <div
      className="pointer-events-auto absolute bottom-6 right-4 z-[560] flex flex-col items-end"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-rule/90 bg-surface-elev/96 text-ink shadow-[0_2px_12px_-2px_rgba(11,27,51,0.18)] backdrop-blur-md transition-all duration-200 hover:border-gold ${open ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
          aria-label="Map layers and tools"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l-8 4 8 4 8-4-8-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 11l8 4 8-4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l8 4 8-4" />
          </svg>
        </button>

        <div
          id={panelId}
          ref={containerRef}
          className={`absolute bottom-0 right-0 w-52 overflow-hidden rounded-2xl border border-rule/80 bg-surface-elev/98 text-[12px] shadow-2xl backdrop-blur transition-all duration-300 origin-bottom-right ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          <div className="p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
              Map Type
            </p>
            <div className="flex flex-col gap-1">
              {layerChoices.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  aria-pressed={activeLayerId === layer.id}
                  onClick={() => onLayerChange(layer.id as MapLayerId)}
                  className={`rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition-colors ${
                    activeLayerId === layer.id
                      ? "bg-ink text-surface shadow-sm"
                      : "bg-transparent text-ink hover:bg-surface-tint hover:text-ink"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-rule/50 p-3 bg-surface-tint/30">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
              View
            </p>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                aria-pressed={mapViewMode === "2d"}
                onClick={() => onMapViewModeChange("2d")}
                className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                  mapViewMode === "2d"
                    ? "bg-ink text-surface shadow-sm"
                    : "bg-transparent text-ink hover:bg-surface-tint"
                }`}
              >
                2D
              </button>
              <button
                type="button"
                aria-pressed={mapViewMode === "3d"}
                onClick={() => onMapViewModeChange("3d")}
                className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                  mapViewMode === "3d"
                    ? "bg-ink text-surface shadow-sm"
                    : "bg-transparent text-ink hover:bg-surface-tint"
                }`}
              >
                3D
              </button>
            </div>
          </div>
          <div className="border-t border-rule/50 p-3 bg-surface-tint/30">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
              Tools
            </p>
            <button
              type="button"
              aria-pressed={measureActive}
              onClick={onMeasureToggle}
              className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-colors ${
                measureActive
                  ? "border-gold bg-gold-soft text-ink"
                  : "border-rule bg-surface text-ink hover:border-gold hover:bg-surface-tint"
              }`}
            >
              Measure distance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
