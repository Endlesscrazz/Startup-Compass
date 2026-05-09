import type { Company } from "@/lib/map-config";
import type { AtlasResource } from "@/lib/atlas-data";
import type { MatchResultItem } from "@/app/api/match/route";

export type DigestRole = "founder" | "investor" | "student" | "job_seeker";

export interface WeeklyDigestSection {
  id: string;
  title: string;
  bullets: string[];
}

export interface WeeklyDigest {
  generatedAt: string;
  role: DigestRole;
  sections: WeeklyDigestSection[];
}

/** Builds a preview-friendly digest from real in-app data (no email send). */
export function buildWeeklyDigestPreview(input: {
  role: DigestRole;
  companies: Company[];
  resources?: AtlasResource[];
  savedMatches?: MatchResultItem[];
}): WeeklyDigest {
  const { role, companies, resources = [], savedMatches = [] } = input;
  const hiring = companies.filter((c) => c.hiringStatus === "hiring").length;
  const recent = companies.filter((c) => {
    if (!c.lastUpdated) return false;
    const d = (Date.now() - new Date(c.lastUpdated).getTime()) / 86400000;
    return d <= 30;
  }).length;

  const sectors: Record<string, number> = {};
  for (const c of companies) {
    sectors[c.sector] = (sectors[c.sector] ?? 0) + 1;
  }
  const topSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0];

  const sections: WeeklyDigestSection[] = [];

  sections.push({
    id: "ecosystem",
    title: "Ecosystem snapshot",
    bullets: [
      `${companies.length} companies in the Utah startup map dataset.`,
      hiring > 0
        ? `${hiring} companies show an active hiring signal.`
        : "Hiring signals are sparse this week — verify on company sites.",
      recent > 0
        ? `${recent} company profiles were touched in the last 30 days.`
        : "Few recent profile updates — treat map data as a starting point.",
      topSector
        ? `Largest sector cluster: ${topSector[0]} (${topSector[1]} companies).`
        : "Sector breakdown unavailable.",
    ],
  });

  if (savedMatches.length > 0) {
    sections.push({
      id: "matches",
      title: "Resources worth another look",
      bullets: savedMatches.slice(0, 5).map((r) => r.title),
    });
  } else if (resources.length > 0) {
    const statewide = resources.filter((r) => r.locations.length >= 25).slice(0, 3);
    if (statewide.length > 0) {
      sections.push({
        id: "resources",
        title: "Statewide programs to bookmark",
        bullets: statewide.map((r) => r.title),
      });
    }
  }

  if (role === "investor") {
    sections.push({
      id: "investor",
      title: "For your pipeline",
      bullets: [
        "Review hiring and stage changes on watchlisted companies in Pulse.",
        "Cross-check funding fields against primary sources before outreach.",
      ],
    });
  } else if (role === "founder") {
    sections.push({
      id: "founder",
      title: "For founders",
      bullets: [
        "Run the resource navigator with your county for eligibility-aware matches.",
        "Pair grants and programs with the map to find local peer companies.",
      ],
    });
  } else if (role === "student" || role === "job_seeker") {
    sections.push({
      id: "talent",
      title: "For talent",
      bullets: [
        hiring > 0
          ? "Filter the map for hiring signals and university-connected startups."
          : "Use company websites for the freshest role postings.",
      ],
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    role,
    sections,
  };
}
