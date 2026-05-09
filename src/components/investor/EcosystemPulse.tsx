"use client";

import type { EcosystemStats } from "@/lib/investor/ecosystemStats";

export function EcosystemPulse({ stats }: { stats: EcosystemStats }) {
  return (
    <div className="ecosystem-pulse rounded-xl border-0 bg-transparent px-3 py-2 md:px-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            Companies
          </p>
          <p className="font-display text-xl font-semibold text-ink">
            {stats.totalCompanies.toLocaleString()}
          </p>
        </div>
        <div className="hidden h-8 w-px bg-rule md:block" aria-hidden />
        <div className="min-w-[140px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            Top sectors
          </p>
          <ul className="mt-1 space-y-0.5 text-[12px] text-ink-soft">
            {stats.topSectors.map((s) => (
              <li key={s.label}>
                {s.label}{" "}
                <span className="text-ink-mute">({s.count})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-[140px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            Top cities
          </p>
          <ul className="mt-1 space-y-0.5 text-[12px] text-ink-soft">
            {stats.topCities.map((s) => (
              <li key={s.label}>
                {s.label}{" "}
                <span className="text-ink-mute">({s.count})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            Hiring signals
          </p>
          <p className="text-[13px] text-ink-soft">
            ~{stats.hiringLikelyCount} mention hiring in description
          </p>
        </div>
      </div>
    </div>
  );
}
