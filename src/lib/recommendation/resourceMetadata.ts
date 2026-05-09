import type { MatchResultItem } from "@/app/api/match/route";

const UTAH_COUNTY_COUNT = 29;

/** Heuristic resource type from title, topics, description — not authoritative. */
export function inferResourceTypeLabel(resource: MatchResultItem): string | null {
  const blob = `${resource.title} ${resource.description} ${(resource.topics ?? []).join(" ")}`.toLowerCase();
  if (/(^|\s)(sbir|sttr|grant)\b/.test(blob)) return "Grant / R&D program";
  if (/\baccelerator\b/.test(blob)) return "Accelerator";
  if (/\bincubator\b/.test(blob)) return "Incubator";
  if (/\bmentor|score|sbdc|small business development\b/.test(blob)) return "Mentorship / advising";
  if (/\bevent|pitch|competition|conference\b/.test(blob)) return "Event / competition";
  if (/\buniversity|college|lassonde|byu\b/.test(blob)) return "University resource";
  if (/\bcowork|workspace|lab space|facility\b/.test(blob)) return "Workspace / facilities";
  if (/\bworkforce|job corps|department of workforce\b/.test(blob)) return "Government program";
  if (/\bangel|venture|capital|fund\b/.test(blob)) return "Funding";
  if (/(^|\s)(loan|revolving fund)\b/.test(blob)) return "Funding";
  return null;
}

export function isLikelyStatewide(locations: string[]): boolean {
  return locations.length >= UTAH_COUNTY_COUNT - 2;
}

export function locationSummary(resource: MatchResultItem, countyHint?: string | null): string {
  const locs = resource.locations ?? [];
  if (locs.length === 0) return "Not listed yet";
  if (isLikelyStatewide(locs)) return "Statewide (Utah counties)";
  const c = countyHint?.replace(/ county$/i, "").trim();
  if (c && locs.some((l) => l.toLowerCase().includes(c.toLowerCase()))) {
    return `${c} County · also other regions`;
  }
  if (locs.length <= 5) return locs.join(", ");
  return `${locs.length} counties · see program details`;
}

export function remoteMentioned(resource: MatchResultItem): boolean {
  const blob = `${resource.description} ${resource.title}`.toLowerCase();
  return /\bremote|online|virtual|statewide\b/.test(blob);
}
