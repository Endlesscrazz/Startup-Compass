import type { FounderProfileInput, MatchResultItem } from "@/lib/founder/types";
import { GOAL_TO_TOPIC, SECTOR_TO_INDUSTRY } from "@/lib/profile";

function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

function industryForSector(sector: string): string | null {
  return SECTOR_TO_INDUSTRY[sector] ?? null;
}

function topicMatchesGoal(goal: FounderProfileInput["goal"], topics: string[]): boolean {
  const want = norm(GOAL_TO_TOPIC[goal]);
  if (!want) return false;
  return topics.some((t) => norm(t).includes(want) || want.includes(norm(t)));
}

/**
 * Human-readable match reasons from profile + resource metadata (no per-resource hardcoding).
 */
export function getResourceMatchReasons(
  founderProfile: FounderProfileInput,
  resource: MatchResultItem,
  options?: { county?: string | null },
): string[] {
  const reasons: string[] = [];
  const industries = resource.industries ?? [];
  const topics = resource.topics ?? [];
  const locations = resource.locations ?? [];
  const comm = resource.communities ?? [];

  const mapped = industryForSector(founderProfile.sector);
  if (mapped && industries.some((i) => norm(i) === norm(mapped))) {
    reasons.push(`Recommended because its industry coverage includes your sector (${mapped}).`);
  }

  if (topicMatchesGoal(founderProfile.goal, topics)) {
    reasons.push(
      `Aligned with your stated goal — topics include programs relevant to "${founderProfile.goal}".`,
    );
  }

  if (topics.some((t) => norm(t).includes("start") || norm(t).includes("launch"))) {
    if (founderProfile.stage === "idea" || founderProfile.stage === "building") {
      reasons.push("Offers startup or launch-oriented support that fits your stage.");
    }
  }

  if (topics.some((t) => norm(t).includes("fund") || norm(t).includes("capital"))) {
    if (founderProfile.goal === "Funding") {
      reasons.push("Includes funding- or capital-related topics matching your funding goal.");
    }
  }

  const county = options?.county?.trim();
  if (county) {
    const countyHit =
      locations.some((loc) => norm(loc).includes(norm(county))) ||
      locations.some((loc) => norm(loc).includes("statewide")) ||
      locations.length === 0 ||
      locations.length >= 25;
    if (countyHit) {
      reasons.push(`Location eligibility includes your area (${county}).`);
    }
  }

  if (founderProfile.community?.length && comm.length) {
    const overlap = founderProfile.community.filter((c) =>
      comm.some((rc) => norm(rc).includes(norm(c)) || norm(c).includes(norm(rc))),
    );
    if (overlap.length) {
      reasons.push("Lists communities or audiences that overlap your founder profile.");
    }
  }

  if (reasons.length === 0) {
    reasons.push(
      "Surfaced by semantic similarity between your profile and this program description.",
    );
  }

  return reasons.slice(0, 4);
}
