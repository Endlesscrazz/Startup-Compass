import { getIndex, type IndexEntry } from "@/lib/index";
import { GOAL_TO_TOPIC, SECTOR_TO_INDUSTRY, type Goal } from "@/lib/profile";

export interface MatchCandidate {
  entry: IndexEntry;
  score: number;
}

const STATEWIDE_MIN_LOCATIONS = 20;

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function isEligible(entry: IndexEntry, county: string): boolean {
  const locs = entry.locations;
  return locs.includes("Utah") || locs.length >= STATEWIDE_MIN_LOCATIONS || locs.includes(county);
}

// goal and sector are nullable — NL path passes null, boost becomes ×1.0 (pure cosine)
function boostMultiplier(
  entry: IndexEntry,
  goal: Goal | null,
  sector: string | null,
  community: string[]
): number {
  const mappedTopic = goal ? GOAL_TO_TOPIC[goal] : null;
  const mappedIndustry = sector ? (SECTOR_TO_INDUSTRY[sector] ?? sector) : null;

  const topicMatch = mappedTopic && entry.topics.includes(mappedTopic) ? 0.1 : 0;
  const industryMatch = mappedIndustry && entry.industries.includes(mappedIndustry) ? 0.1 : 0;

  const commsData = entry.communities;
  // Community boost fires only when founder has community tags.
  // "Any" resources match all community-tagged founders but don't boost generic requests.
  const communityMatch =
    community.length > 0 &&
    (commsData.includes("Any") || community.some((c) => commsData.includes(c)))
      ? 0.1
      : 0;

  return 1 + topicMatch + industryMatch + communityMatch;
}

export function rankResources(
  profileVector: Float32Array,
  county: string,
  goal: Goal | null,
  sector: string | null,
  community: string[],
  topK = 8
): MatchCandidate[] {
  const index = getIndex();
  const candidates: MatchCandidate[] = [];

  for (const entry of index) {
    if (!isEligible(entry, county)) continue;
    const sim = cosineSim(profileVector, entry.embedding);
    const boost = boostMultiplier(entry, goal, sector, community);
    candidates.push({ entry, score: sim * boost });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK);
}
