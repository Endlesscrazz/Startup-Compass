/** Additive types for explainable recommendations — aligned with existing naming. */

export type FreshnessStatus = "fresh" | "aging" | "stale" | "unknown";

export interface RecommendationReason {
  label: string;
  explanation: string;
  weight: number;
  sourceField?: string;
}

export interface ResourceRecommendation {
  resourceId: number;
  score: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  warnings: string[];
  matchedStage?: string;
  matchedGoal?: string;
  matchedLocation?: string;
  matchedSector?: string;
  deadlineUrgency?: "none" | "soon" | "unknown";
  freshnessStatus: FreshnessStatus;
}

export interface PulseItem {
  id: string;
  type: string;
  title: string;
  summary: string;
  whyItMatters: string;
  timestamp: string | null;
  source: string;
  sourceUrl?: string | null;
  relatedEntityType?: "company" | "resource" | "sector" | "none";
  relatedEntityId?: string | null;
  tags: string[];
  freshnessStatus: FreshnessStatus;
  action?: { label: string; href: string };
}

export interface UserIntent {
  role: string;
  goal: string;
  stage?: string;
  sector?: string;
  location?: string;
  county?: string;
  remotePreference?: boolean;
  queryText?: string;
  extractedFilters: string[];
}

export interface EligibilityEstimate {
  status: "likely_fit" | "maybe_fit" | "unlikely_fit" | "not_enough_information";
  reasons: string[];
  missingFields: string[];
  confidence: "high" | "medium" | "low";
}
