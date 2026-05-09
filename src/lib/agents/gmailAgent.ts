/**
 * Gmail integration agent.
 * Default: create in-app simulated drafts.
 * Real Gmail drafts: requires Google OAuth token (not implemented for hackathon demo).
 * Real email sending: requires GMAIL_SEND_ENABLED=true AND valid OAuth token.
 */
import { createGmailDraft, addAction } from "@/lib/agents/agentState";
import type { GmailDraft } from "@/lib/agents/agentState";
import { getPublicSiteUrl } from "@/lib/siteUrl";

export const GMAIL_SEND_ENABLED = process.env.GMAIL_SEND_ENABLED === "true";
export const GMAIL_CONNECTED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export type GmailDraftInput = {
  userId: string;
  subject: string;
  body: string;
  to?: string;
  draftType: GmailDraft["draftType"];
  linkedEntityId?: string;
  linkedRuleId?: string;
};

/**
 * Creates a Gmail draft — either real (if OAuth connected) or simulated in-app.
 * Never sends automatically.
 */
export async function createDraft(input: GmailDraftInput): Promise<GmailDraft & { mode: "simulated" | "real" }> {
  const status: GmailDraft["status"] = GMAIL_CONNECTED ? "draft_created" : "simulated";

  const draft = createGmailDraft({
    ...input,
    status,
  });

  addAction({
    actionType: "gmail_draft",
    status: status === "simulated" ? "simulated" : "created",
    payload: { subject: input.subject, to: input.to ?? "(no recipient)", draftType: input.draftType },
    result: { draftId: draft.id, status },
    ruleMatchId: undefined,
  });

  return { ...draft, mode: status === "simulated" ? "simulated" : "real" };
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function buildCompanyAlertEmail(params: {
  companyName: string;
  change: string;
  whyMatters: string;
  ruleName: string;
  companyUrl: string;
}): { subject: string; body: string } {
  return {
    subject: `Startup Compass Alert: ${params.companyName} — ${params.change}`,
    body: `Hi there,

Your Autopilot Rule "${params.ruleName}" just fired.

Company: ${params.companyName}
Change: ${params.change}
Why it matters: ${params.whyMatters}

Recommended next action: Review this company's profile and decide whether to add them to your investor brief or talent watchlist.

View profile: ${params.companyUrl}

—
Startup Compass Mission Control
${GMAIL_CONNECTED ? "" : "(This is a simulated draft — connect Gmail to create real drafts)"}`,
  };
}

export function buildWeeklyDigestEmail(params: {
  userName?: string;
  newCompanies: number;
  hiringChanges: number;
  investorSignals: number;
  topItems: { title: string; body: string }[];
  digestUrl: string;
}): { subject: string; body: string } {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return {
    subject: `Your Utah Startup Watchlist Digest — ${date}`,
    body: `Hi ${params.userName ?? "there"},

Here is your weekly Utah startup ecosystem update.

Summary:
• New companies added: ${params.newCompanies}
• Hiring status changes detected: ${params.hiringChanges}
• Investor-relevant signals: ${params.investorSignals}

Top items this week:
${params.topItems.map((item, i) => `${i + 1}. ${item.title}\n   ${item.body}`).join("\n\n")}

View your full digest: ${params.digestUrl}

—
Startup Compass Mission Control
${GMAIL_CONNECTED ? "" : "(Simulated draft — connect Gmail to create real drafts)"}`,
  };
}

export function buildInvestorOutreachEmail(params: {
  investorName: string;
  firm: string;
  sectorFocus: string;
  companies: { name: string; sector: string; stage: string; why: string }[];
  senderName?: string;
}): { subject: string; body: string } {
  const companyLines = params.companies
    .map((c) => `• ${c.name} (${c.sector}, ${c.stage}): ${c.why}`)
    .join("\n");
  return {
    subject: `Utah ${params.sectorFocus} companies worth watching`,
    body: `Dear ${params.investorName},

I'm reaching out from the Utah Startup Compass on behalf of the Utah startup ecosystem.

Given your focus on ${params.sectorFocus}, I wanted to share a few Utah companies we think align with your thesis:

${companyLines}

Utah is producing consistent ${params.sectorFocus} deal flow with lower cost of living, a strong university pipeline (U of U, BYU, USU), and tight-knit founder community.

Would you be open to a 30-minute call to discuss the Utah ecosystem?

Best,
${params.senderName ?? "Utah Startup Compass Team"}

View the full Startup Atlas: ${getPublicSiteUrl()}/map
${GMAIL_CONNECTED ? "" : "(Simulated draft)"}`,
  };
}

export function buildFounderProfileEmail(params: {
  companyName: string;
  missingFields: string[];
  claimUrl: string;
}): { subject: string; body: string } {
  return {
    subject: `Complete your Startup State profile to appear in more searches`,
    body: `Hi ${params.companyName} team,

Your company is listed on Utah Startup Compass but your profile is missing some important details that affect your visibility in investor and talent searches.

Missing fields:
${params.missingFields.map((f) => `• ${f}`).join("\n")}

Completing your profile takes 5 minutes and helps you appear in:
• Investor radar searches
• Job hunter talent matches
• State economic development programs

Claim and update your profile: ${params.claimUrl}

—
Utah Startup Compass
${GMAIL_CONNECTED ? "" : "(Simulated draft)"}`,
  };
}
