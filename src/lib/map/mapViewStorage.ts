export type MapViewMode = "2d" | "3d";

const STORAGE_KEY = "startup-compass-map-view";

function isMapViewMode(v: string): v is MapViewMode {
  return v === "2d" || v === "3d";
}

export function readStoredMapView(): MapViewMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return isMapViewMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredMapView(mode: MapViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
