"use client";

import "./startup-map.css";

import { useCallback, useState } from "react";
import { StartupMapLeaflet } from "@/components/map/StartupMapLeaflet";
import { StartupMapMapLibre } from "@/components/map/StartupMapMapLibre";
import type { StartupMapProps } from "@/components/map/startupMapTypes";
import {
  readStoredMapView,
  writeStoredMapView,
  type MapViewMode,
} from "@/lib/map/mapViewStorage";

type Props = Omit<StartupMapProps, "mapViewMode" | "onMapViewModeChange">;

export default function StartupMap(props: Props) {
  const [mapView, setMapView] = useState<MapViewMode>(() => {
    if (typeof window === "undefined") return "2d";
    return readStoredMapView() ?? "2d";
  });

  const onMapViewModeChange = useCallback((mode: MapViewMode) => {
    setMapView(mode);
    writeStoredMapView(mode);
  }, []);

  const full: StartupMapProps = {
    ...props,
    mapViewMode: mapView,
    onMapViewModeChange,
  };

  return mapView === "3d" ? (
    <StartupMapMapLibre {...full} />
  ) : (
    <StartupMapLeaflet {...full} />
  );
}
