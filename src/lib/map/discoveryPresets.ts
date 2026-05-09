import type { Company } from "@/lib/map-config";
import {
  applyFilterPatch,
  emptyFilters,
  getSectors,
  getStages,
  type FilterPatch,
  type Filters,
} from "@/lib/map-config";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import { computeProfileCompleteness } from "@/lib/investor/profileCompleteness";

export type DiscoveryAudience =
  | "founder"
  | "investor"
  | "employee"
  | "student"
  | "all";

export interface MapDiscoveryPreset {
  id: string;
  label: string;
  description: string;
  audience: DiscoveryAudience;
  enabled: boolean;
  filterPatch: FilterPatch;
}

export function generateMapDiscoveryPresets(
  companies: Company[],
): MapDiscoveryPreset[] {
  const sectors = getSectors();
  const stages = getStages();
  const topSector = sectors[0];
  const hiringN = companies.filter((c) =>
    inferHiringFromDescription(c.description),
  ).length;
  const early = stages
    .filter((s) => ["Pre-Seed", "Seed", "Bootstrapped"].includes(s.value))
    .map((s) => s.value);

  const investorReadyN = companies.filter(
    (c) => computeProfileCompleteness(c).score >= 70,
  ).length;

  const presets: MapDiscoveryPreset[] = [
    {
      id: "hiring",
      label: "Find companies hiring",
      description:
        hiringN > 0
          ? `${hiringN} companies mention hiring-style language in descriptions.`
          : "No hiring keywords detected in descriptions.",
      audience: "employee",
      enabled: hiringN > 0,
      filterPatch: { search: "hiring" },
    },
    {
      id: "early",
      label: "Early-stage startups",
      description: "Focus on pre-seed, seed, and bootstrapped profiles in the data.",
      audience: "investor",
      enabled: early.length > 0,
      filterPatch: { stages: early },
    },
    {
      id: "top-sector",
      label: topSector
        ? `Browse ${topSector.value}`
        : "Browse top sector",
      description: "Largest sector cluster in the current snapshot.",
      audience: "all",
      enabled: Boolean(topSector),
      filterPatch: topSector ? { sectors: [topSector.value] } : {},
    },
    {
      id: "investor-ready",
      label: "Investor-ready profiles",
      description:
        investorReadyN > 0
          ? `${investorReadyN} companies have ≥70% public profile completeness.`
          : "Not enough high-completeness profiles in this export.",
      audience: "investor",
      enabled: investorReadyN > 0,
      filterPatch: { minCompletenessScore: 70 },
    },
  ];

  return presets.filter((p) => p.enabled);
}

export function applyDiscoveryPreset(preset: MapDiscoveryPreset): Filters {
  return applyFilterPatch(emptyFilters(), preset.filterPatch);
}
