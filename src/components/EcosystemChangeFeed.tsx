"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Company } from "@/lib/map-config";
import { COMPANIES } from "@/lib/map-config";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import { useInvestorWatchlist } from "@/hooks/useInvestorWatchlist";
import { freshnessFromIso, freshnessLabel } from "@/lib/pulse/freshness";

interface ChangeSummary {
  hiringCount: number;
  newThisWeek: number;
  newThisMonth: number;
  stageCounts: Record<string, number>;
  sectorCounts: Record<string, number>;
  topHiringCompanies: Company[];
  topNewCompanies: Company[];
  clusterGrowth: { sector: string; count: number }[];
}

function computeChanges(companies: Company[]): ChangeSummary {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const hiringCompanies = companies.filter(
    (c) =>
      c.hiringStatus === "hiring" || inferHiringFromDescription(c.description),
  );

  const newThisWeek = companies.filter((c) => {
    if (!c.lastUpdated) return false;
    return now - new Date(c.lastUpdated).getTime() < sevenDays;
  });

  const newThisMonth = companies.filter((c) => {
    if (!c.lastUpdated) return false;
    return now - new Date(c.lastUpdated).getTime() < thirtyDays;
  });

  const stageCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};
  for (const c of companies) {
    stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1;
    sectorCounts[c.sector] = (sectorCounts[c.sector] ?? 0) + 1;
  }

  // Top clusters by company count
  const clusterGrowth = Object.entries(sectorCounts)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    hiringCount: hiringCompanies.length,
    newThisWeek: newThisWeek.length,
    newThisMonth: newThisMonth.length,
    stageCounts,
    sectorCounts,
    topHiringCompanies: hiringCompanies.slice(0, 6),
    topNewCompanies: newThisWeek.slice(0, 6),
    clusterGrowth,
  };
}

