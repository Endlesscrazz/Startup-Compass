import type { FounderProfileInput, MatchResultItem } from "@/lib/founder/types";

function safe(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t.length ? t : "";
}

export function generateResourceOutreachDraft(
  founderProfile: FounderProfileInput,
  resource: MatchResultItem,
): string {
  const founderName = safe(founderProfile.founderDisplayName);
  const city = safe(founderProfile.city);
  const stage = founderProfile.stage ?? "";
  const sector = founderProfile.sector ?? "";

  const program = safe(resource.title);
  const toLine = resource.email ? `To: ${resource.email}` : "";

  // Use the already-computed personalized explanation as the specific "why I'm contacting you"
  // sentence. This is already personalized to the founder's situation — no LLM call needed,
  // no AI artifacts.
  const whyLine = safe(resource.explanation);

  const greeting = `Hello,`;

  // Context line: brief founder intro, human-sounding
  const stageLabel = stage === "idea" ? "early-stage"
    : stage === "building" ? "early-stage"
    : stage === "revenue" ? "growing"
    : stage === "growth" ? "established"
    : "startup";

  const article = /^[aeiou]/i.test(stageLabel) ? "an" : "a";
  const introLine = founderName
    ? `My name is ${founderName}. I'm ${city ? `based in ${city} and ` : ""}building ${article} ${stageLabel} ${sector} company.`
    : `I'm ${city ? `based in ${city} and ` : ""}building ${article} ${stageLabel} ${sector} company.`;

  // The specific "why" — pulled directly from the match explanation
  const whySection = whyLine
    ? `I came across your program and wanted to reach out: ${whyLine}`
    : `I came across ${program} and believe it could be a strong fit for where we are right now.`;

  // Ask: specific, not vague
  const ask = `I'd love to learn more about eligibility and how to get involved. Would you be open to a quick call or point me to the right contact?`;

  const sign = founderName ? `Thanks,\n${founderName}` : `Thanks`;

  const lines = [
    toLine,
    toLine ? "" : null,
    `Subject: Quick question about ${program}`,
    "",
    greeting,
    "",
    introLine,
    "",
    whySection,
    "",
    ask,
    "",
    sign,
  ].filter((l) => l !== null) as string[];

  return lines.join("\n");
}
