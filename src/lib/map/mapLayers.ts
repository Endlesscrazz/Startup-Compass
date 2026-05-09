/**
 * Optional map tile providers — enable only when URLs are valid.
 * Attribution must be preserved wherever tiles are shown.
 */

export type MapLayerId = "default" | "terrain" | "satellite";

export const MAP_LAYER_OPTIONS: {
  id: MapLayerId;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
  enabled: boolean;
}[] = [
  {
    id: "default",
    label: "Default",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    enabled: true,
  },
  {
    id: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c"],
    attribution:
      'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    enabled: true,
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
    enabled: true,
  },
];