export function EcosystemChangeFeed() {
  const changes = useMemo(() => computeChanges(COMPANIES), []);
  const staleCount = useMemo(
    () =>
      COMPANIES.filter((c) => freshnessFromIso(c.lastUpdated) === "stale").length,
    [],
  );
  const wl = useInvestorWatchlist();
  /* eslint-disable react-hooks/exhaustive-deps -- watchlist meta/ids listed explicitly */
  const watchlistPulse = useMemo(() => {
    if (!wl.hydrated || wl.ids.length === 0) return [] as FeedItem[];
    const watched = wl.resolveCompanies(COMPANIES);
    const out: FeedItem[] = [];
    for (const company of watched.slice(0, 4)) {
      const deltas = wl.getChanges(company);
      if (deltas.length === 0) continue;
      const top = deltas[0]!;
      out.push({
        emoji: "👀",
        headline: `Watchlist: ${company.name} · ${top.field} changed`,
        sub: `${top.from} → ${top.to}`,
        whyItMatters:
          "Saved companies with deltas surface momentum you asked to track — cross-check before acting.",
        href: `/search?company=${encodeURIComponent(company.id)}`,
        freshness: freshnessLabel(freshnessFromIso(company.lastUpdated)),
      });
    }
    return out;
  }, [wl.hydrated, wl.ids, wl.meta, wl.resolveCompanies, wl.getChanges]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const feedItems = [...watchlistPulse, ...buildFeedItems(changes, staleCount)];

  return (
    <div className="rounded-2xl border border-rule bg-surface-elev p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
            Ecosystem Pulse
          </p>
          <h2 className="mt-1 font-display text-[18px] font-semibold text-ink">
            What&apos;s happening in Utah
          </h2>
        </div>
        <Link
          href="/pulse"
          className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-[11px] font-medium text-ink hover:border-rule-strong hover:text-ink"
        >
          Full pulse →
        </Link>
      </div>

      <ul className="mt-4 space-y-2">
        {feedItems.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border border-rule/70 bg-surface px-3 py-2.5"
          >
            <span className="mt-0.5 text-[18px] leading-none" aria-hidden="true">
              {item.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{item.headline}</p>
              {item.sub && (
                <p className="mt-0.5 text-[11.5px] text-ink-mute">{item.sub}</p>
              )}
              {item.whyItMatters && (
                <p className="mt-1 text-[11px] leading-snug text-ink-soft">
                  <span className="font-semibold text-ink-mute">Why it matters: </span>
                  {item.whyItMatters}
                </p>
              )}
              {item.freshness && (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-mute">
                  {item.freshness}
                </p>
              )}
            </div>
            {item.href && (
              <Link
                href={item.href}
                className="ml-auto shrink-0 text-[11px] font-semibold text-ink underline decoration-ink/35 underline-offset-2 hover:decoration-ink"
              >
                Explore →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FeedItem {
  emoji: string;
  headline: string;
  sub?: string;
  whyItMatters?: string;
  href?: string;
  freshness?: string;
}

function buildFeedItems(c: ChangeSummary, staleCount: number): FeedItem[] {
  const items: FeedItem[] = [];

  if (c.hiringCount > 0) {
    items.push({
      emoji: "⚙️",
      headline: `${c.hiringCount} companies are actively hiring`,
      sub: "Based on company descriptions and hiring signals",
      whyItMatters:
        "Hiring signals help you prioritize who may be scaling — verify on the company site before outreach.",
      href: "/search",
    });
  }

  if (c.newThisWeek > 0) {
    items.push({
      emoji: "✨",
      headline: `${c.newThisWeek} companies updated this week`,
      sub: "New profiles and recently refreshed data",
      whyItMatters: "Recent updates suggest fresher contact context than stale listings.",
      href: "/search",
    });
  } else if (c.newThisMonth > 0) {
    items.push({
      emoji: "📅",
      headline: `${c.newThisMonth} companies updated this month`,
      whyItMatters: "Monthly activity shows parts of the dataset are still maintained.",
      href: "/search",
    });
  }

  if (staleCount > 0) {
    items.push({
      emoji: "⏳",
      headline: `${staleCount} profiles may be stale (90+ days without update)`,
      sub: freshnessLabel("stale"),
      whyItMatters:
        "Treat these as starting points — confirm stage, hiring, and links on the primary source.",
      href: "/search",
      freshness: "stale",
    });
  }

  if (c.clusterGrowth.length > 0) {
    const top = c.clusterGrowth[0]!;
    items.push({
      emoji: "🏔️",
      headline: `${top.sector} is Utah's largest startup cluster`,
      sub: `${top.count} companies · growing fast`,
      whyItMatters: "Sector density hints where talent, vendors, and customers cluster regionally.",
      href: "/search",
    });
  }

  // Early-stage count
  const earlyCount =
    (c.stageCounts["Pre-Seed"] ?? 0) +
    (c.stageCounts["Seed"] ?? 0) +
    (c.stageCounts["Bootstrapped"] ?? 0);
  if (earlyCount > 0) {
    items.push({
      emoji: "🌱",
      headline: `${earlyCount} early-stage companies on the map`,
      sub: "Pre-Seed, Seed, and Bootstrapped",
      whyItMatters: "Early-stage density matters for peer founders, accelerators, and pre-seed investors.",
      href: "/search",
    });
  }

  // Growth stage
  const growthCount =
    (c.stageCounts["Series A"] ?? 0) +
    (c.stageCounts["Series B"] ?? 0) +
    (c.stageCounts["Series C"] ?? 0) +
    (c.stageCounts["Growth"] ?? 0);
  if (growthCount > 0) {
    items.push({
      emoji: "📈",
      headline: `${growthCount} growth-stage companies scaling in Utah`,
      sub: "Series A through Growth",
      whyItMatters: "Growth-stage companies often drive hiring velocity and partner demand.",
      href: "/search",
    });
  }

  // Ensure we always have at least 3 items
  if (items.length < 3) {
    items.push({
      emoji: "🗺️",
      headline: `Explore ${Object.values(c.sectorCounts).reduce((a, b) => a + b, 0)} Utah startups on the map`,
      whyItMatters: "The map stays the source of truth for location, sector, and stage filters.",
      href: "/search",
    });
  }

  return items.slice(0, 6);
}
