"use client";

import { useId, useState } from "react";
import {
  MAP_LAYER_OPTIONS,
  type MapLayerId,
} from "@/lib/map/mapLayers";

type MapDetailsPanelProps = {
  activeLayerId: MapLayerId;
  onLayerChange: (id: MapLayerId) => void;
  measureActive: boolean;
  onMeasureToggle: () => void;
};

type ToggleRow = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const MAP_DETAILS_ROWS: ToggleRow[] = [
  {
    id: "transit",
    label: "Transit",
    description: "Overlay tiles require a configured transit provider.",
    enabled: false,
  },
  {
    id: "traffic",
    label: "Traffic",
    description: "Requires a traffic tile API — not configured for this build.",
    enabled: false,
  },
  {
    id: "biking",
    label: "Biking",
    description: "No OpenStreetMap biking overlay is wired yet.",
    enabled: false,
  },
  {
    id: "streetview",
    label: "Street View",
    description: "Opening external Street View is out of scope without an API key.",
    enabled: false,
  },
  {
    id: "wildfires",
    label: "Wildfires",
    description: "Live wildfire layers need an external data provider.",
    enabled: false,
  },
  {
    id: "air",
    label: "Air quality",
    description: "Air quality tiles require a configured provider.",
    enabled: false,
  },
];

const MAP_TOOLS_ROWS: ToggleRow[] = [
  {
    id: "travel",
    label: "Travel time",
    description: "Isochrones need a routing provider — disabled until configured.",
    enabled: false,
  },
];

const VIEWS_ROWS: ToggleRow[] = [
  {
    id: "globe",
    label: "Globe view",
    description: "True globe mode needs Mapbox/Cesium — Leaflet uses flat projection.",
    enabled: false,
  },
  {
    id: "labels",
    label: "Labels",
    description: "Separate label overlay not configured; OSM labels stay on the base map.",
    enabled: false,
  },
];

export function MapDetailsPanel({
  activeLayerId,
  onLayerChange,
  measureActive,
  onMeasureToggle,
}: MapDetailsPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const layerChoices = MAP_LAYER_OPTIONS.filter((o) => o.enabled);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-[560] max-w-[min(320px,calc(100vw-2rem))]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-rule/90 bg-surface-elev/96 px-3 py-2 text-[11px] font-semibold text-ink shadow-[0_2px_12px_-2px_rgba(11,27,51,0.18)] backdrop-blur-md hover:border-accent"
      >
        <span aria-hidden="true">{open ? "▼" : "▶"}</span>
        Map & layers
      </button>
      {open && (
        <div
          id={panelId}
          className="mt-2 max-h-[min(65vh,480px)] overflow-y-auto overscroll-y-contain rounded-2xl border border-rule/80 bg-surface-elev/98 p-3 text-[11px] shadow-xl backdrop-blur"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Map type
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {layerChoices.map((layer) => (
              <button
                key={layer.id}
                type="button"
                aria-pressed={activeLayerId === layer.id}
                onClick={() => onLayerChange(layer.id as MapLayerId)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeLayerId === layer.id
                    ? "border-ink bg-ink text-surface"
                    : "border-rule bg-surface text-ink-soft hover:border-accent"
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          <Section title="Map overlays" rows={MAP_DETAILS_ROWS} />
          <Section title="Map tools" rows={MAP_TOOLS_ROWS} />
          <div className="mt-3 border-t border-rule/70 pt-3">
            <button
              type="button"
              aria-pressed={measureActive}
              onClick={onMeasureToggle}
              className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-colors ${
                measureActive
                  ? "border-accent bg-accent-soft text-ink"
                  : "border-rule bg-surface text-ink hover:border-accent"
              }`}
            >
              Measure distance
              <span className="mt-0.5 block text-[10px] font-normal text-ink-mute">
                Click the map to drop points. Esc clears the path.
              </span>
            </button>
          </div>
          <Section title="Views" rows={VIEWS_ROWS} />
          <p className="mt-3 text-[10px] leading-snug text-ink-mute">
            Unsupported items stay disabled so we never show fake live data. Add
            providers via env configuration when your team is ready.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: ToggleRow[] }) {
  return (
    <div className="mt-4 border-t border-rule/70 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              disabled={!row.enabled}
              title={!row.enabled ? row.description : undefined}
              className="flex w-full flex-col rounded-md border border-transparent px-2 py-1.5 text-left text-[11px] text-ink-soft hover:bg-surface-tint/80 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="font-medium text-ink">{row.label}</span>
              {!row.enabled && (
                <span className="text-[10px] text-ink-mute">
                  Requires provider configuration
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
