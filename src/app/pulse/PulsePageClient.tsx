"use client";

import Link from "next/link";
import { COMPANIES } from "@/lib/map-config";
import { getSectorColor } from "@/lib/map-config";
import { AtlasHeader } from "@/components/AtlasPages";
import { EcosystemChangeFeed } from "@/components/EcosystemChangeFeed";
import { DigestSignupCard } from "@/components/DigestSignupCard";
import { computeBadges } from "@/lib/map/opportunityBadges";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import type { UserRole } from "@/hooks/useUserRole";

// ── Derived data ────────────────────────────────────────────
const hiringCompanies = COMPANIES.filter(
  (c) =>
    c.hiringStatus === "hiring" || inferHiringFromDescription(c.description),
).slice(0, 12);

const earlyStageCompanies = COMPANIES.filter((c) =>
  ["Pre-Seed", "Seed", "Bootstrapped"].includes(c.stage),
).slice(0, 12);

const sectorCounts = (() => {
  const map: Record<string, number> = {};
  for (const c of COMPANIES) {
    map[c.sector] = (map[c.sector] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
})();

const stageCounts = (() => {
  const map: Record<string, number> = {};
  for (const c of COMPANIES) {
    map[c.stage] = (map[c.stage] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);
})();

export function PulsePageClient() {
  const handleSubscribe = (email: string, role: UserRole | null) => {
    // For now, just log — will connect to email API in Phase 2
    console.info("Digest subscription:", { email, role });
  };

  return (
    <div className="atlas-page atlas-page-light min-h-screen">
      {/* Header */}
      <AtlasHeader />

      <main className="w-full max-w-[1100px] mx-auto px-5 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Weekly Intelligence
          </p>
          <h1 className="mt-2 font-display text-[clamp(32px,5vw,52px)] font-bold leading-tight text-gold">
            Utah Startup Pulse
          </h1>
          <p className="mt-3 mx-auto max-w-[560px] text-[16px] leading-relaxed text-ink">
            Live signals from Utah's startup ecosystem. Hiring companies, sector trends,
            funding activity, and resources — all in one place.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="atlas-btn atlas-btn-primary"
              style={{ minWidth: 160 }}
            >
              Open live map
            </Link>
            <Link
              href="/navigator"
              className="atlas-btn atlas-btn-ghost"
              style={{ minWidth: 160 }}
            >
              Find resources
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Companies", value: COMPANIES.length.toString() },
            { label: "Actively Hiring", value: hiringCompanies.length.toString() },
            { label: "Early Stage", value: earlyStageCompanies.length.toString() },
            { label: "Sectors", value: sectorCounts.length.toString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border-2 border-gold bg-surface-elev px-4 py-3 text-center shadow-sm"
            >
              <p className="font-display text-[28px] font-bold text-ink">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-mute">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left col: 2/3 width */}
          <div className="space-y-8 lg:col-span-2">
            {/* Change Feed */}
            <EcosystemChangeFeed />

            {/* Hiring Now */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-[20px] font-semibold text-gold">
                  Hiring Now
                </h2>
                <Link
                  href="/search"
                  className="text-[12px] font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                >
                  View all on map →
                </Link>
              </div>
              {hiringCompanies.length === 0 ? (
                <p className="text-[13px] text-ink-mute">
                  No explicit hiring signals detected. Companies may be hiring — check their websites.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {hiringCompanies.map((c) => {
                    const color = getSectorColor(c.sector);
                    const badges = computeBadges(c).slice(0, 2);
                    return (
                      <Link
                        key={c.id}
                        href={`/search?company=${c.id}`}
                        className="group flex items-start gap-3 rounded-xl border border-rule bg-surface-elev p-3 hover:border-gold hover:shadow-md transition-all"
                      >
                        <span
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink group-hover:underline">
                            {c.name}
                          </p>
                          <p className="truncate text-[11px] text-ink-mute">
                            {c.city} · {c.stage} · {c.employees}
                          </p>
                          {badges.length > 0 && (
                            <div className="mt-1 flex gap-1">
                              {badges.map((b) => (
                                <span
                                  key={b.id}
                                  className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${b.color}`}
                                >
                                  {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sector Breakdown */}
            <section>
              <h2 className="mb-4 font-display text-[20px] font-semibold text-gold">
                Sector Breakdown
              </h2>
              <div className="space-y-2">
                {sectorCounts.slice(0, 10).map(({ sector, count }) => {
                  const color = getSectorColor(sector);
                  const pct = Math.round((count / COMPANIES.length) * 100);
                  return (
                    <div key={sector} className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="w-[160px] shrink-0 text-[12.5px] font-medium text-ink truncate">
                        {sector}
                      </span>
                      <div className="flex-1 rounded-full bg-surface-tint h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[11.5px] text-ink-mute">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Stage Distribution */}
            <section>
              <h2 className="mb-4 font-display text-[20px] font-semibold text-gold">
                Stage Distribution
              </h2>
              <div className="flex flex-wrap gap-2">
                {stageCounts.map(({ stage, count }) => (
                  <Link
                    key={stage}
                    href={`/search`}
                    className="flex items-center gap-2 rounded-xl border border-rule bg-surface-elev px-3 py-2 hover:border-gold transition-colors"
                  >
                    <span className="text-[14px] font-bold text-ink">{count}</span>
                    <span className="text-[11px] text-ink-mute">{stage}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Right col: 1/3 width */}
          <div className="space-y-6">
            <DigestSignupCard onSubscribe={handleSubscribe} />

            {/* Quick Links */}
            <div className="rounded-2xl border border-rule bg-surface-elev p-5 shadow-sm">
              <h3 className="font-display text-[15px] font-semibold text-ink mb-3">
                Quick Filters
              </h3>
              <div className="space-y-2">
                {[
                  { label: "🔥 Early-stage startups", href: "/search", desc: "Pre-Seed and Seed" },
                  { label: "⚙️ Companies hiring", href: "/search", desc: "Active job openings" },
                  { label: "🎓 University connected", href: "/search", desc: "U of U, BYU, USU" },
                  { label: "🏔️ Top AI companies", href: "/search", desc: "AI & ML sector" },
                  { label: "💊 Life sciences", href: "/search", desc: "Biotech & healthtech" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg p-2 hover:bg-surface-tint/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-ink">{item.label}</p>
                      <p className="text-[11px] text-ink-mute">{item.desc}</p>
                    </div>
                    <span className="ml-auto text-[11px] text-ink">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* For Founders */}
            <div className="rounded-2xl border border-rule bg-surface-elev p-5 shadow-sm">
              <h3 className="font-display text-[15px] font-semibold text-ink mb-1">
                Founder?
              </h3>
              <p className="text-[12px] text-ink-mute mb-3">
                Find grants, investors, and programs matched to your stage.
              </p>
              <Link
                href="/navigator"
                className="block w-full rounded-full border-2 border-gold bg-utah-blue py-2.5 text-center text-[13px] font-medium text-white hover:bg-utah-blue-hover"
              >
                Find resources →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
