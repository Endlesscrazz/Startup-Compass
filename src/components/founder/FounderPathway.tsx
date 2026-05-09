"use client";

import type { PathwayStep } from "@/lib/founder/types";

export function FounderPathway({ steps }: { steps: PathwayStep[] }) {
  return (
    <div className="founder-pathway rounded-[14px] border border-rule bg-surface-elev p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
        Your pathway
      </p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:gap-3">
        {steps.map((s) => (
          <div
            key={s.key}
            className={`min-w-[130px] flex-1 rounded-xl border px-3 py-3 transition-colors ${
              s.active
                ? "border-accent bg-accent-soft/40"
                : "border-rule bg-surface"
            }`}
          >
            <p className="font-display text-[14px] font-semibold text-ink">
              {s.label}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-ink-mute">
              {s.description}
            </p>
            <p className="mt-2 text-[11px] font-medium text-accent">
              {s.matchingResourceCount} matches
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
