import type { Company } from "@/lib/map-config";

/** Match `EMPLOYEE_ORDER` in map-config / dataset CSV bands */
const EMPLOYEE_BANDS = [
  "1",
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1,000",
  "1,001-5,000",
  "5,001-10,000",
  "10,001+",
  "Unknown",
] as const;

const STAGE_FOOTPRINT: Record<string, number> = {
  "Pre-Seed": 0.72,
  Seed: 0.85,
  Unknown: 0.78,
  Bootstrapped: 0.88,
  "Series A": 1,
  "Series B": 1.08,
  "Series C": 1.18,
  "Series D+": 1.28,
  Growth: 1.35,
};

const MIN_TOWER_H = 16;
const MAX_TOWER_H = 54;
const MIN_TOWER_W = 11;
const MAX_TOWER_W = 26;

function employeeBandIndex(employees: string): number {
  const i = EMPLOYEE_BANDS.indexOf(employees as (typeof EMPLOYEE_BANDS)[number]);
  return i === -1 ? EMPLOYEE_BANDS.length - 1 : i;
}

/**
 * Tower height (px) from reported headcount band — larger teams “taller” on the map.
 */
export function towerHeightFromEmployees(employees: string): number {
  const idx = employeeBandIndex(employees);
  const t = idx / Math.max(1, EMPLOYEE_BANDS.length - 1);
  return Math.round(MIN_TOWER_H + t * (MAX_TOWER_H - MIN_TOWER_H));
}

/**
 * Building footprint width (px) from funding stage (proxy for scale / growth trajectory).
 * Widens slightly for later-stage and growth companies.
 */
export function towerWidthFromStage(stage: string, employees: string): number {
  const mult = STAGE_FOOTPRINT[stage] ?? 0.9;
  const empBoost = employeeBandIndex(employees) >= 5 ? 1.06 : 1;
  const w = (MIN_TOWER_W + MAX_TOWER_W) / 2 * mult * empBoost;
  return Math.round(Math.min(MAX_TOWER_W, Math.max(MIN_TOWER_W, w)));
}

export function getBuildingScale(company: Company): {
  towerHeight: number;
  towerWidth: number;
} {
  return {
    towerHeight: towerHeightFromEmployees(company.employees),
    towerWidth: towerWidthFromStage(company.stage, company.employees),
  };
}
