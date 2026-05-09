import type {
  FounderActionPlan,
  FounderMove,
  FounderProfileInput,
  MatchResultItem,
} from "@/lib/founder/types";

function summarizeProfile(p: FounderProfileInput, county?: string | null): string {
  const parts = [
    `Stage: ${p.stage}`,
    `Sector: ${p.sector}`,
    `Location: ${p.city}`,
    `Goal: ${p.goal}`,
  ];
  if (p.community?.length) parts.push(`Community tags: ${p.community.join(", ")}`);
  if (p.founderDisplayName) parts.push(`Founder: ${p.founderDisplayName}`);
  if (p.businessName) parts.push(`Business: ${p.businessName}`);
  if (county) parts.push(`County (resolved): ${county}`);
  return parts.join("\n");
}

export function buildFounderActionPlan(
  founderProfile: FounderProfileInput,
  recommendedResources: MatchResultItem[],
  founderMoves: FounderMove[],
  options?: { county?: string | null },
): FounderActionPlan {
  return {
    generatedAt: new Date().toISOString(),
    profileSummary: summarizeProfile(founderProfile, options?.county),
    countyNote: options?.county ?? undefined,
    resources: recommendedResources,
    moves: founderMoves,
  };
}

export function formatActionPlanAsText(plan: FounderActionPlan): string {
  const lines: string[] = [];
  lines.push("Startup Compass — Founder action plan");
  lines.push(`Generated: ${plan.generatedAt}`);
  lines.push("");
  lines.push("Profile");
  lines.push(plan.profileSummary);
  lines.push("");
  lines.push("Your Next 3 Moves");
  plan.moves.forEach((m) => {
    lines.push(`${m.priority}. ${m.title}`);
    lines.push(`   ${m.explanation}`);
    if (m.resourceLink) lines.push(`   Link: ${m.resourceLink}`);
    lines.push("");
  });
  lines.push("Recommended resources");
  plan.resources.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.title}`);
    if (r.link) lines.push(`   ${r.link}`);
    lines.push(`   ${r.explanation}`);
    lines.push("");
  });
  return lines.join("\n");
}

export function formatActionPlanAsJson(plan: FounderActionPlan): string {
  return JSON.stringify(plan, null, 2);
}
