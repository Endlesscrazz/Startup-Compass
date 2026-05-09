import { COMPANIES } from "@/lib/map-config";
import type { FounderPersona, SavedSearch } from "@/lib/agents/types";

export const BUILTIN_AGENT_NAMES = [
  "sticky-match",
  "investor-radar",
  "founder-growth",
  "job-hunter",
  "investor-campaign",
  "talent-attraction",
  "data-quality",
  "company-watch",
  "digest",
] as const;

export const DEFAULT_PERSONAS: FounderPersona[] = [
  {
    id: "jordan",
    name: "Jordan",
    stage: "Idea",
    location: "Salt Lake City",
    profile:
      "First-time founder with a mobile app idea, no co-founder yet. Needs early validation, a technical co-founder, and community support. Studying at the University of Utah.",
  },
  {
    id: "maria",
    name: "Maria",
    stage: "Early",
    location: "Box Elder County",
    profile:
      "Rural woman-owned AgTech founder in northern Utah with 5 employees. Selling direct-to-restaurant produce and building a traceability platform. Needs grants, not dilutive capital.",
  },
  {
    id: "marcus",
    name: "Marcus",
    stage: "Early",
    location: "Weber County",
    profile:
      "Veteran founder (US Army) building advanced manufacturing equipment in Ogden. Has a working prototype and 2 LOIs from defense contractors. Seeking SBIR and strategic manufacturing partners.",
  },
  {
    id: "priya",
    name: "Priya",
    stage: "Seed",
    location: "Salt Lake County",
    profile:
      "B2B SaaS founder with 18 employees and $420k ARR. Building an HR workflow automation tool. Has $600k angel round closed. Preparing a Series A raise of $4M.",
  },
  {
    id: "david",
    name: "David",
    stage: "Series B",
    location: "Utah County",
    profile:
      "Medical device CEO with 35 employees, FDA 510(k) cleared device, $8M Series B raised. Planning international expansion to EU (CE Mark) and Japan (PMDA) within 18 months.",
  },
  {
    id: "dr-amir",
    name: "Dr. Amir",
    stage: "Pre-company",
    location: "Salt Lake City",
    profile:
      "University of Utah PhD candidate in biotech with a novel drug delivery platform. Has provisional patent, published research, and a USTAR grant. No company formed yet. Needs licensing, commercialization, and spinout guidance.",
  },
];

/** Saved searches use actual sector names from the companies dataset */
export const DEMO_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: "search-b2b-seed",
    userId: "demo-user",
    name: "B2B Software companies — Seed & Series A",
    audienceType: "investor",
    criteria: { sector: "B2B Software", stage: ["Seed", "Series A"] },
    frequency: "daily",
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "search-biomedical",
    userId: "demo-user",
    name: "Bio/Medical Tech startups, 11–50 employees",
    audienceType: "operator",
    criteria: { sector: "Bio/Medical Tech", employeeRange: "11-50" },
    frequency: "weekly",
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "search-fintech-security",
    userId: "demo-user",
    name: "FinTech & Security companies raising",
    audienceType: "investor",
    criteria: {
      sectors: ["FinTech", "Security"],
      stage: ["Series A", "Series B", "Series C"],
    },
    frequency: "daily",
    enabled: true,
    createdAt: new Date().toISOString(),
  },
];

