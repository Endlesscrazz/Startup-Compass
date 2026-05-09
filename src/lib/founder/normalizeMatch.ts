import type { MatchResultItem } from "@/lib/founder/types";

/** Ensures optional API fields never break client utilities */
export function normalizeMatchResult(
  raw: Partial<MatchResultItem> & { id: number },
): MatchResultItem {
  return {
    id: raw.id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    explanation: raw.explanation ?? "",
    link: raw.link ?? null,
    email: raw.email ?? null,
    topics: raw.topics ?? [],
    communities: raw.communities ?? [],
    industries: raw.industries ?? [],
    locations: raw.locations ?? [],
    score: typeof raw.score === "number" ? raw.score : 0,
  };
}
