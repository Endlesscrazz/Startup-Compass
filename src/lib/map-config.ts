/**
 * Visual config + helpers shared between the map and its filter sidebar.
 *
 * Company rows are generated from the CSV in `dataset/` — see `rawDataset.mapCompaniesCsv`
 * in `src/lib/dataset.ts`. Regenerate with `npm run data`.
 */

import companiesJson from "@/data/companies.json";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import { computeProfileCompleteness } from "@/lib/investor/profileCompleteness";
import { normalizeDomain } from "@/lib/investor/verification";
import { getCompanyCoordinates } from "@/lib/map/companyAccessors";
import { haversineKm } from "@/lib/map/distance";
import {
  getDynamicSectorColor,
  initSectorColorsFromDataset,
} from "@/lib/map/sectorColors";

/** Extended optional fields when spreadsheet adds columns */
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
  logo?: string | null;
  yearFounded?: number | null;
  // ── Stickiness & intelligence fields ──────────────────────────
  /** Hiring status: derived heuristically or set by founder via claim */
  hiringStatus?: "hiring" | "not-hiring" | "unknown";
  /** Remote work policy */
  remotePolicy?: "remote" | "hybrid" | "in-person" | "unknown";
  /** Connected to a Utah university (U of U, BYU, USU, etc.) */
  universityConnected?: boolean;
  /** Tags representing what the founder needs right now */
  founderNeeds?: string[];
  /** True if a founder has verified and claimed this profile */
  claimedByFounder?: boolean;
  /** ISO date of last data update — used for change feed */
  lastUpdated?: string;
  /** Pre-computed opportunity signals (Hiring Now, Remote Friendly, etc.) */
  opportunityBadges?: string[];
  /** Funding information */
  fundingAmount?: string | null;
  lastFundingDate?: string | null;
};

export const COMPANIES: Company[] = companiesJson as Company[];

initSectorColorsFromDataset(COMPANIES.map((c) => c.sector));

/** Sector outline / marker color — derived from sorted unique sectors + palette (no fixed map by name). */
export function getSectorColor(sector: string): string {
  return getDynamicSectorColor(sector);
}

/** @deprecated — use getSectorColor; kept to avoid breaking imports */
export const FALLBACK_SECTOR_COLOR = "hsl(215 24% 42%)";

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

