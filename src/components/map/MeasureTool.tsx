"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { pathLengthKm } from "@/lib/map/distance";

export function MeasureDistanceTool({ active }: { active: boolean }) {
  const [pts, setPts] = useState<L.LatLng[]>([]);
  const map = useMap();

  useMapEvents({
    click(e) {
      if (!active) return;
      setPts((p) => [...p, e.latlng]);
    },
  });

  useEffect(() => {
    if (!active) return;
    const esc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setPts([]);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [active]);

  const km = useMemo(() => {
    const flat = pts.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
    return pathLengthKm(flat);
  }, [pts]);

  const positions = pts.map((ll) => [ll.lat, ll.lng] as [number, number]);

  if (!active) return null;

  const hud =
    typeof document !== "undefined"
      ? createPortal(
          <div className="pointer-events-none absolute bottom-12 left-4 z-[450] max-w-[min(260px,calc(100%-140px))] rounded-lg border border-rule/80 bg-surface-elev/95 px-3 py-2 text-[11px] text-ink shadow-lg backdrop-blur">
            <span className="font-semibold text-ink">
              {pts.length < 2 ? "0" : km.toFixed(2)}
            </span>{" "}
            km
            <span className="text-ink-mute">
              {" "}
              · click map to add points · Esc clears
            </span>
          </div>,
          map.getContainer(),
        )
      : null;

  return (
    <>
      {positions.length >= 2 && (
        <Polyline
          positions={positions}
          pathOptions={{
            color: "var(--accent, #b8542a)",
            weight: 3,
            opacity: 0.92,
          }}
        />
      )}
      {hud}
    </>
  );
}
