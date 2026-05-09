"use client";

import type { Company } from "@/lib/map-config";
import { computeProfileCompleteness } from "@/lib/investor/profileCompleteness";

export function ProfileCompletenessCard({ company }: { company: Company }) {
  const { score, missingFields } = computeProfileCompleteness(company);
  return (
    <div className="profile-complete-card mt-3 rounded-lg border border-rule/80 bg-surface-tint/40 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
        Investor readiness
      </p>
      <p className="mt-1 font-display text-[20px] font-semibold text-ink">
        {score}%
      </p>
      {missingFields.length > 0 && (
        <p className="mt-1 text-[11px] leading-snug text-ink-mute">
          Add: {missingFields.slice(0, 4).join(", ")}
          {missingFields.length > 4 ? "…" : ""}
        </p>
      )}
    </div>
  );
}
