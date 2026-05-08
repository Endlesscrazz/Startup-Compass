// Compose the founder profile string that gets embedded at request time.
// Template design documented in DECISIONS.md [DECISION-8].

export type Stage = "idea" | "building" | "revenue" | "growth";
export type Goal =
  | "Start a Business"
  | "Funding"
  | "Mentorship"
  | "Workspace"
  | "International"
  | "Scaling";

export interface QuizAnswers {
  stage: Stage;
  sector: string;       // raw sector label from quiz (e.g. "Tech / SaaS")
  city: string;         // raw city input from user
  county: string;       // resolved county name (server-side normalized)
  goal: Goal;
  community: string[];  // normalized data values: "Veteran", "Women", "Rural", "Student"
}

// Maps quiz sector labels → Industries field values in resources.json
export const SECTOR_TO_INDUSTRY: Record<string, string> = {
  "Tech / SaaS": "Software and Information Technology",
  "Life Sciences": "Life Sciences and Healthcare",
  "Manufacturing": "Manufacturing",
  "Agriculture": "Agriculture",
  "Aerospace & Defense": "Aerospace and Defense",
  "Retail / CPG": "Consumer Packaged Goods",
  "Food & Hospitality": "Hospitality and Food Services",
  "Arts & Entertainment": "Arts and Entertainment and Recreation",
  "Financial Services": "Financial Services",
  "Other": "Other",
};

// Maps goal → resource Topics field value used in boost scoring
export const GOAL_TO_TOPIC: Record<Goal, string> = {
  "Start a Business": "Start a Business",
  "Funding": "Funding",
  "Mentorship": "Entrepreneurship Communities",
  "Workspace": "Other",
  "International": "International Trade",
  "Scaling": "Late Stage Growth",
};

function stageDescriptor(stage: Stage, community: string[]): string {
  if (stage === "idea" && community.includes("Student")) {
    return "first-time founder exploring commercializing university research or novel technology";
  }
  const map: Record<Stage, string> = {
    idea: "first-time founder at the idea stage learning how to start a business",
    building: "pre-revenue early-stage founder actively building a product or service",
    revenue: "growth-stage founder with paying customers seeking to scale",
    growth: "established business owner with employees and revenue looking to expand",
  };
  return map[stage];
}

function goalPhrase(goal: Goal, stage: Stage): string {
  if (goal === "Funding") {
    return stage === "revenue" || stage === "growth"
      ? "venture capital, angel investment, or growth financing"
      : "grants, early-stage funding, and startup competitions";
  }
  const map: Record<Goal, string> = {
    "Start a Business": "guidance on how to launch and start my business for the first time",
    "Funding": "", // handled above
    "Mentorship": "mentorship, peer networks, and entrepreneurship community programs",
    "Workspace": "coworking space, maker space, or business incubator facilities",
    "International": "international trade support, export resources, and global market access",
    "Scaling": "resources to scale and grow my established business with employees",
  };
  return map[goal];
}

export function composeProfileString(answers: QuizAnswers): string {
  const { stage, sector, city, county, goal, community } = answers;

  const descriptor = stageDescriptor(stage, community);
  const goalPhr = goalPhrase(goal, stage);
  const industryLabel = SECTOR_TO_INDUSTRY[sector] ?? sector;
  const locationStr = city
    ? `${city} (${county} County)`
    : `${county} County`;

  const communityLines: string[] = [];
  if (community.includes("Veteran")) communityLines.push("I am a veteran entrepreneur.");
  if (community.includes("Women")) communityLines.push("My business is woman-owned.");
  if (community.includes("Rural")) communityLines.push("I operate in a rural area.");
  if (community.includes("Student")) communityLines.push("I am a university student or researcher.");

  const base = `I am a ${descriptor} building a ${industryLabel} business in ${locationStr}, Utah. I am looking for ${goalPhr}.`;

  return communityLines.length > 0
    ? `${base} ${communityLines.join(" ")}`
    : base;
}