/** Top cities by frequency for filter chips */
export function getCities(limit = 18): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of COMPANIES) {
    const city = c.city?.trim();
    if (!city) continue;
    counts.set(city, (counts.get(city) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type GeoFilter = {
  lat: number;
  lng: number;
  maxKm: number;
};

export type Filters = {
  search: string;
  sectors: Set<string>;
  stages: Set<string>;
  employees: Set<string>;
  cities: Set<string>;
  /** Minimum profile completeness score (0–100), when set */
  minCompletenessScore?: number;
  /** Filter to companies within great-circle distance of a point */
  geoFilter?: GeoFilter;
  // ── Opportunity-based filters ──────────────────────────
  /** Show only companies currently hiring */
  hiringOnly?: boolean;
  /** Show only remote/hybrid companies */
  remoteOnly?: boolean;
  /** Show only university-connected companies */
  universityConnected?: boolean;
  /** Filter by founder need tags */
  founderNeedsTags?: string[];
  /** Show only founder-claimed profiles */
  claimedOnly?: boolean;
  /** Show only companies updated in the last N days */
  recentlyUpdatedDays?: number;
};

/** Apply preset slices — arrays become new Sets when provided */
export type FilterPatch = {
  search?: string;
  sectors?: string[];
  stages?: string[];
  employees?: string[];
  cities?: string[];
  minCompletenessScore?: number | null;
  geoFilter?: GeoFilter | null;
  hiringOnly?: boolean | null;
  remoteOnly?: boolean | null;
  universityConnected?: boolean | null;
  founderNeedsTags?: string[] | null;
  claimedOnly?: boolean | null;
  recentlyUpdatedDays?: number | null;
};

export function applyFilterPatch(base: Filters, patch: FilterPatch): Filters {
  return {
    search: patch.search !== undefined ? patch.search : base.search,
    sectors:
      patch.sectors !== undefined ? new Set(patch.sectors) : new Set(base.sectors),
    stages:
      patch.stages !== undefined ? new Set(patch.stages) : new Set(base.stages),
    employees:
      patch.employees !== undefined
        ? new Set(patch.employees)
        : new Set(base.employees),
    cities:
      patch.cities !== undefined ? new Set(patch.cities) : new Set(base.cities),
    minCompletenessScore:
      patch.minCompletenessScore !== undefined
        ? patch.minCompletenessScore === null
          ? undefined
          : patch.minCompletenessScore
        : base.minCompletenessScore,
    geoFilter:
      patch.geoFilter !== undefined
        ? patch.geoFilter === null
          ? undefined
          : patch.geoFilter
        : base.geoFilter,
    hiringOnly:
      patch.hiringOnly !== undefined
        ? patch.hiringOnly === null ? undefined : patch.hiringOnly
        : base.hiringOnly,
    remoteOnly:
      patch.remoteOnly !== undefined
        ? patch.remoteOnly === null ? undefined : patch.remoteOnly
        : base.remoteOnly,
    universityConnected:
      patch.universityConnected !== undefined
        ? patch.universityConnected === null ? undefined : patch.universityConnected
        : base.universityConnected,
    founderNeedsTags:
      patch.founderNeedsTags !== undefined
        ? patch.founderNeedsTags === null ? undefined : patch.founderNeedsTags
        : base.founderNeedsTags,
    claimedOnly:
      patch.claimedOnly !== undefined
        ? patch.claimedOnly === null ? undefined : patch.claimedOnly
        : base.claimedOnly,
    recentlyUpdatedDays:
      patch.recentlyUpdatedDays !== undefined
        ? patch.recentlyUpdatedDays === null ? undefined : patch.recentlyUpdatedDays
        : base.recentlyUpdatedDays,
  };
}

export function emptyFilters(): Filters {
  return {
    search: "",
    sectors: new Set(),
    stages: new Set(),
    employees: new Set(),
    cities: new Set(),
    minCompletenessScore: undefined,
    geoFilter: undefined,
    hiringOnly: undefined,
    remoteOnly: undefined,
    universityConnected: undefined,
    founderNeedsTags: undefined,
    claimedOnly: undefined,
    recentlyUpdatedDays: undefined,
  };
}

function searchHaystack(c: Company): string {
  const domain = normalizeDomain(c.website);
  const parts = [
    c.name,
    c.city,
    c.sector,
    c.stage,
    c.employees,
    c.description ?? "",
    domain ?? "",
    c.website ?? "",
  ];
  return parts.join(" ").toLowerCase();
}

export function applyFilters(filters: Filters): Company[] {
  const q = filters.search.trim().toLowerCase();
  const minC = filters.minCompletenessScore;
  const geo = filters.geoFilter;
  const now = Date.now();

  return COMPANIES.filter((c) => {
    if (filters.sectors.size > 0 && !filters.sectors.has(c.sector))
      return false;
    if (filters.stages.size > 0 && !filters.stages.has(c.stage)) return false;
    if (filters.employees.size > 0 && !filters.employees.has(c.employees))
      return false;
    if (filters.cities.size > 0 && !filters.cities.has(c.city)) return false;
    if (minC !== undefined && computeProfileCompleteness(c).score < minC) {
      return false;
    }
    if (geo) {
      const p = getCompanyCoordinates(c);
      if (!p) return false;
      if (haversineKm(geo, p) > geo.maxKm) return false;
    }
    // ── Opportunity-based filters ────────────────────────────────
    if (filters.hiringOnly) {
      // Accept explicit hiring flag OR inferred from description
      const explicit = c.hiringStatus === "hiring";
      const inferred = !c.hiringStatus && inferHiringFromDescription(c.description);
      if (!explicit && !inferred) return false;
    }
    if (filters.remoteOnly) {
      const policy = c.remotePolicy;
      if (policy !== "remote" && policy !== "hybrid") return false;
    }
    if (filters.universityConnected) {
      if (!c.universityConnected) return false;
    }
    if (filters.claimedOnly) {
      if (!c.claimedByFounder) return false;
    }
    if (filters.founderNeedsTags && filters.founderNeedsTags.length > 0) {
      if (!c.founderNeeds) return false;
      const hasAll = filters.founderNeedsTags.every((tag) =>
        c.founderNeeds!.includes(tag),
      );
      if (!hasAll) return false;
    }
    if (filters.recentlyUpdatedDays && c.lastUpdated) {
      const updatedMs = new Date(c.lastUpdated).getTime();
      const cutoffMs = now - filters.recentlyUpdatedDays * 24 * 60 * 60 * 1000;
      if (updatedMs < cutoffMs) return false;
    }
    if (q) {
      if (!searchHaystack(c).includes(q)) return false;
    }
    return true;
  });
}

export type SortMode = "relevance" | "name" | "city" | "stage";

export function sortCompanies(list: Company[], mode: SortMode): Company[] {
  const out = [...list];
  if (mode === "relevance") {
    return out;
  }
  if (mode === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else if (mode === "city") {
    out.sort((a, b) =>
      a.city === b.city
        ? a.name.localeCompare(b.name)
        : a.city.localeCompare(b.city),
    );
  } else if (mode === "stage") {
    out.sort((a, b) =>
      a.stage === b.stage
        ? a.name.localeCompare(b.name)
        : a.stage.localeCompare(b.stage),
    );
  }
  return out;
}
