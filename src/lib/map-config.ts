/**
 * Visual config + helpers shared between the map and its filter sidebar.
 */

import companiesJson from "@/data/companies.json";

export type Company = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  lat: number;
  lng: number;
  description: string | null;
  website: string | null;
  linkedin: string | null;
  stage: string;
  employees: string;
  sector: string;
};

export const COMPANIES: Company[] = companiesJson as Company[];

/**
 * Sector → marker color.
 * Hand-tuned to read clearly against OSM tiles AND match the
 * Utah-cream brand palette from the landing page.
 */
export const SECTOR_COLORS: Record<string, string> = {
  "B2B Software": "#b8542a", // brand terracotta — biggest segment
  Consumer: "#d97a48",
  "Bio/Medical Tech": "#3a8a7c",
  FinTech: "#4a6cb3",
  Security: "#6b4c93",
  Energy: "#c2934a",
  Marketplaces: "#b8675a",
  "Aerospace & Defense": "#2e4d6c",
  AI: "#8c6f3d",
  Other: "#5a6477",
};

export const FALLBACK_SECTOR_COLOR = "#5a6477";

export function getSectorColor(sector: string): string {
  return SECTOR_COLORS[sector] || FALLBACK_SECTOR_COLOR;
}

/** Bias the natural stage order so chips render in a sensible sequence. */
const STAGE_ORDER = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth",
  "Bootstrapped",
  "Unknown",
];

const EMPLOYEE_ORDER = [
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
];

function orderBy(values: string[], order: string[]): string[] {
  const idx = (v: string) => {
    const i = order.indexOf(v);
    return i === -1 ? order.length + 1 : i;
  };
  return [...values].sort((a, b) => idx(a) - idx(b));
}

/** All distinct sectors present in the data, sorted by company count desc. */
export function getSectors(): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of COMPANIES) {
    counts.set(c.sector, (counts.get(c.sector) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function getStages(): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of COMPANIES) {
    counts.set(c.stage, (counts.get(c.stage) || 0) + 1);
  }
  const entries = [...counts.entries()].map(([value, count]) => ({
    value,
    count,
  }));
  const ordered = orderBy(
    entries.map((e) => e.value),
    STAGE_ORDER,
  );
  return ordered.map((value) => ({
    value,
    count: counts.get(value) || 0,
  }));
}

export function getEmployees(): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of COMPANIES) {
    counts.set(c.employees, (counts.get(c.employees) || 0) + 1);
  }
  const entries = [...counts.entries()].map(([value, count]) => ({
    value,
    count,
  }));
  const ordered = orderBy(
    entries.map((e) => e.value),
    EMPLOYEE_ORDER,
  );
  return ordered.map((value) => ({
    value,
    count: counts.get(value) || 0,
  }));
}

export type Filters = {
  search: string;
  sectors: Set<string>;
  stages: Set<string>;
  employees: Set<string>;
};

export function emptyFilters(): Filters {
  return {
    search: "",
    sectors: new Set(),
    stages: new Set(),
    employees: new Set(),
  };
}

export function applyFilters(filters: Filters): Company[] {
  const q = filters.search.trim().toLowerCase();
  return COMPANIES.filter((c) => {
    if (filters.sectors.size > 0 && !filters.sectors.has(c.sector)) return false;
    if (filters.stages.size > 0 && !filters.stages.has(c.stage)) return false;
    if (filters.employees.size > 0 && !filters.employees.has(c.employees))
      return false;
    if (q) {
      const hay = `${c.name} ${c.description ?? ""} ${c.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
