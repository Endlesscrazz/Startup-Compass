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
  return locs.length >= STATEWIDE_MIN_LOCATIONS || locs.includes(county);
}

function boostMultiplier(
  entry: IndexEntry,
  goal: Goal,
  sector: string,
  community: string[]
): number {
  const mappedTopic = GOAL_TO_TOPIC[goal];
  const mappedIndustry = SECTOR_TO_INDUSTRY[sector] ?? sector;

  const topicMatch = entry.topics.includes(mappedTopic) ? 0.1 : 0;
  const industryMatch = entry.industries.includes(mappedIndustry) ? 0.1 : 0;

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
  goal: Goal,
  sector: string,
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
