import type { Company } from "@/lib/map-config";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";

export interface TopBin {
  label: string;
  count: number;
}

export interface EcosystemStats {
  totalCompanies: number;
  topSectors: TopBin[];
  topCities: TopBin[];
  stageDistribution: TopBin[];
  employeeDistribution: TopBin[];
  hiringLikelyCount: number;
}

function topBins(counts: Map<string, number>, limit: number): TopBin[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function computeEcosystemStats(companies: Company[]): EcosystemStats {
  const sectors = new Map<string, number>();
  const cities = new Map<string, number>();
  const stages = new Map<string, number>();
  const employees = new Map<string, number>();
  let hiringLikelyCount = 0;

  for (const c of companies) {
    sectors.set(c.sector, (sectors.get(c.sector) || 0) + 1);
    cities.set(c.city, (cities.get(c.city) || 0) + 1);
    stages.set(c.stage, (stages.get(c.stage) || 0) + 1);
    employees.set(c.employees, (employees.get(c.employees) || 0) + 1);
    if (inferHiringFromDescription(c.description)) hiringLikelyCount += 1;
  }

  return {
    totalCompanies: companies.length,
    topSectors: topBins(sectors, 3),
    topCities: topBins(cities, 3),
    stageDistribution: topBins(stages, 8),
    employeeDistribution: topBins(employees, 8),
    hiringLikelyCount,
  };
}
