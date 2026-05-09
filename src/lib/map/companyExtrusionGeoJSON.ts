import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { Company } from "@/lib/map-config";
import { getSectorColor } from "@/lib/map-config";
import {
  towerHeightFromEmployees,
  towerWidthFromStage,
} from "@/lib/map/buildingScale";
import { blendHexWithWhite, hslStringToHex } from "@/lib/map/hslToHex";

/**
 * Headcount → extrusion height in real-world meters — low-rise scale (Apple Maps–style
 * realism: subtle variation, not skyscraper pins).
 */
export function extrusionHeightMeters(employees: string): number {
  const px = towerHeightFromEmployees(employees);
  const t = (px - 16) / (54 - 16);
  const eased = Math.pow(Math.max(0, Math.min(1, t)), 0.88);
  return Math.round(18 + eased * 82);
}

/** “Street frontage” half-width from stage / scale (meters). */
function extrusionHalfWidthMeters(company: Company): number {
  const wPx = towerWidthFromStage(company.stage, company.employees);
  return Math.round(11 + ((wPx - 11) / (26 - 11)) * 34);
}

/** Shorter axis — scales a bit with team size so larger cos. read as bulkier blocks. */
function extrusionHalfDepthMeters(company: Company, halfWidth: number): number {
  const hPx = towerHeightFromEmployees(company.employees);
  const t = (hPx - 16) / (54 - 16);
  const bulk = 0.62 + 0.38 * Math.pow(Math.max(0, Math.min(1, t)), 0.9);
  return Math.round(halfWidth * bulk * 0.92);
}

function offsetMeters(
  lng: number,
  lat: number,
  eastM: number,
  northM: number,
): [number, number] {
  const cos = Math.cos((lat * Math.PI) / 180);
  const dLng = eastM / (111320 * Math.max(0.2, cos));
  const dLat = northM / 111320;
  return [lng + dLng, lat + dLat];
}

/**
 * Chamfered rectangle (8 verts) — reads more like a building pad than a raw square.
 */
function chamferedFootprintRing(
  lng: number,
  lat: number,
  halfWidth: number,
  halfDepth: number,
): [number, number][] {
  const W = Math.max(4, halfWidth);
  const D = Math.max(4, halfDepth);
  const c = Math.min(W, D) * 0.3;
  const corners: [number, number][] = [
    [-W + c, -D],
    [W - c, -D],
    [W, -D + c],
    [W, D - c],
    [W - c, D],
    [-W + c, D],
    [-W, D - c],
    [-W, -D + c],
    [-W + c, -D],
  ];
  return corners.map(([e, n]) => offsetMeters(lng, lat, e, n));
}

export function buildCompanyExtrusionCollection(
  companies: Company[],
): FeatureCollection {
  const features: Feature<Polygon>[] = companies.map((c) => {
    const halfW = extrusionHalfWidthMeters(c);
    const halfD = extrusionHalfDepthMeters(c, halfW);
    const heightM = extrusionHeightMeters(c.employees);
    const sectorHex = hslStringToHex(getSectorColor(c.sector));
    const color = blendHexWithWhite(sectorHex, 0.1);

    return {
      type: "Feature",
      id: c.id,
      properties: {
        companyId: c.id,
        heightM,
        color,
      },
      geometry: {
        type: "Polygon",
        coordinates: [chamferedFootprintRing(c.lng, c.lat, halfW, halfD)],
      },
    };
  });
  return { type: "FeatureCollection", features };
}
