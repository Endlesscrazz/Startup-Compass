import type { FounderProfileInput, MatchResultItem } from "@/lib/founder/types";

function safe(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : "[not provided]";
}

/**
 * Copyable outreach email — uses resource title/email from data only.
 */
export function generateResourceOutreachDraft(
  founderProfile: FounderProfileInput,
  resource: MatchResultItem,
): string {
  const founderName = safe(founderProfile.founderDisplayName);
  const biz = safe(founderProfile.businessName);
  const loc = safe(founderProfile.city);
  const stage = founderProfile.stage;
  const sector = founderProfile.sector;

  const program = safe(resource.title);
  const contactLine = resource.email
    ? `I am writing regarding ${program} (reply-to or contact: ${resource.email}).`
    : `I am writing regarding ${program}.`;

  return [
    `Subject: Introduction — ${biz} × ${program}`,
    "",
    `Hello,`,
    "",
    `${contactLine}`,
    "",
    `My name is ${founderName}. I lead ${biz}, based in ${loc}. We are a ${stage}-stage ${sector} company.`,
    "",
    `Your program appeared in Utah's Startup Compass recommendations for our profile. We would appreciate guidance on eligibility, timelines, and next steps to engage.`,
    "",
    `Thank you for your time.`,
    "",
    founderName !== "[not provided]" ? founderName : "Best regards,",
  ].join("\n");
}
