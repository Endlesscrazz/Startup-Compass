"use client";

import { useEffect, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

/** Call when sidebar or other chrome changes the map container size. */
export function MapLayoutSync({
  mapRef,
  revision,
}: {
  mapRef: RefObject<MapRef | null>;
  revision: number;
}) {
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      mapRef.current?.resize();
    });
    return () => cancelAnimationFrame(id);
  }, [mapRef, revision]);

  return null;
}
