"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Company } from "@/lib/map-config";
import { COMPANIES } from "@/lib/map-config";
import { computeBadges } from "@/lib/map/opportunityBadges";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";

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

  const feedItems = buildFeedItems(changes);

  return (
    <div className="rounded-2xl border border-rule bg-surface-elev p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent">
            Ecosystem Pulse
          </p>
          <h2 className="mt-1 font-display text-[18px] font-semibold text-ink">
            What's happening in Utah
          </h2>
        </div>
        <Link
          href="/pulse"
          className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:border-accent hover:text-ink"
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
            </div>
            {item.href && (
              <Link
                href={item.href}
                className="ml-auto shrink-0 text-[11px] font-semibold text-accent hover:text-accent-hover"
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
  href?: string;
}

function buildFeedItems(c: ChangeSummary): FeedItem[] {
  const items: FeedItem[] = [];

  if (c.hiringCount > 0) {
    items.push({
      emoji: "⚙️",
      headline: `${c.hiringCount} companies are actively hiring`,
      sub: "Based on company descriptions and hiring signals",
      href: "/search",
    });
  }

  if (c.newThisWeek > 0) {
    items.push({
      emoji: "✨",
      headline: `${c.newThisWeek} companies updated this week`,
      sub: "New profiles and recently refreshed data",
      href: "/search",
    });
  } else if (c.newThisMonth > 0) {
    items.push({
      emoji: "📅",
      headline: `${c.newThisMonth} companies updated this month`,
      href: "/search",
    });
  }

  if (c.clusterGrowth.length > 0) {
    const top = c.clusterGrowth[0]!;
    items.push({
      emoji: "🏔️",
      headline: `${top.sector} is Utah's largest startup cluster`,
      sub: `${top.count} companies · growing fast`,
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
      href: "/search",
    });
  }

  // Ensure we always have at least 3 items
  if (items.length < 3) {
    items.push({
      emoji: "🗺️",
      headline: `Explore ${Object.values(c.sectorCounts).reduce((a, b) => a + b, 0)} Utah startups on the map`,
      href: "/search",
    });
  }

  return items.slice(0, 5);
}
