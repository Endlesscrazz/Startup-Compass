"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";

/**
 * Renders children inside the Leaflet map container with z-index below the
 * popup pane so marker cards stay on top.
 */
export function MapChromePortal({ children }: { children: React.ReactNode }) {
  const map = useMap();
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    const layer = document.createElement("div");
    layer.className = "map-chrome-root";
    container.appendChild(layer);
    /* Sync map host mount with Leaflet — portal target must exist after container is ready */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM node mount for createPortal
    setNode(layer);
    return () => {
      layer.remove();
    };
  }, [map]);

  if (!node) return null;

  return createPortal(
    <div className="flex h-full w-full flex-col pointer-events-none">{children}</div>,
    node,
  );
}
