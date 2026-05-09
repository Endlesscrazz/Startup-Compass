import type { MatchResultItem } from "@/app/api/match/route";
import type { FounderProfileInput } from "@/lib/founder/types";
import { getResourceMatchReasons } from "@/lib/founder/matchReasons";
import { GOAL_TO_TOPIC, SECTOR_TO_INDUSTRY, type Goal, type Stage } from "@/lib/profile";
import type { EligibilityEstimate, FreshnessStatus, ResourceRecommendation } from "./types";
import { isLikelyStatewide, remoteMentioned } from "./resourceMetadata";

function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

function topicMatchesGoal(goal: Goal, topics: string[]): boolean {
  const want = norm(GOAL_TO_TOPIC[goal]);
  if (!want) return false;
  return topics.some((t) => norm(t).includes(want) || want.includes(norm(t)));
}

export function freshnessFromResource(_resource: MatchResultItem): FreshnessStatus {
  void _resource;
  return "unknown";
}

/**
 * Scores a matched resource using only fields present on the result + founder profile.
 * API `score` is blended in; unknown fields are not heavily penalized.
 */
export function scoreResourceRecommendation(
  founder: FounderProfileInput,
  resource: MatchResultItem,
  options?: { county?: string | null },
): ResourceRecommendation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const detailReasons = getResourceMatchReasons(founder, resource, { county: options?.county });

  let pts = Math.min(100, Math.max(0, Math.round(resource.score)));
  const industries = resource.industries ?? [];
  const topics = resource.topics ?? [];
  const mapped = SECTOR_TO_INDUSTRY[founder.sector];
  let sectorHit = false;
  if (mapped && industries.some((i) => norm(i) === norm(mapped))) {
    sectorHit = true;
    pts = Math.min(100, pts + 4);
  } else if (mapped) {
    warnings.push("Sector fit is inferred from text — industry tags do not list your sector explicitly.");
  }

  const goalHit = topicMatchesGoal(founder.goal, topics);
  if (goalHit) pts = Math.min(100, pts + 3);

  const county = options?.county?.trim();
  let locNote: string | undefined;
  if (county) {
    const locs = resource.locations ?? [];
    const hit =
      locs.some((loc) => norm(loc).includes(norm(county))) ||
      isLikelyStatewide(locs) ||
      locs.length === 0;
    if (hit) {
      locNote = `${county} County eligibility`;
      pts = Math.min(100, pts + 2);
    } else {
      warnings.push("County coverage may be narrower than your area — confirm on the program site.");
    }
  }

  if (remoteMentioned(resource)) {
    reasons.push("Mentions remote or statewide access in the description.");
  }

  detailReasons.forEach((r) => reasons.push(r));

  const confidence: "high" | "medium" | "low" =
    sectorHit && goalHit && detailReasons.length >= 2
      ? "high"
      : detailReasons.length >= 1
        ? "medium"
        : "low";

  return {
    resourceId: resource.id,
    score: Math.min(100, pts),
    confidence,
    reasons: reasons.slice(0, 6),
    warnings,
    matchedStage: founder.stage,
    matchedGoal: founder.goal,
    matchedLocation: locNote,
    matchedSector: mapped ?? founder.sector,
    deadlineUrgency: "unknown",
    freshnessStatus: freshnessFromResource(resource),
  };
}

export function estimateEligibility(
  founder: FounderProfileInput,
  resource: MatchResultItem,
  options?: { county?: string | null },
): EligibilityEstimate {
  const missing: string[] = [];
  const reasons: string[] = [];
  if (!founder.city?.trim()) missing.push("your city or county");
  if (!founder.sector) missing.push("sector");

  const county = options?.county?.trim();
  const locs = resource.locations ?? [];
  let countyOk = true;
  if (county && locs.length > 0 && !isLikelyStatewide(locs)) {
    countyOk = locs.some((l) => norm(l).includes(norm(county)));
  }

  const mapped = SECTOR_TO_INDUSTRY[founder.sector];
  const sectorOk =
    !mapped ||
    resource.industries.length === 0 ||
    resource.industries.some((i) => norm(i) === norm(mapped));

  if (countyOk) {
    reasons.push("Your county appears compatible with this program's listed service areas (estimated).");
  } else {
    reasons.push("Your county may not be listed in this program's coverage — double-check eligibility.");
  }
  if (sectorOk) {
    reasons.push("Industry tags overlap with your sector or are broad enough to include it.");
  } else {
    reasons.push("Industry tags may not include your sector — program could still fit; read details.");
  }

  let status: EligibilityEstimate["status"] = "maybe_fit";
  if (missing.length >= 2) status = "not_enough_information";
  else if (countyOk && sectorOk) status = "likely_fit";
  else if (!countyOk && !sectorOk) status = "unlikely_fit";

  const confidence: EligibilityEstimate["confidence"] =
    missing.length > 0 ? "low" : countyOk && sectorOk ? "medium" : "low";

  return {
    status,
    reasons,
    missingFields: missing,
    confidence,
  };
}

export function founderFromQuizStorage(stored: {
  stage: string;
  sector: string;
  city: string;
  goal: string;
  community?: string[];
}): FounderProfileInput {
  return {
    stage: stored.stage as Stage,
    sector: stored.sector,
    city: stored.city,
    goal: stored.goal as Goal,
    community: stored.community ?? [],
  };
}

export function founderFromNlStorage(stored: { description: string; city: string }): FounderProfileInput {
  return {
    stage: "idea",
    sector: "Other",
    city: stored.city,
    goal: "Start a Business",
    community: [],
  };
}

export function locationSortKey(resource: MatchResultItem, county: string | null | undefined): number {
  const c = county?.replace(/ county$/i, "").trim();
  const locs = resource.locations ?? [];
  if (!c) return 2;
  if (locs.length === 0) return 2;
  if (isLikelyStatewide(locs)) return 1;
  if (locs.some((l) => norm(l).includes(norm(c)))) return 0;
  return 1;
}

/** Optional reorder from quick-match location preferences (does not replace API rank by default). */
export function sortResultsWithLocationPrefs(
  results: MatchResultItem[],
  county: string | null | undefined,
  prefs: { statewideBoost?: boolean; remotePrefer?: boolean } | null,
): MatchResultItem[] {
  if (!prefs?.statewideBoost && !prefs?.remotePrefer) return results;
  const c = county ?? "";
  return [...results].sort((a, b) => {
    let ka = locationSortKey(a, c) * 10;
    let kb = locationSortKey(b, c) * 10;
    if (prefs.statewideBoost) {
      ka += isLikelyStatewide(a.locations ?? []) ? -4 : 0;
      kb += isLikelyStatewide(b.locations ?? []) ? -4 : 0;
    }
    if (prefs.remotePrefer) {
      ka += remoteMentioned(a) ? -3 : 0;
      kb += remoteMentioned(b) ? -3 : 0;
    }
    if (ka !== kb) return ka - kb;
    return b.score - a.score;
  });
}
