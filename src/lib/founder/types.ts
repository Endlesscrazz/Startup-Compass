import type { Goal, Stage } from "@/lib/profile";

/** Client-side founder intake aligned with POST /api/match */
export interface FounderProfileInput {
  stage: Stage;
  sector: string;
  city: string;
  goal: Goal;
  community: string[];
  /** Optional — improves outreach drafts */
  founderDisplayName?: string;
  businessName?: string;
}

/** Mirrors API match result shape */
export interface MatchResultItem {
  id: number;
  title: string;
  description: string;
  explanation: string;
  link: string | null;
  email: string | null;
  topics: string[];
  communities: string[];
  industries: string[];
  locations: string[];
  score: number;
}

export interface FounderMove {
  priority: number;
  title: string;
  explanation: string;
  resourceId: number | null;
  resourceTitle: string | null;
  resourceLink: string | null;
}

export interface PathwayStep {
  key: string;
  label: string;
  description: string;
  active: boolean;
  matchingResourceCount: number;
}

export interface FounderActionPlan {
  generatedAt: string;
  profileSummary: string;
  countyNote?: string;
  resources: MatchResultItem[];
  moves: FounderMove[];
}
