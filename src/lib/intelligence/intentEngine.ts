import type { Company } from "@/lib/map-config";
import type { AudienceType, UserIntentProfile } from "@/lib/intelligence/types";
import {
  getIntentProfile,
  listActivity,
  listInterestScores,
  upsertIntentProfile,
  upsertInterestScore,
} from "@/lib/intelligence/store";
import type { ActivityEventType } from "@/lib/intelligence/types";

const VIEW_SCORE = 5;
const FOLLOW_SCORE = 25;
const FILTER_SCORE = 2;
const RESOURCE_SCORE = 4;

export function onActivitySideEffects(input: {
  userId: string;
  event_type: ActivityEventType;
  company_id?: string | null;
  metadata?: Record<string, unknown>;
}): void {
  const cid = input.company_id;
  if (cid && input.event_type === "company_viewed") {
    upsertInterestScore({
      user_id: input.userId,
      company_id: cid,
      delta: VIEW_SCORE,
      reason: "viewed profile",
    });
  }
  if (cid && input.event_type === "company_followed") {
    upsertInterestScore({
      user_id: input.userId,
      company_id: cid,
      delta: FOLLOW_SCORE,
      reason: "followed company",
    });
  }
  if (input.event_type === "filter_applied") {
    const ids = (input.metadata?.matchingCompanyIds as string[] | undefined) ?? [];
    for (const id of ids.slice(0, 8)) {
      upsertInterestScore({
        user_id: input.userId,
        company_id: id,
        delta: FILTER_SCORE,
        reason: "filter overlap",
      });
    }
  }
  if (input.event_type === "resource_clicked" && cid) {
    upsertInterestScore({
      user_id: input.userId,
      company_id: cid,
      delta: RESOURCE_SCORE,
      reason: "resource context",
    });
  }
  recomputeIntentProfile(input.userId);
}

export function recomputeIntentProfile(userId: string): UserIntentProfile {
  const acts = listActivity(userId, 300);
  const sectors = new Set<string>();
  const locations = new Set<string>();
  const stages = new Set<string>();
  const sizes = new Set<string>();
  const keywords = new Set<string>();
  let hiring = false;

  for (const a of acts) {
    const m = a.metadata_json;
    if (a.event_type === "search_performed" && typeof m.query === "string") {
      const q = m.query.toLowerCase();
      keywords.add(m.query as string);
      if (/(hire|hiring|job|career|talent)/i.test(q)) hiring = true;
      if (/(invest|seed|series|vc|fund)/i.test(q)) {
        /* investor signal */
      }
    }
    if (a.event_type === "saved_search_created" && typeof m.label === "string") {
      keywords.add(m.label);
    }
    if (typeof m.sector === "string") sectors.add(m.sector);
    if (typeof m.city === "string") locations.add(m.city);
    if (typeof m.stage === "string") stages.add(m.stage);
    if (typeof m.employees === "string") sizes.add(m.employees);
    if (m.hiringInterest === true) hiring = true;
  }

  let audience: AudienceType = "unknown";
  const joined = [...keywords].join(" ").toLowerCase();
  if (/(hire|job|career|intern)/i.test(joined)) audience = "job_hunter";
  else if (/(invest|seed|series|fund|lp)/i.test(joined)) audience = "investor";
  else if (/(founder|startup|raise|grant)/i.test(joined)) audience = "founder";
  else if (/(student|internship|university)/i.test(joined)) audience = "student";

  const confidence = Math.min(
    1,
    acts.length / 25 + (sectors.size + locations.size) * 0.05,
  );
  const prev = getIntentProfile(userId);
  const t = new Date().toISOString();
  const profile: UserIntentProfile = {
    id: prev?.id ?? `uip-${userId}`,
    user_id: userId,
    audience_type: audience,
    sectors_json: [...sectors],
    locations_json: [...locations],
    company_sizes_json: [...sizes],
    stages_json: [...stages],
    hiring_interest: hiring,
    resource_interests_json: prev?.resource_interests_json ?? [],
    inferred_keywords_json: [...keywords].slice(0, 24),
    confidence_score: Math.round(confidence * 100) / 100,
    updated_at: t,
  };
  upsertIntentProfile(profile);
  return profile;
}

export function topCompaniesForUser(userId: string, companies: Company[], limit = 7): Company[] {
  const scores = listInterestScores(userId)
    .filter((s) => s.should_include_in_brief || s.score >= 5)
    .sort((a, b) => b.score - a.score);
  const byId = new Map(companies.map((c) => [c.id, c]));
  const out: Company[] = [];
  for (const s of scores) {
    const c = byId.get(s.company_id);
    if (c) out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}
