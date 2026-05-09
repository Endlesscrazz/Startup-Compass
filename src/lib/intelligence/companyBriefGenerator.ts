import type { Company } from "@/lib/map-config";
import { completeJson } from "@/lib/intelligence/llm";
import type { BriefType, UserIntentProfile } from "@/lib/intelligence/types";

export type BriefEmailPayload = {
  subject: string;
  previewText: string;
  intro: string;
  companies: {
    companyId: string;
    summary: string;
    whyItMatches: string;
    insight: string;
  }[];
  ecosystemInsight: string;
  funFact: string;
  suggestedActions: string[];
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://startup-compass-one.vercel.app";

function fallbackPayload(params: {
  companies: Company[];
  intent: UserIntentProfile | null;
  briefType: BriefType;
  theme: string;
}): BriefEmailPayload {
  const { companies, intent, briefType, theme } = params;
  const locHint =
    intent?.locations_json?.[0] ?? intent?.sectors_json?.[0] ?? "Utah startups";
  return {
    subject:
      briefType === "company_follow" && companies[0]
        ? `You're now following ${companies[0].name}`
        : `Your Utah startup brief: ${theme || locHint}`,
    previewText: `Personalized snapshot of ${companies.length} compan${companies.length === 1 ? "y" : "ies"} you explored on Startup Compass.`,
    intro: `Here is a concise brief based on what you were exploring${theme ? ` (${theme})` : ""}. Facts below come from the public Startup Compass dataset — not private filings.`,
    companies: companies.map((c) => ({
      companyId: c.id,
      summary: (c.description ?? `${c.name} is listed in the Utah startup map.`).slice(0, 220),
      whyItMatches:
        intent?.sectors_json?.includes(c.sector)
          ? `Matches your interest in ${c.sector}.`
          : `Visible in your recent map activity (${c.sector}, ${c.city}).`,
      insight:
        c.stage && c.employees
          ? `Stage ${c.stage} · team size ${c.employees} — useful context before outreach.`
          : "Profile fields are community-sourced; verify on their site before decisions.",
    })),
    ecosystemInsight:
      "Utah's startup density clusters along the Wasatch Front, with deep talent from BYU, the University of Utah, and USU feeding technical and GTM roles.",
    funFact:
      "Silicon Slopes and state partners often co-host founder office hours — a good low-friction way to meet operators who have scaled Utah companies.",
    suggestedActions: [
      "Follow companies you want updates on",
      "Open Briefs & Alerts to tune email and SMS",
      "Explore similar companies from each profile",
    ],
  };
}

function buildHtml(p: BriefEmailPayload): string {
  const companyBlocks = p.companies
    .map(
      (c) => `
      <div style="margin:16px 0;padding:12px 16px;border:1px solid #e6e2d8;border-radius:12px;background:#fbf7f0;">
        <p style="margin:0 0 6px;font-weight:600;font-size:15px;color:#062a52;">${escapeHtml(truncate(c.summary.split(".")[0] ?? "", 80))}</p>
        <p style="margin:0 0 6px;font-size:13px;color:#334868;"><strong>Why it matched:</strong> ${escapeHtml(c.whyItMatches)}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#334868;"><strong>Insight:</strong> ${escapeHtml(c.insight)}</p>
        <a href="${BASE_URL}/search?c=${encodeURIComponent(c.companyId)}" style="font-size:13px;color:#0b5cab;">View profile →</a>
      </div>`,
    )
    .join("");

  return `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#fff;color:#062a52;line-height:1.5;padding:24px;">
  <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#6b7a90;">Startup Compass</p>
  <h1 style="font-size:22px;margin:8px 0 12px;">${escapeHtml(p.subject)}</h1>
  <p style="font-size:15px;color:#334868;">${escapeHtml(p.intro)}</p>
  ${companyBlocks}
  <div style="margin-top:20px;padding:14px 16px;background:#eef4ff;border-radius:12px;">
    <p style="margin:0 0 6px;font-size:14px;"><strong>Utah ecosystem insight</strong></p>
    <p style="margin:0;font-size:14px;color:#334868;">${escapeHtml(p.ecosystemInsight)}</p>
  </div>
  <div style="margin-top:16px;padding:14px 16px;border:1px dashed #c9d4e8;border-radius:12px;">
    <p style="margin:0 0 6px;font-size:14px;"><strong>One useful note</strong></p>
    <p style="margin:0;font-size:14px;color:#334868;">${escapeHtml(p.funFact)}</p>
  </div>
  <p style="margin-top:20px;font-size:14px;"><strong>Next steps</strong></p>
  <ul style="margin:8px 0;padding-left:20px;font-size:14px;color:#334868;">
    ${p.suggestedActions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
  </ul>
  <p style="margin-top:24px;font-size:12px;color:#6b7a90;">Manage notifications: <a href="${BASE_URL}/briefs-alerts">${BASE_URL}/briefs-alerts</a></p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

export async function generateCompanyBriefEmail(input: {
  user: { name?: string | null; email?: string | null };
  intentProfile: UserIntentProfile | null;
  companies: Company[];
  reason: string;
  briefType: BriefType;
}): Promise<{ html: string; payload: BriefEmailPayload; demo: boolean }> {
  const theme =
    input.intentProfile?.inferred_keywords_json?.[0] ??
    input.intentProfile?.sectors_json?.[0] ??
    "";
  const fallback = fallbackPayload({
    companies: input.companies,
    intent: input.intentProfile,
    briefType: input.briefType,
    theme,
  });

  const companyLines = input.companies
    .map(
      (c) =>
        `- id=${c.id} name=${c.name} sector=${c.sector} stage=${c.stage} city=${c.city} employees=${c.employees} hiring=${c.hiringStatus ?? "unknown"} desc=${truncate(c.description ?? "", 200)}`,
    )
    .join("\n");

  const system = `You write concise email briefs for Startup Compass, a Utah startup discovery product.
Return ONLY valid JSON with this shape (no markdown):
{
  "subject": "string",
  "previewText": "string under 140 chars",
  "intro": "2 sentences max",
  "companies": [{ "companyId": "exact id from input", "summary": "one sentence", "whyItMatches": "specific to user signals", "insight": "non-obvious but safe" }],
  "ecosystemInsight": "one sentence about Utah clusters, talent, or programs — no fake statistics",
  "funFact": "one short tasteful fact about Utah startup culture OR the sector — do NOT invent funding rounds, revenue, customers, or awards for any named company",
  "suggestedActions": ["3 short strings"]
}
Rules: Never claim unverified facts about a company. If unsure, say information is not listed publicly. Do not use the word "AI". Keep total JSON tight.`;

  const user = `Brief type: ${input.briefType}. Trigger: ${input.reason}.
User audience hint: ${input.intentProfile?.audience_type ?? "unknown"}.
Intent sectors: ${(input.intentProfile?.sectors_json ?? []).join(", ") || "n/a"}.
Intent locations: ${(input.intentProfile?.locations_json ?? []).join(", ") || "n/a"}.
Hiring interest: ${input.intentProfile?.hiring_interest ?? false}.
User name: ${input.user.name ?? "there"}.

Companies:
${companyLines}`;

  const { data, demo } = await completeJson<BriefEmailPayload>(system, user, fallback);

  const byId = new Map(input.companies.map((c) => [c.id, c]));
  const mergedCompanies = data.companies
    .filter((row) => byId.has(row.companyId))
    .slice(0, 7);
  if (mergedCompanies.length === 0) {
    const fb = fallbackPayload({
      companies: input.companies,
      intent: input.intentProfile,
      briefType: input.briefType,
      theme,
    });
    return { html: buildHtml(fb), payload: fb, demo: true };
  }

  const payload: BriefEmailPayload = {
    ...data,
    companies: mergedCompanies.map((row) => {
      const c = byId.get(row.companyId)!;
      return {
        companyId: row.companyId,
        summary: row.summary || fallback.companies.find((x) => x.companyId === c.id)?.summary || "",
        whyItMatches: row.whyItMatches || "",
        insight: row.insight || "",
      };
    }),
  };

  return { html: buildHtml(payload), payload, demo };
}

export { buildHtml, fallbackPayload, BASE_URL };
