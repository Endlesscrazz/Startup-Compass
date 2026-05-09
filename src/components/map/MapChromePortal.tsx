"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

/**
 * Renders children inside the MapLibre map container under marker/popup UI.
 */
export function MapChromePortal({
  children,
  mapRef,
  mapReady,
}: {
  children: ReactNode;
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const container = map.getContainer();
    const layer = document.createElement("div");
    layer.className = "map-chrome-root";
    container.appendChild(layer);
    setNode(layer);
    return () => {
      layer.remove();
      setNode(null);
    };
  }, [mapReady, mapRef]);

  if (!node) return null;

  return createPortal(
    <div className="flex h-full w-full flex-col pointer-events-none">
      {children}
    </div>,
    node,
  );
}
