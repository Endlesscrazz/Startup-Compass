/** Plain-language glossary for inline tooltips on resource and results copy. */

export const STARTUP_JARGON: Record<string, string> = {
  SAFE:
    "Simple Agreement for Future Equity — a common startup investment contract that converts to equity later, often at a priced round.",
  SBIR:
    "Small Business Innovation Research — a U.S. federal program of phased grants for R&D; competitive and topic-driven.",
  STTR:
    "Small Business Technology Transfer — similar to SBIR but requires a research institution partner.",
  "non-dilutive":
    "Funding you do not repay with ownership (e.g., many grants); you keep the same cap table share.",
  "pre-seed":
    "Very early funding before a priced seed round — often friends, family, angels, or small grants.",
  accelerator:
    "A time-bound program that helps startups grow quickly, often with mentoring, curriculum, and sometimes investment.",
  incubator:
    "A longer-term program or space that nurtures very early companies with services and community.",
  "angel investor":
    "An individual who invests personal capital in early-stage private companies.",
  "venture capital":
    "Professional funds that invest in startups, usually for equity, often at later stages than angels.",
  runway:
    "How long a company can operate at current spending before needing more cash.",
  "cap table":
    "The spreadsheet of who owns how much of the company (founders, employees, investors).",
  equity:
    "Ownership in the company — usually shares or options — as opposed to debt you must repay.",
};

export function jargonTooltip(term: string): string {
  const key = term.replace(/\s+/g, " ").trim();
  const direct = STARTUP_JARGON[key];
  if (direct) return direct;
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(STARTUP_JARGON)) {
    if (k.toLowerCase() === lower) return v;
  }
  return "";
}
