"use client";

import { createPortal } from "react-dom";

export function MeasureDistanceTool({
  active,
  portalTarget,
  km,
  pointCount,
}: {
  active: boolean;
  portalTarget: HTMLElement | null;
  km: number;
  pointCount: number;
}) {
  if (!active || !portalTarget || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none absolute bottom-24 left-4 z-[450] max-w-[min(260px,calc(100%-140px))] rounded-lg border border-rule/80 bg-surface-elev/95 px-3 py-2 text-[11px] text-ink shadow-lg backdrop-blur">
      <span className="font-semibold text-ink">
        {pointCount < 2 ? "0" : km.toFixed(2)}
      </span>{" "}
      km
      <span className="text-ink-mute">
        {" "}
        · click map to add points · Esc clears
      </span>
    </div>,
    portalTarget,
  );
}
