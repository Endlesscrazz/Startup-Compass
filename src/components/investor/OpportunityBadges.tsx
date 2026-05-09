"use client";

import type { Company } from "@/lib/map-config";
import { computeBadges } from "@/lib/map/opportunityBadges";

type Props = {
  company: Company;
  maxBadges?: number;
  className?: string;
};

/**
 * Renders opportunity badge pills for a company.
 * Shows up to `maxBadges` badges (default 4) to keep popups compact.
 */
export function OpportunityBadges({
  company,
  maxBadges = 4,
  className = "",
}: Props) {
  const badges = computeBadges(company).slice(0, maxBadges);
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`} aria-label="Company opportunities">
      {badges.map((badge) => (
        <span
          key={badge.id}
          title={badge.description}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] ${badge.color}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Full badge list — for detail panels where space is less constrained.
 */
export function OpportunityBadgesFull({ company }: { company: Company }) {
  return <OpportunityBadges company={company} maxBadges={8} />;
}
