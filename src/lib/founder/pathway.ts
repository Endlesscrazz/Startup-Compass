import type {
  FounderProfileInput,
  MatchResultItem,
  PathwayStep,
} from "@/lib/founder/types";
import type { Stage } from "@/lib/profile";

const STEP_DEFS: {
  key: string;
  label: string;
  description: string;
  topicMatch: (t: string) => boolean;
}[] = [
  {
    key: "idea",
    label: "Idea",
    description: "Shape the problem, customer, and earliest experiments.",
    topicMatch: (t) => {
      const x = t.toLowerCase();
      return (
        x.includes("idea") ||
        x.includes("explore") ||
        x.includes("validation") ||
        x.includes("discovery")
      );
    },
  },
  {
    key: "start",
    label: "Start",
    description: "Launch workflows: formation, basics, first programs.",
    topicMatch: (t) => {
      const x = t.toLowerCase();
      return x.includes("start a business") || x.includes("launch");
    },
  },
  {
    key: "mentorship",
    label: "Mentorship",
    description: "Peers, mentors, communities, and guided support.",
    topicMatch: (t) => {
      const x = t.toLowerCase();
      return (
        x.includes("mentor") ||
        x.includes("community") ||
        x.includes("network") ||
        x.includes("entrepreneurship communities")
      );
    },
  },
  {
    key: "funding",
    label: "Funding",
    description: "Capital readiness, grants, loans, and investors.",
    topicMatch: (t) => {
      const x = t.toLowerCase();
      return (
        x.includes("fund") ||
        x.includes("capital") ||
        x.includes("grant") ||
        x.includes("finance")
      );
    },
  },
  {
    key: "growth",
    label: "Growth",
    description: "Scale operations, revenue, and team.",
    topicMatch: (t) => {
      const x = t.toLowerCase();
      return (
        x.includes("growth") ||
        x.includes("scale") ||
        x.includes("late stage") ||
        x.includes("marketing and sales")
      );
    },
  },
  {
    key: "export",
    label: "Export",
    description: "Regional expansion, trade, and international markets.",
    topicMatch: (t) => {
      const x = t.toLowerCase();
      return (
        x.includes("international") ||
        x.includes("export") ||
        x.includes("trade")
      );
    },
  },
];

function countForStep(
  resources: MatchResultItem[],
  topicMatch: (t: string) => boolean,
): number {
  let n = 0;
  for (const r of resources) {
    const hit = r.topics.some(topicMatch);
    if (hit) n += 1;
  }
  return n;
}

function preferredStepIndex(stage: Stage, goal: string): number {
  const g = goal.toLowerCase();
  if (g.includes("international")) return 5;
  if (g.includes("funding")) return 3;
  if (g.includes("mentorship")) return 2;
  if (g.includes("scaling")) return 4;
  const map: Record<Stage, number> = {
    idea: 0,
    building: 1,
    revenue: 4,
    growth: 4,
  };
  return map[stage] ?? 1;
}

/**
 * Horizontal pathway with dynamic counts from current recommendation set only.
 */
export function deriveFounderPathway(
  founderProfile: FounderProfileInput,
  recommendedResources: MatchResultItem[],
): PathwayStep[] {
  const counts = STEP_DEFS.map((def) =>
    countForStep(recommendedResources, def.topicMatch),
  );
  const pref = preferredStepIndex(founderProfile.stage, founderProfile.goal);
  const maxCount = Math.max(0, ...counts);
  const richestIdx =
    maxCount > 0 ? counts.indexOf(maxCount) : Math.min(pref, STEP_DEFS.length - 1);
  const activeIndex = maxCount > 0 ? richestIdx : pref;

  return STEP_DEFS.map((def, i) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    active: i === activeIndex,
    matchingResourceCount: counts[i] ?? 0,
  }));
}
