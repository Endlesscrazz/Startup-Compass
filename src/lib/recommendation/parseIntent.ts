import type { Goal, Stage } from "@/lib/profile";

export interface ParsedIntent {
  chips: string[];
  goal: Goal | null;
  stage: Stage | null;
  sectorHint: string | null;
  appendToProfile: string | null;
}

const STAGES: Stage[] = ["idea", "building", "revenue", "growth"];

/** Keyword-only parser — always available if LLM is down. */
export function parseIntentDeterministic(query: string): ParsedIntent {
  const q = query.toLowerCase();
  const chips: string[] = [];
  let goal: Goal | null = null;
  let stage: Stage | null = null;
  let sectorHint: string | null = null;
  const bits: string[] = [];

  if (/(grant|sbir|sttr|non-dilutive|raise|fundraising|capital|investor|angel|venture)/.test(q)) {
    goal = "Funding";
    chips.push("Funding");
    bits.push("looking for funding and capital programs");
  }
  if (/(mentor|community|network|accelerator|incubator|peer)/.test(q)) {
    if (!goal) goal = "Mentorship";
    chips.push("Mentorship & programs");
    bits.push("seeking mentorship and community programs");
  }
  if (/(cowork|office|lab space|workspace|facility)/.test(q)) {
    if (!goal) goal = "Workspace";
    chips.push("Workspace");
    bits.push("needs workspace or facilities");
  }
  if (/(export|international|trade|global)/.test(q)) {
    if (!goal) goal = "International";
    chips.push("International trade");
    bits.push("focused on international trade");
  }
  if (/(scale|scaling|growth stage|expand)/.test(q)) {
    if (!goal) goal = "Scaling";
    chips.push("Scaling");
    bits.push("scaling an established business");
  }
  if (/(validate|idea stage|just starting|first-time founder|learn the basics)/.test(q)) {
    if (!goal) goal = "Start a Business";
    chips.push("Early / idea stage");
    stage = "idea";
    bits.push("early-stage founder validating an idea");
  }
  if (/(pre-seed|seed(?!\s*round)|early-stage startup|mvp)/.test(q)) {
    stage = stage ?? "building";
    chips.push("Building / pre-revenue");
    bits.push("building an early product");
  }
  if (/(paying customer|revenue|traction)/.test(q)) {
    stage = "revenue";
    chips.push("Revenue stage");
    bits.push("has paying customers");
  }
  if (/(saas|software|b2b|developer|tech)/.test(q)) {
    sectorHint = "Tech / SaaS";
    chips.push("Tech / SaaS");
    bits.push("technology or SaaS business");
  }
  if (/(bio|med|health|device|pharma|life science)/.test(q)) {
    sectorHint = "Life Sciences";
    chips.push("Life sciences");
    bits.push("life sciences or healthcare venture");
  }
  if (/(manufactur|hardware|industrial)/.test(q)) {
    sectorHint = "Manufacturing";
    chips.push("Manufacturing");
    bits.push("manufacturing or hardware");
  }
  if (/(climate|cleantech|energy|solar)/.test(q)) {
    chips.push("Climate / energy");
    bits.push("climate or energy focus");
  }
  if (/(rural|cedar|moab|vern|outside salt lake)/.test(q)) {
    chips.push("Rural Utah");
    bits.push("based in a rural Utah community");
  }
  if (/(salt lake|slc|provo|ogden|utah county)/.test(q)) {
    chips.push("Utah metro");
  }
  if (/(student|university|intern)/.test(q)) {
    chips.push("Student path");
    bits.push("student or university-connected founder");
  }
  if (/(veteran)/.test(q)) {
    chips.push("Veteran founder");
    bits.push("veteran entrepreneur");
  }

  if (!goal && /(start|launch|new business|first company)/.test(q)) {
    goal = "Start a Business";
    chips.push("Starting up");
    bits.push("starting a new business");
  }

  const appendToProfile = bits.length ? `[Search intent: ${bits.join("; ")}]` : null;

  return {
    chips: [...new Set(chips)],
    goal,
    stage: stage && STAGES.includes(stage) ? stage : null,
    sectorHint,
    appendToProfile,
  };
}
