import type { Company, Filters } from "@/lib/map-config";
import {
  applyFilterPatch,
  emptyFilters,
  getEmployees,
  getSectors,
  getStages,
  type FilterPatch,
} from "@/lib/map-config";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";

export interface ThesisPreset {
  id: string;
  label: string;
  description: string;
  filterPatch: FilterPatch;
}

/**
 * Data-driven one-click filter patches (no static company/sector/city names in code).
 */
export function generateInvestorThesisPresets(companies: Company[]): ThesisPreset[] {
  const sectors = getSectors();
  const stages = getStages();
  const emps = getEmployees();

  const topSector = sectors[0];
  const topCity = (() => {
    const m = new Map<string, number>();
    for (const c of companies) m.set(c.city, (m.get(c.city) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  })();

  const earlyStageValues = new Set(
    ["Pre-Seed", "Seed", "Bootstrapped", "Unknown"].filter((s) =>
      stages.some((x) => x.value === s),
    ),
  );
  const earlyList = stages
    .map((s) => s.value)
    .filter((s) => earlyStageValues.has(s))
    .slice(0, 4);

  const largestEmpBucket = [...emps]
    .filter((e) => e.value !== "Unknown")
    .sort((a, b) => b.count - a.count)[0];

  const presets: ThesisPreset[] = [];

  if (topSector) {
    presets.push({
      id: "top-sector",
      label: `Focus: ${topSector.value}`,
      description:
        "Apply the sector filter with the most companies in the current dataset snapshot.",
      filterPatch: { sectors: [topSector.value] },
    });
  }

  if (topCity) {
    presets.push({
      id: "near-city",
      label: `Companies near ${topCity[0]}`,
      description:
        "Uses search text — refine further with sector/stage chips after applying.",
      filterPatch: { search: topCity[0] },
    });
  }

  const hiringCount = companies.filter((c) =>
    inferHiringFromDescription(c.description),
  ).length;
  if (hiringCount > 0) {
    presets.push({
      id: "hiring-signals",
      label: "Hiring signals (description)",
      description: `${hiringCount} companies mention hiring-style language in descriptions — filtered via search keyword.`,
      filterPatch: { search: "hiring" },
    });
  }

  if (earlyList.length) {
    presets.push({
      id: "early-stage",
      label: "Early-stage density",
      description: "Focus on the most common early lifecycle stages present in the data.",
      filterPatch: { stages: earlyList },
    });
  }

  if (largestEmpBucket && largestEmpBucket.count > 0) {
    presets.push({
      id: "largest-teams",
      label: `Largest team bucket (${largestEmpBucket.value})`,
      description:
        "Surfaces the employee-size segment with the most companies right now.",
      filterPatch: { employees: [largestEmpBucket.value] },
    });
  }

  return presets;
}

export function presetToFilters(
  base: Filters,
  preset: ThesisPreset,
  mode: "merge" | "replace" = "replace",
): Filters {
  const seed = mode === "replace" ? emptyFilters() : base;
  return applyFilterPatch(seed, preset.filterPatch);
}
