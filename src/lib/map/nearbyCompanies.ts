import { getCompanyCoordinates } from "@/lib/map/companyAccessors";
import { haversineKm } from "@/lib/map/distance";
import type { Company } from "@/lib/map-config";

export function findNearbyCompanies(
  company: Company,
  allCompanies: Company[],
  limit = 5,
): Company[] {
  const origin = getCompanyCoordinates(company);
  if (!origin) {
    return allCompanies
      .filter((c) => c.id !== company.id && c.city === company.city)
      .slice(0, limit);
  }

  return allCompanies
    .filter((c) => c.id !== company.id)
    .map((c) => {
      const p = getCompanyCoordinates(c);
      if (!p) {
        return {
          c,
          d: c.city === company.city ? 0.5 : Infinity,
        };
      }
      return { c, d: haversineKm(origin, p) };
    })
    .filter((x) => Number.isFinite(x.d))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.c);
}
