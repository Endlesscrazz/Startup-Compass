import type {
  FounderMove,
  FounderProfileInput,
  MatchResultItem,
} from "@/lib/founder/types";
import { GOAL_TO_TOPIC } from "@/lib/profile";

type MoveKind = "start" | "mentor" | "fund" | "scale" | "export" | "general";

const MOVE_LABELS: Record<
  MoveKind,
  { title: string; explain: (r: MatchResultItem) => string }
> = {
  start: {
    title: "Find your first support program",
    explain: (r) =>
      `Start with "${r.title}" — it aligns with early launch and onboarding support in Utah.`,
  },
  mentor: {
    title: "Talk to a mentor or advisor",
    explain: (r) =>
      `Use "${r.title}" to plug into peers, mentors, or community programs.`,
  },
  fund: {
    title: "Prepare for funding",
    explain: (r) =>
      `Prioritize "${r.title}" as you line up capital options that fit your stage.`,
  },
  scale: {
    title: "Plan your next growth moves",
    explain: (r) =>
      `Leverage "${r.title}" for operational or revenue scaling support.`,
  },
  export: {
    title: "Explore expansion & trade",
    explain: (r) =>
      `Use "${r.title}" when you are ready for broader markets or export help.`,
  },
  general: {
    title: "Take the next concrete step",
    explain: (r) =>
      `Follow up with "${r.title}" — it ranked strongly for your profile.`,
  },
};

function classifyTopics(topics: string[]): MoveKind {
  const t = topics.join(" ").toLowerCase();
  if (t.includes("international") || t.includes("export") || t.includes("trade"))
    return "export";
  if (t.includes("funding") || t.includes("capital") || t.includes("finance"))
    return "fund";
  if (
    t.includes("mentor") ||
    t.includes("community") ||
    t.includes("network") ||
    t.includes("entrepreneurship communities")
  )
    return "mentor";
  if (t.includes("late stage") || t.includes("growth") || t.includes("scaling"))
    return "scale";
  if (t.includes("start a business") || t.includes("launch"))
    return "start";
  return "general";
}

function kindFromGoal(goal: FounderProfileInput["goal"]): MoveKind {
  const topic = GOAL_TO_TOPIC[goal]?.toLowerCase() ?? "";
  if (topic.includes("funding")) return "fund";
  if (topic.includes("community") || topic.includes("mentor")) return "mentor";
  if (topic.includes("international")) return "export";
  if (topic.includes("late stage") || topic.includes("growth")) return "scale";
  if (topic.includes("start")) return "start";
  return "general";
}

/**
 * Builds up to three actionable moves from ranked resources + founder goal.
 * Does not hardcode resource titles into templates — titles come from data via `resource.title` inside explanations only where we reference the picked row.
 */
export function generateFounderMoves(
  founderProfile: FounderProfileInput,
  recommendedResources: MatchResultItem[],
): FounderMove[] {
  if (!recommendedResources.length) return [];

  const preferredKind = kindFromGoal(founderProfile.goal);
  const ordered = [...recommendedResources].sort((a, b) => b.score - a.score);

  const picks: { resource: MatchResultItem; kind: MoveKind }[] = [];
  const usedIds = new Set<number>();

  function pickKind(kind: MoveKind) {
    const candidate = ordered.find(
      (r) => !usedIds.has(r.id) && classifyTopics(r.topics) === kind,
    );
    if (candidate) {
      usedIds.add(candidate.id);
      picks.push({ resource: candidate, kind });
    }
  }

  pickKind(preferredKind);
  const secondary: MoveKind[] = ["start", "mentor", "fund", "scale", "export"].filter(
    (k) => k !== preferredKind,
  ) as MoveKind[];
  for (const k of secondary) {
    if (picks.length >= 3) break;
    pickKind(k);
  }

  for (const r of ordered) {
    if (picks.length >= 3) break;
    if (usedIds.has(r.id)) continue;
    usedIds.add(r.id);
    picks.push({
      resource: r,
      kind: classifyTopics(r.topics),
    });
  }

  return picks.slice(0, 3).map((p, i) => {
    const tmpl = MOVE_LABELS[p.kind] ?? MOVE_LABELS.general;
    return {
      priority: i + 1,
      title: tmpl.title,
      explanation: tmpl.explain(p.resource),
      resourceId: p.resource.id,
      resourceTitle: p.resource.title,
      resourceLink: p.resource.link,
    };
  });
}
