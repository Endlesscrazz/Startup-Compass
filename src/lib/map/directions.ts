import { getCompanyAddress, getCompanyCoordinates } from "@/lib/map/companyAccessors";
import type { Company } from "@/lib/map-config";

/** Opens external directions — prefers coordinates, falls back to address query */
export function buildDirectionsUrls(company: Company): {
  googleMaps: string;
  appleMaps: string;
  osm: string;
} | null {
  const coords = getCompanyCoordinates(company);
  const addr = getCompanyAddress(company);

  if (coords) {
    const { lat, lng } = coords;
    const q = `${lat},${lng}`;
    return {
      googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`,
      appleMaps: `https://maps.apple.com/?daddr=${lat},${lng}`,
      osm: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lng}%2C${lat}`,
    };
  }

  if (addr) {
    const encoded = encodeURIComponent(addr);
    return {
      googleMaps: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      appleMaps: `https://maps.apple.com/?q=${encoded}`,
      osm: `https://www.openstreetmap.org/search?query=${encoded}`,
    };
  }

  return null;
}
