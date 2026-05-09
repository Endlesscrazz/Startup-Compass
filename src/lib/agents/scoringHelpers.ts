/**
 * Shared scoring/matching utilities for all agents.
 * Uses actual company data fields — no fabricated data.
 */
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import { computeProfileCompleteness } from "@/lib/investor/profileCompleteness";
import type { Company } from "@/lib/map-config";

// ─── Employee count helpers ──────────────────────────────────────────────────

export function employeeRangeMidpoint(range: string): number {
  if (!range) return 0;
  const clean = range.replace(/,/g, "").replace(/K/gi, "000");
  if (clean.includes("-")) {
    const parts = clean.split("-");
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    if (!isNaN(a) && !isNaN(b)) return Math.round((a + b) / 2);
  }
  const m = clean.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export function employeeRangeOverlaps(companyRange: string, targetRange: string): boolean {
  const cMid = employeeRangeMidpoint(companyRange);
  const tMid = employeeRangeMidpoint(targetRange);
  if (!cMid || !tMid) return false;
  return Math.abs(Math.log2(cMid) - Math.log2(tMid)) <= 1.5;
}

// ─── Sector matching ─────────────────────────────────────────────────────────

export function sectorMatches(companySector: string, searchSector: string): boolean {
  if (!searchSector) return true;
  return companySector.toLowerCase().includes(searchSector.toLowerCase()) ||
    searchSector.toLowerCase().includes(companySector.toLowerCase());
}

export function sectorMatchScore(companySector: string, searchSector: string | string[]): number {
  const targets = Array.isArray(searchSector) ? searchSector : [searchSector];
  for (const t of targets) {
    if (sectorMatches(companySector, t)) return 40;
  }
  return 0;
}

// ─── Stage matching ──────────────────────────────────────────────────────────

export function stageMatchScore(companyStage: string, targetStages: string | string[]): number {
  const targets = Array.isArray(targetStages) ? targetStages : [targetStages];
  if (targets.length === 0) return 15;
  return targets.some((t) => t.toLowerCase() === companyStage.toLowerCase()) ? 30 : 0;
}

// ─── Hiring signals ──────────────────────────────────────────────────────────

export function getHiringSignalScore(company: Company): number {
  if (company.hiringStatus === "hiring") return 25;
  if (inferHiringFromDescription(company.description)) return 15;
  if (company.hiringStatus === "not-hiring") return 0;
  // Default signal based on stage and employee count
  const mid = employeeRangeMidpoint(company.employees);
  if (["Series A", "Series B", "Series C", "Series D+"].includes(company.stage) && mid >= 11) return 8;
  return 3;
}

export function getHiringLabel(company: Company): string {
  if (company.hiringStatus === "hiring") return "Active hiring";
  if (inferHiringFromDescription(company.description)) return "Hiring signal (from description)";
  if (company.hiringStatus === "not-hiring") return "Not currently hiring";
  return "Hiring status unknown";
}

// ─── Sector hotness for investor radar ──────────────────────────────────────

export function sectorHotnessScore(sector: string): number {
  if (sector === "B2B Software") return 10;
  if (sector === "Bio/Medical Tech") return 9;
  if (sector === "FinTech") return 8;
  if (sector === "Security") return 8;
  if (sector === "Consumer") return 6;
  if (sector === "Energy") return 7;
  if (sector === "Marketplaces") return 6;
  return 5;
}

// ─── Stage investment score ──────────────────────────────────────────────────

export function stageInvestorScore(stage: string): number {
  if (stage === "Series A") return 10;
  if (stage === "Seed") return 9;
  if (stage === "Series B") return 8;
  if (stage === "Pre-Seed") return 7;
  if (stage === "Series C") return 7;
  if (stage === "Series D+") return 6;
  if (stage === "Bootstrapped") return 5;
  return 3;
}

// ─── Investor radar scoring ──────────────────────────────────────────────────

export type InvestorScore = {
  total: number;
  breakdown: Record<string, number>;
  label: "Investor Ready" | "Strong Signal" | "Watch List" | "Early Stage";
  whyNow: string[];
  missingData: string[];
};

export function scoreCompanyForInvestor(company: Company): InvestorScore {
  const completeness = computeProfileCompleteness(company);
  const descLen = company.description?.length ?? 0;
  const hiringSignal = getHiringSignalScore(company);
  const mid = employeeRangeMidpoint(company.employees);

  const breakdown = {
    descriptionQuality: Math.min(15, Math.round((descLen / 200) * 15)),
    stage: stageInvestorScore(company.stage),
    sector: sectorHotnessScore(company.sector),
    hiringSignal: Math.min(10, hiringSignal),
    profileCompleteness: Math.round((completeness.score / 100) * 20),
    hasWebsite: company.website ? 5 : 0,
    hasLinkedin: company.linkedin ? 5 : 0,
    hasAddress: company.address ? 5 : 0,
    employeeSignal: mid >= 51 ? 10 : mid >= 11 ? 7 : mid >= 2 ? 4 : 0,
    claimedProfile: company.claimedByFounder ? 10 : 0,
  };

  const total = Math.min(100, Object.values(breakdown).reduce((s, v) => s + v, 0));

  const whyNow: string[] = [];
  if (hiringSignal >= 15) whyNow.push("Actively hiring — expanding team");
  if (["Series A", "Series B"].includes(company.stage)) whyNow.push(`${company.stage} — prime institutional investment window`);
  if (descLen > 200) whyNow.push("Strong public narrative and domain clarity");
  if (company.universityConnected) whyNow.push("University-connected — research-to-market pipeline");
  if (whyNow.length === 0) whyNow.push("Growing Utah ecosystem company with verified presence");

  const missingData: string[] = [];
  if (!company.claimedByFounder) missingData.push("Unverified profile");
  if (!company.logo) missingData.push("No logo");
  if (!company.yearFounded) missingData.push("Founding year unknown");
  if (hiringSignal < 5) missingData.push("No clear hiring signal");

  const label: InvestorScore["label"] =
    total >= 75 ? "Investor Ready" :
    total >= 60 ? "Strong Signal" :
    total >= 45 ? "Watch List" : "Early Stage";

  return { total, breakdown, label, whyNow, missingData };
}

// ─── Data quality scoring ────────────────────────────────────────────────────

export type QualityScore = {
  total: number;
  label: string;
  strongFields: string[];
  missingFields: string[];
  staleFields: string[];
  topRecommendation: string;
};

const QUALITY_CHECKS: { id: string; label: string; points: number; test: (c: Company) => boolean }[] = [
  { id: "name", label: "Company name", points: 5, test: (c) => Boolean(c.name?.trim()) },
  { id: "website", label: "Website", points: 10, test: (c) => Boolean(c.website?.trim()) },
  { id: "description", label: "Description (100+ chars)", points: 15, test: (c) => (c.description?.length ?? 0) >= 100 },
  { id: "employees", label: "Team size", points: 10, test: (c) => Boolean(c.employees) && c.employees !== "Unknown" },
  { id: "sector", label: "Sector", points: 5, test: (c) => Boolean(c.sector?.trim()) },
  { id: "linkedin", label: "LinkedIn", points: 5, test: (c) => Boolean(c.linkedin?.trim()) },
  { id: "address", label: "Address", points: 5, test: (c) => Boolean(c.address?.trim()) },
  { id: "city", label: "City", points: 5, test: (c) => Boolean(c.city?.trim()) },
  { id: "stage", label: "Stage", points: 5, test: (c) => Boolean(c.stage?.trim()) && c.stage !== "Unknown" },
  { id: "claimed", label: "Verified profile", points: 10, test: (c) => Boolean(c.claimedByFounder) },
  { id: "hiring", label: "Hiring status set", points: 10, test: (c) => c.hiringStatus != null && c.hiringStatus !== "unknown" },
  { id: "logo", label: "Logo", points: 10, test: (c) => Boolean(c.logo) },
  { id: "yearFounded", label: "Year founded", points: 5, test: (c) => Boolean(c.yearFounded) },
];

export function scoreCompanyQuality(company: Company): QualityScore {
  const strongFields: string[] = [];
  const missingFields: string[] = [];

  let total = 0;
  for (const check of QUALITY_CHECKS) {
    if (check.test(company)) {
      total += check.points;
      strongFields.push(check.label);
    } else {
      missingFields.push(check.label);
    }
  }

  const staleFields: string[] = [];
  if (company.lastUpdated) {
    const daysSince = (Date.now() - new Date(company.lastUpdated).getTime()) / 86400000;
    if (daysSince > 180) staleFields.push("Profile last updated over 180 days ago");
  } else {
    staleFields.push("Last update date unknown");
  }

  const label =
    total >= 85 ? "Investor Ready ✓" :
    total >= 65 ? "Good — a few gaps" :
    total >= 40 ? "Needs Work" : "Incomplete";

  // Generate specific recommendation
  let topRecommendation = "Review and update company profile.";
  if (!company.claimedByFounder) {
    topRecommendation = "Claim this profile to unlock verification badge and hiring status management.";
  } else if (!company.logo) {
    topRecommendation = "Add a company logo to improve visibility in search results.";
  } else if (missingFields.includes("Hiring status set")) {
    topRecommendation = "Set hiring status to appear in talent and investor search results.";
  } else if (missingFields.includes("Year founded")) {
    topRecommendation = "Add founding year to improve investor credibility.";
  }

  return { total, label, strongFields, missingFields, staleFields, topRecommendation };
}

// ─── Persona-specific plan data ──────────────────────────────────────────────

type ResourceRecommendation = {
  name: string;
  why: string;
  url: string;
  urgency: "high" | "medium" | "low";
};

type FounderPlan = {
  diagnosis: string;
  weeklyPriorities: { week: string; focus: string; actions: string[] }[];
  resources: ResourceRecommendation[];
  compassActions: string[];
  fundingStep: string;
  hiringStep: string;
  communityStep: string;
  gmailDraft: string;
};

export const PERSONA_PLANS: Record<string, FounderPlan> = {
  jordan: {
    diagnosis: "Pre-product idea-stage founder. Priority: validate the idea fast, find a co-founder, and avoid building the wrong thing.",
    weeklyPriorities: [
      { week: "Week 1", focus: "Idea validation", actions: ["Talk to 10 potential users this week", "Document exact pain point and current workaround", "Attend a Silicon Slopes meetup"] },
      { week: "Week 2", focus: "Co-founder search", actions: ["Post on Silicon Slopes job board", "Email U of U CS department listserv", "Apply to iHub cohort for structure"] },
      { week: "Week 3", focus: "MVP scoping", actions: ["Define the 3-screen core flow", "Find a technical advisor at SBDC", "Register a free Startup Compass company listing"] },
      { week: "Week 4", focus: "Early community", actions: ["Demo at a local startup showcase", "Join a Utah startup Slack community", "Schedule SBDC free advisor session"] },
    ],
    resources: [
      { name: "Utah SBDC", why: "Free advisors who help first-time founders validate and plan", url: "https://utahsbdc.org/", urgency: "high" },
      { name: "iHub (Innovation Hub)", why: "Structured early-stage programs at U of U for new founders", url: "https://ihub.utah.edu/", urgency: "high" },
      { name: "Lassonde Entrepreneur Institute", why: "U of U program specifically for student/new founders", url: "https://lassonde.utah.edu/", urgency: "medium" },
    ],
    compassActions: ["Add your company to Startup Compass", "Follow 5 B2B Software seed companies to track their journey", "Enable weekly digest for new companies in your sector"],
    fundingStep: "Do not raise yet. Validate first. Explore Utah Governor's Office startup grants ($5k–$25k non-dilutive) after 3 months of traction.",
    hiringStep: "Find a technical co-founder via Silicon Slopes, U of U iHub, and founder matching programs. Do not hire employees at this stage.",
    communityStep: "Attend Silicon Slopes monthly meetup and Lassonde's First Pitch competition. These give feedback and early investor exposure.",
    gmailDraft: "Subject: Looking to connect with Utah founders at idea stage\n\nHi [Name],\n\nI'm Jordan, building a mobile app in Utah and looking to connect with other founders at the early stage. Would love to grab coffee and hear about your journey.\n\nBest, Jordan",
  },

  maria: {
    diagnosis: "Rural woman-owned AgTech founder with early traction. Priority: non-dilutive capital, rural-specific programs, and finding distribution partners.",
    weeklyPriorities: [
      { week: "Week 1", focus: "Grant identification", actions: ["Apply to Rural Fast Track Grant (GOED)", "Contact Utah Department of Agriculture for matching programs", "List on Utah's Own marketplace"] },
      { week: "Week 2", focus: "Distribution", actions: ["Contact 3 Salt Lake food distributors about your traceability platform", "Reach out to Utah Restaurant Association", "Apply to Women Tech Council programs"] },
      { week: "Week 3", focus: "Technology scale", actions: ["Evaluate USTAR tech grant for platform development", "Connect with USU Extension for rural ag partnerships", "File for SBIR Phase 1 if platform qualifies"] },
      { week: "Week 4", focus: "Profile and investors", actions: ["Claim Startup Compass profile", "Complete Women Tech Council network intro", "Identify 2 mission-aligned angel investors"] },
    ],
    resources: [
      { name: "Rural Fast Track Grant", why: "Utah-specific non-dilutive funding for rural businesses — you qualify", url: "https://business.utah.gov/rural/", urgency: "high" },
      { name: "Utah's Own", why: "Direct marketplace for Utah-made agricultural products", url: "https://utahsown.utah.gov/", urgency: "high" },
      { name: "Women Tech Council", why: "Network and programs specifically for women-led Utah tech companies", url: "https://womentechcouncil.com/", urgency: "medium" },
    ],
    compassActions: ["Add your AgTech company to Startup Compass under Consumer sector", "Follow other Utah rural and ag companies", "Set an alert for new agricultural resource programs"],
    fundingStep: "Target Rural Fast Track ($10k–$50k), UDAF matching grants, and USDA Value-Added Producer Grants before considering dilutive funding.",
    hiringStep: "Partner with Utah State University Extension for an agricultural student intern who can help with traceability tech development.",
    communityStep: "Connect with Utah Farmers Market Association and USU Extension for distribution exposure. Join Women Tech Council for tech founder support.",
    gmailDraft: "Subject: Utah AgTech company seeking rural grant guidance\n\nDear [Program Officer],\n\nI'm Maria, founder of [Company] in Box Elder County, building a produce traceability platform for direct-to-restaurant sales. We have 5 employees and are looking for guidance on rural business programs.\n\nBest, Maria",
  },

  marcus: {
    diagnosis: "Veteran founder in advanced manufacturing with working prototype and real LOIs. Priority: SBIR, manufacturing partnerships, and veteran-specific resources.",
    weeklyPriorities: [
      { week: "Week 1", focus: "SBIR preparation", actions: ["Contact VBOC Utah for SBIR coaching", "Review DoD SBIR topics aligned with your tech", "File Phase 1 application (up to $150k non-dilutive)"] },
      { week: "Week 2", focus: "Veteran network", actions: ["Register with Utah Veteran Business Registry", "Contact iMpact Utah for veteran entrepreneur support", "Attend Weber County economic development meeting"] },
      { week: "Week 3", focus: "Manufacturing partners", actions: ["Contact Utah MEP (Manufacturing Extension Partnership)", "Reach out to Hill Air Force Base supplier development program", "Explore Utah Advanced Manufacturing cluster"] },
      { week: "Week 4", focus: "Investor readiness", actions: ["Claim Startup Compass company profile", "Prepare 2-page executive summary for defense investors", "Connect with In-Q-Tel (CIA venture arm) for relevant sectors"] },
    ],
    resources: [
      { name: "VBOC (Veteran Business Outreach Center)", why: "Free SBIR/STTR coaching, business planning, and veteran network for Utah vets", url: "https://vboc.utah.edu/", urgency: "high" },
      { name: "Utah MEP", why: "Manufacturing Extension Partnership — direct support for Utah manufacturers", url: "https://utahmep.org/", urgency: "high" },
      { name: "SBIR/STTR DoD", why: "Non-dilutive Phase 1 ($150k) and Phase 2 ($1M) for defense-adjacent tech", url: "https://www.sbir.gov/", urgency: "high" },
    ],
    compassActions: ["Add your manufacturing company to Startup Compass under B2B Software or Consumer sector", "Follow Utah manufacturing and defense companies", "Set an alert for SBIR-related resource updates"],
    fundingStep: "File DoD SBIR Phase 1 immediately — your LOIs are strong supporting evidence. Also explore Utah Industrial Assistance Fund for equipment loans.",
    hiringStep: "Contact Ogden-Weber Applied Technology College for machining and manufacturing apprentices. Weber County has a strong technical workforce pipeline.",
    communityStep: "Join Utah Advanced Manufacturing cluster and Hill Air Force Base supplier events. VBOC's veteran founder network is your most direct warm intro path.",
    gmailDraft: "Subject: Veteran-owned Utah manufacturer seeking SBIR guidance\n\nDear [Officer],\n\nI'm Marcus, a U.S. Army veteran and founder of a manufacturing startup in Weber County. We have a working prototype and 2 LOIs from defense contractors. I'm seeking guidance on SBIR applications and manufacturing partnerships.\n\nBest, Marcus",
  },

  priya: {
    diagnosis: "B2B SaaS seed-stage founder with ARR and angels closed. Priority: Series A preparation, investor pipeline, and scaling go-to-market.",
    weeklyPriorities: [
      { week: "Week 1", focus: "Series A narrative", actions: ["Build 12-month ARR trendline chart", "Define ICP (ideal customer profile) precisely", "List 3–5 comparable exits for your category"] },
      { week: "Week 2", focus: "Investor pipeline", actions: ["Contact Kickstart Seed Fund for warm intro", "Apply to Silicon Slopes investor database", "Reach out to 3 local angels who have SaaS exits"] },
      { week: "Week 3", focus: "GTM scaling", actions: ["Hire first SDR or AE through Silicon Slopes job board", "Launch LinkedIn content strategy for founder brand", "Add 10 enterprise prospects to pipeline"] },
      { week: "Week 4", focus: "Utah ecosystem positioning", actions: ["Get featured in Silicon Slopes magazine", "Claim Startup Compass profile with full details", "Present at a Utah Founders event"] },
    ],
    resources: [
      { name: "Kickstart Seed Fund", why: "Utah's most active seed fund with a strong B2B SaaS portfolio", url: "https://www.kickstart.vc/", urgency: "high" },
      { name: "Peterson Ventures", why: "Provo-based VC with direct B2B Software investments and warm intro network", url: "https://www.petersonventures.com/", urgency: "high" },
      { name: "Silicon Slopes", why: "Largest Utah tech community — your investor warm intros come through here", url: "https://www.siliconslopes.com/", urgency: "medium" },
    ],
    compassActions: ["Claim your company profile on Startup Compass", "Enable investor radar notifications for B2B Software Series A companies", "Watch the top 10 B2B Software Utah companies for benchmark data"],
    fundingStep: "Prepare Series A deck targeting $4M at 20x ARR multiple. Target Kickstart, Peterson, Album VC, and 3–4 national SaaS-focused VCs. Aim to close in 60 days.",
    hiringStep: "Hire a senior SDR through Silicon Slopes job board. This is your highest-leverage hire before closing Series A — it shows GTM maturity.",
    communityStep: "Get listed on the Silicon Slopes tech directory and pitch at the next Silicon Slopes Summit. Investor attendance is high.",
    gmailDraft: "Subject: B2B SaaS HR Automation — $420k ARR — Raising $4M Series A\n\nDear [Investor Name],\n\nI'm Priya, CEO of [Company]. We're an HR workflow automation tool with $420k ARR, 18 employees, and strong NPS. We're raising a $4M Series A and would love to share our deck.\n\nBest, Priya",
  },

  david: {
    diagnosis: "Medical device CEO at Series B with FDA clearance. Priority: international expansion (EU CE Mark, Japan PMDA), export programs, and strategic partners.",
    weeklyPriorities: [
      { week: "Week 1", focus: "Export prep", actions: ["Apply for STEP Export Grant (up to $10k reimbursement)", "Contact World Trade Center Utah for Japan and EU intros", "Hire a regulatory affairs consultant for CE Mark process"] },
      { week: "Week 2", focus: "International regulatory", actions: ["Engage EU Notified Body for CE Mark pathway review", "Contact PMDA Japan liaison at WTC Utah", "Review EU MDR 2017/745 requirements with legal counsel"] },
      { week: "Week 3", focus: "Strategic partners", actions: ["Identify 2 EU medical device distributors", "Connect with BioHive for Utah healthcare network", "Brief your Series B investors on international timeline"] },
      { week: "Week 4", focus: "Investor narrative", actions: ["Update pitch deck with international revenue projections", "Apply to Medical Device conference circuit (EU/Japan)", "Claim Startup Compass profile with full FDA clearance details"] },
    ],
    resources: [
      { name: "STEP Export Grant (Utah)", why: "Up to $10k reimbursement for international trade show attendance and export development", url: "https://business.utah.gov/international/", urgency: "high" },
      { name: "World Trade Center Utah", why: "Direct connections to EU and Japan healthcare market entry resources", url: "https://wtcutah.com/", urgency: "high" },
      { name: "BioHive", why: "Utah healthcare and life sciences cluster — warm intros to medical device distribution partners", url: "https://biohive.com/", urgency: "medium" },
    ],
    compassActions: ["Update Startup Compass profile with FDA 510(k) clearance milestone", "Follow Utah life sciences companies for partnership signals", "Set investor alert for Bio/Medical Tech Series B+ companies"],
    fundingStep: "Use your FDA clearance as the anchor for EU/Japan market entry narrative. Explore a Series C focused on international expansion ($15–25M target with a healthcare-focused lead).",
    hiringStep: "Hire a VP of International Business Development — this role is critical for EU/Japan market entry. Target candidates with EU regulatory and Japan MedTech experience.",
    communityStep: "Join BioHive, present at Utah Life Sciences Summit, and leverage WTC Utah's Japan and EU trade mission programs.",
    gmailDraft: "Subject: FDA-Cleared Utah Medical Device — EU/Japan Expansion — Series C Prep\n\nDear [Investor],\n\nI'm David, CEO of [Company]. We have a 510(k)-cleared device, 35 employees, and $8M Series B closed. We're preparing EU CE Mark and Japan PMDA filings and planning a Series C.\n\nBest, David",
  },

  "dr-amir": {
    diagnosis: "Pre-company university spinout with IP and early grants. Priority: technology transfer, entity formation, and finding first commercialization partner.",
    weeklyPriorities: [
      { week: "Week 1", focus: "TechTrans engagement", actions: ["Schedule meeting with U of U Tech Transfer Office", "Review IP licensing options vs. assignment", "Identify USTAR commercialization program eligibility"] },
      { week: "Week 2", focus: "Entity formation", actions: ["Form an LLC with University co-inventor agreement", "Apply to Bench-to-Bedside or NSF I-Corps program", "Connect with EPIC Ventures at U of U"] },
      { week: "Week 3", focus: "Commercialization partners", actions: ["Identify 2 pharmaceutical or biotech companies for licensing discussions", "Apply to NIH SBIR Phase 1 (up to $300k)", "Attend BioHive networking event for startup biotech founders"] },
      { week: "Week 4", focus: "Investor intro", actions: ["Pitch to EPIC Ventures fund (U of U-affiliated)", "Apply to Lassonde Launch program", "Register company on Startup Compass as a pre-revenue biotech spinout"] },
    ],
    resources: [
      { name: "U of U Tech Transfer Office", why: "First stop for any U of U spinout — they manage IP licensing, assignment, and spinout structure", url: "https://techtransfer.utah.edu/", urgency: "high" },
      { name: "EPIC Ventures", why: "University of Utah-affiliated early-stage fund that co-invests in faculty/student spinouts", url: "https://epicventures.com/", urgency: "high" },
      { name: "NSF I-Corps", why: "National Science Foundation's program for turning research into market-ready products", url: "https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=504672", urgency: "high" },
    ],
    compassActions: ["Register as a Bio/Medical Tech Pre-Seed company on Startup Compass once entity is formed", "Follow Recursion Pharmaceuticals and other Utah biotech spinouts", "Set alert for SBIR Bio/Medical Tech programs"],
    fundingStep: "Apply NIH SBIR Phase 1 immediately ($300k non-dilutive) using your published research as validation. This funds 6–12 months of early commercialization without giving up equity.",
    hiringStep: "Recruit a postdoctoral researcher or senior PhD student as your first technical co-founder through U of U's research programs. Do not hire employees before entity formation.",
    communityStep: "Attend BioHive monthly events and U of U Lassonde Launch program. These are the fastest paths to your first industry advisor and early investor conversation.",
    gmailDraft: "Subject: U of U Biotech Spinout — Novel Drug Delivery — Seeking Commercialization Guidance\n\nDear [TTO Officer/Investor],\n\nI'm Dr. Amir, a University of Utah PhD with a novel drug delivery platform (provisional patent filed, USTAR grant awarded). I'm exploring spinout options and looking for early commercialization guidance.\n\nBest, Dr. Amir",
  },
};
