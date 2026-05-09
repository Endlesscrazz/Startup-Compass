import type {
  Map as MapLibreMap,
  RasterTileSource,
  StyleSpecification,
} from "maplibre-gl";

import {
  MAP_LAYER_OPTIONS,
  type MapLayerId,
} from "@/lib/map/mapLayers";

export function tilesForLayer(layerId: MapLayerId): string[] {
  const opt =
    MAP_LAYER_OPTIONS.find((o) => o.id === layerId && o.enabled) ??
    MAP_LAYER_OPTIONS[0]!;
  if (opt.subdomains?.length) {
    return opt.subdomains.map((s) => opt.url.replace("{s}", s));
  }
  return [opt.url];
}

/** Initial GL style; after load, call `syncBasemapTiles` when `MapLayerId` changes. */
export function buildMaplibreBaseStyle(
  layerId: MapLayerId = "default",
): StyleSpecification {
  const opt =
    MAP_LAYER_OPTIONS.find((o) => o.id === layerId && o.enabled) ??
    MAP_LAYER_OPTIONS[0]!;
  const tiles = tilesForLayer(layerId);

  return {
    version: 8,
    name: "startup-compass-3d",
    metadata: {
      "mapbox:autocomposite": false,
    },
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution: opt.attribution,
        maxzoom: opt.maxZoom ?? 19,
      },
      "terrain-dem": {
        type: "raster-dem",
        url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
        tileSize: 256,
        encoding: "mapbox",
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
    terrain: {
      source: "terrain-dem",
      exaggeration: 1.08,
    },
  };
}

export function syncBasemapTiles(map: MapLibreMap, layerId: MapLayerId): void {
  const opt =
    MAP_LAYER_OPTIONS.find((o) => o.id === layerId && o.enabled) ??
    MAP_LAYER_OPTIONS[0]!;
  const src = map.getSource("basemap");
  if (!src || src.type !== "raster") return;
  const raster = src as RasterTileSource;
  raster.setTiles(tilesForLayer(layerId));
  const attrib = opt.attribution;
  const el = map.getContainer().querySelector(".maplibregl-ctrl-attrib-inner");
  if (el) el.innerHTML = attrib;
}