/** Deterministic demo "company change events" drawn from real company data */
export const DEMO_COMPANY_EVENTS = [
  {
    companyId: "adminify-ai",
    companyName: "Adminify AI",
    eventType: "hiring_signal_detected",
    change: "Now showing active hiring signals in job descriptions",
    whyMatters: "Early-stage B2B Software teams in Lehi with 11–50 employees are expanding their engineering bench — strong growth signal.",
    whoCares: "Job seekers, investors tracking product-market-fit signals",
    action: "Add to talent watchlist and create investor brief",
    sector: "B2B Software",
    stage: "Bootstrapped",
    city: "S Lehi",
    priority: "high" as const,
  },
  {
    companyId: "3helix",
    companyName: "3Helix",
    eventType: "profile_completeness_improved",
    change: "Profile updated with new LinkedIn and description detail",
    whyMatters: "Bio/Medical Tech seed-stage company updated public presence — may be preparing for fundraise.",
    whoCares: "Healthcare investors, SBIR program managers",
    action: "Generate investor brief, watch for funding announcement",
    sector: "Bio/Medical Tech",
    stage: "Seed",
    city: "Salt Lake City",
    priority: "medium" as const,
  },
  {
    companyId: "alianza",
    companyName: "Alianza",
    eventType: "stage_signal",
    change: "Series D+ company showing late-stage growth signals",
    whyMatters: "Alianza is one of Utah's few Series D+ B2B Software companies. Scale-stage hiring often precedes IPO prep.",
    whoCares: "Growth investors, executive talent, acquirers",
    action: "Monitor for IPO/acquisition signals, flag for strategic investor list",
    sector: "B2B Software",
    stage: "Series D+",
    city: "Lehi",
    priority: "high" as const,
  },
  {
    companyId: "canopy",
    companyName: "Canopy",
    eventType: "investor_relevant",
    change: "Canopy Tax entered FinTech top-10 completeness list",
    whyMatters: "Strong profile, FinTech sector, 51–200 employees — well-positioned for institutional interest.",
    whoCares: "FinTech investors, strategic partners",
    action: "Add to investor radar, create outreach draft",
    sector: "FinTech",
    stage: "Series B",
    city: "Lehi",
    priority: "medium" as const,
  },
  {
    companyId: "recursion",
    companyName: "Recursion Pharmaceuticals",
    eventType: "sector_leader",
    change: "Utah's highest-profile Bio/Medical Tech company updated ecosystem presence",
    whyMatters: "Recursion is a benchmark company for Utah biotech credibility — signals draw national investor attention.",
    whoCares: "Biotech investors, academic spinout founders, state economic development",
    action: "Feature in weekly digest, reference in investor campaign",
    sector: "Bio/Medical Tech",
    stage: "Series D+",
    city: "Salt Lake City",
    priority: "high" as const,
  },
];

export const DEMO_INVESTOR_PROSPECTS = [
  { name: "Wasatch Angels", type: "angel", focus: "B2B Software, FinTech" },
  { name: "Peak Ventures", type: "seed VC", focus: "B2B SaaS" },
  { name: "Album VC", type: "seed VC", focus: "Consumer, B2B Software" },
  { name: "Kickstart Seed Fund", type: "seed VC", focus: "B2B Software, FinTech" },
  { name: "Peterson Ventures", type: "multi-stage VC", focus: "B2B Software, Consumer" },
  { name: "Signal Peak Ventures", type: "seed VC", focus: "B2B Software" },
  { name: "BioHive", type: "strategic", focus: "Bio/Medical Tech" },
  { name: "Prelude Ventures", type: "growth VC", focus: "Energy, CleanTech" },
  { name: "Pelion Venture Partners", type: "seed VC", focus: "B2B Software, Security" },
  { name: "Mercato Partners", type: "growth VC", focus: "B2B Software" },
];

export const DEMO_TALENT_GAPS = [
  { sector: "B2B Software", role: "Senior Software Engineers", gap: 340, sources: "SF, Seattle, Austin, NYC" },
  { sector: "Bio/Medical Tech", role: "Regulatory Affairs Specialists", gap: 95, sources: "Boston, San Diego, NYC" },
  { sector: "FinTech", role: "Product Managers", gap: 120, sources: "NYC, Chicago, Austin" },
  { sector: "Security", role: "Security Engineers", gap: 80, sources: "DC, Austin, SF" },
  { sector: "Consumer", role: "Growth Marketers", gap: 60, sources: "LA, NYC, Austin" },
];

/** Returns a stable slice of companies for demo agents */
export function getDemoCompanies() {
  return COMPANIES;
}

/** Returns only B2B Software companies for SaaS-focused agents */
export function getB2BSoftwareCompanies() {
  return COMPANIES.filter((c) => c.sector === "B2B Software");
}

/** Returns Bio/Med companies */
export function getBioMedCompanies() {
  return COMPANIES.filter((c) => c.sector === "Bio/Medical Tech");
}
