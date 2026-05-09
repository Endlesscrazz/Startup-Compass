"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useMap } from "react-leaflet";

/**
 * Renders children inside the Leaflet map container (2D).
 */
export function MapChromePortalLeaflet({
  children,
}: {
  children: ReactNode;
}) {
  const map = useMap();
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    const layer = document.createElement("div");
    layer.className = "map-chrome-root";
    container.appendChild(layer);
    queueMicrotask(() => setNode(layer));
    return () => {
      layer.remove();
      setNode(null);
    };
  }, [map]);

  if (!node) return null;

  return createPortal(
    <div className="flex h-full w-full flex-col pointer-events-none">
      {children}
    </div>,
    node,
  );
}
