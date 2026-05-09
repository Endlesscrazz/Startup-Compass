/**
 * Opportunity Badges — computed signals that surface useful context
 * about a company without requiring founder input.
 *
 * Badges are deliberately lightweight: they use existing Company fields
 * plus simple heuristics so they work even without claimed profiles.
 */

import type { Company } from "@/lib/map-config";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";

export type OpportunityBadge = {
  id: string;
  label: string;
  /** Tailwind-compatible color classes for bg + text */
  color: string;
  /** Short explanation shown in tooltip */
  description: string;
};

/** All badge definitions in priority order */
export const BADGE_DEFINITIONS: Record<string, Omit<OpportunityBadge, "id">> = {
  "hiring-now": {
    label: "Hiring Now",
    color: "bg-emerald-500/15 text-emerald-800 border-emerald-300/60",
    description: "This company is actively hiring.",
  },
  "raising-soon": {
    label: "Raising Soon",
    color: "bg-violet-500/15 text-violet-800 border-violet-300/60",
    description: "Growth signals suggest this company may be fundraising.",
  },
  "remote-friendly": {
    label: "Remote Friendly",
    color: "bg-sky-500/15 text-sky-800 border-sky-300/60",
    description: "This company supports remote or hybrid work.",
  },
  "student-friendly": {
    label: "Student Friendly",
    color: "bg-amber-500/15 text-amber-800 border-amber-300/60",
    description: "Good fit for students and early-career job seekers.",
  },
  "founder-claimed": {
    label: "Founder Claimed",
    color: "bg-gold-soft/50 text-ink border-gold/50",
    description: "A founder has verified and claimed this profile.",
  },
  "new-this-week": {
    label: "New This Week",
    color: "bg-pink-500/15 text-pink-800 border-pink-300/60",
    description: "Added or updated in the last 7 days.",
  },
  "university-connected": {
    label: "University Connected",
    color: "bg-indigo-500/15 text-indigo-800 border-indigo-300/60",
    description: "Connected to a Utah university (U of U, BYU, USU, etc.).",
  },
  "fast-growing": {
    label: "Fast Growing",
    color: "bg-orange-500/15 text-orange-800 border-orange-300/60",
    description: "Employee growth signals indicate rapid scaling.",
  },
};

const STUDENT_FRIENDLY_SIZES = new Set(["1", "2-10", "11-50"]);
const RAISING_SOON_STAGES = new Set(["Pre-Seed", "Seed", "Bootstrapped"]);

/** Compute applicable opportunity badges for a company */
export function computeBadges(
  company: Company,
  opts: { now?: number } = {},
): OpportunityBadge[] {
  const now = opts.now ?? Date.now();
  const badges: OpportunityBadge[] = [];

  // ── Hiring Now ──────────────────────────────────────────────────
  const explicitHiring = company.hiringStatus === "hiring";
  const inferredHiring =
    !company.hiringStatus && inferHiringFromDescription(company.description);
  if (explicitHiring || inferredHiring) {
    badges.push({ id: "hiring-now", ...BADGE_DEFINITIONS["hiring-now"]! });
  }

  // ── Raising Soon ────────────────────────────────────────────────
  // Early-stage companies without recent funding signal likely raising
  if (RAISING_SOON_STAGES.has(company.stage) && !company.lastFundingDate) {
    badges.push({ id: "raising-soon", ...BADGE_DEFINITIONS["raising-soon"]! });
  }

  // ── Remote Friendly ─────────────────────────────────────────────
  if (
    company.remotePolicy === "remote" ||
    company.remotePolicy === "hybrid"
  ) {
    badges.push({
      id: "remote-friendly",
      ...BADGE_DEFINITIONS["remote-friendly"]!,
    });
  }

  // ── Student Friendly ────────────────────────────────────────────
  const isSmall = STUDENT_FRIENDLY_SIZES.has(company.employees);
  if (isSmall || company.universityConnected) {
    badges.push({
      id: "student-friendly",
      ...BADGE_DEFINITIONS["student-friendly"]!,
    });
  }

  // ── University Connected ────────────────────────────────────────
  if (company.universityConnected) {
    badges.push({
      id: "university-connected",
      ...BADGE_DEFINITIONS["university-connected"]!,
    });
  }

  // ── Founder Claimed ─────────────────────────────────────────────
  if (company.claimedByFounder) {
    badges.push({
      id: "founder-claimed",
      ...BADGE_DEFINITIONS["founder-claimed"]!,
    });
  }

  // ── New This Week ───────────────────────────────────────────────
  if (company.lastUpdated) {
    const updatedMs = new Date(company.lastUpdated).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now - updatedMs < sevenDaysMs) {
      badges.push({
        id: "new-this-week",
        ...BADGE_DEFINITIONS["new-this-week"]!,
      });
    }
  }

  // ── Fast Growing ────────────────────────────────────────────────
  // Series A+ with 11-200 employees is a proxy for fast growth
  const growthStages = new Set(["Series A", "Series B", "Series C", "Growth"]);
  const growthSizes = new Set(["11-50", "51-200"]);
  if (growthStages.has(company.stage) && growthSizes.has(company.employees)) {
    badges.push({ id: "fast-growing", ...BADGE_DEFINITIONS["fast-growing"]! });
  }

  // Deduplicate (student-friendly and university-connected can overlap)
  const seen = new Set<string>();
  return badges.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

/** Quick helper: does this company have a specific badge? */
export function hasBadge(company: Company, badgeId: string): boolean {
  return computeBadges(company).some((b) => b.id === badgeId);
}
