"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Call when sidebar or other chrome changes the map container size. */
export function MapLayoutSync({ revision }: { revision: number }) {
  const map = useMap();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    return () => cancelAnimationFrame(id);
  }, [map, revision]);

  return null;
}
