import { auth } from "@/auth";
import { generateCompanyBriefEmail } from "@/lib/intelligence/companyBriefGenerator";
import { resolveCompanies } from "@/lib/intelligence/companies";
import { sendBriefEmail } from "@/lib/intelligence/gmailDelivery";
import { recomputeIntentProfile, topCompaniesForUser } from "@/lib/intelligence/intentEngine";
import {
  getEmailBrief,
  getIntentProfile,
  recordActivity,
  saveEmailBrief,
  updateEmailBrief,
} from "@/lib/intelligence/store";
import type { BriefType } from "@/lib/intelligence/types";
import { COMPANIES } from "@/lib/map-config";

export async function createBriefRecord(params: {
  userId: string;
  companyIds?: string[];
  briefType: BriefType;
  reason: string;
}): Promise<{
  briefId: string;
  html: string;
  subject: string;
  previewText: string;
  demo: boolean;
}> {
  const session = await auth();
  recomputeIntentProfile(params.userId);
  const intentProfile = getIntentProfile(params.userId);
  const companies = params.companyIds?.length
    ? resolveCompanies(params.companyIds)
    : topCompaniesForUser(params.userId, COMPANIES, 7);
  if (!companies.length) {
    throw new Error("No companies to brief");
  }
  const { html, payload, demo } = await generateCompanyBriefEmail({
    user: { name: session?.user?.name, email: session?.user?.email },
    intentProfile,
    companies,
    reason: params.reason,
    briefType: params.briefType,
  });
  recordActivity({
    user_id: params.userId,
    event_type: "company_brief_requested",
    entity_type: "company",
    entity_id: companies[0]?.id ?? null,
    metadata_json: { briefType: params.briefType, companyCount: companies.length },
  });
  const brief = saveEmailBrief({
    user_id: params.userId,
    brief_type: params.briefType,
    subject: payload.subject,
    preview_text: payload.previewText,
    html_body: html,
    companies_json: companies.map((c) => ({ companyId: c.id, name: c.name })),
    trigger_reason: params.reason,
    status: "preview",
  });
  return {
    briefId: brief.id,
    html,
    subject: payload.subject,
    previewText: payload.previewText,
    demo,
  };
}

export async function deliverBriefToInbox(params: {
  userId: string;
  briefId: string;
}): Promise<{ status: "sent" | "simulated" | "failed"; messageId?: string; error?: string }> {
  const session = await auth();
  const brief = getEmailBrief(params.briefId, params.userId);
  if (!brief) throw new Error("Brief not found");
  const to = session?.user?.email;
  if (!to) {
    updateEmailBrief(params.briefId, params.userId, { status: "simulated" });
    recordActivity({
      user_id: params.userId,
      event_type: "email_brief_sent",
      entity_type: "none",
      entity_id: null,
      metadata_json: { briefId: params.briefId, mode: "simulated_no_email" },
    });
    return { status: "simulated" };
  }
  const r = await sendBriefEmail({
    userId: params.userId,
    to,
    subject: brief.subject,
    html: brief.html_body,
  });
  if (r.mode === "sent" && r.ok) {
    updateEmailBrief(params.briefId, params.userId, {
      status: "sent",
      provider_message_id: r.messageId ?? null,
      sent_at: new Date().toISOString(),
    });
    recordActivity({
      user_id: params.userId,
      event_type: "email_brief_sent",
      entity_type: "none",
      entity_id: null,
      metadata_json: { briefId: params.briefId, mode: "sent" },
    });
    return { status: "sent", messageId: r.messageId };
  }
  if (r.mode === "failed") {
    updateEmailBrief(params.briefId, params.userId, {
      status: "failed",
      error_message: r.error ?? "send_failed",
    });
    return { status: "failed", error: r.error };
  }
  updateEmailBrief(params.briefId, params.userId, {
    status: "simulated",
    error_message: r.error ?? "not_configured",
  });
  recordActivity({
    user_id: params.userId,
    event_type: "email_brief_sent",
    entity_type: "none",
    entity_id: null,
    metadata_json: { briefId: params.briefId, mode: "simulated" },
  });
  return { status: "simulated", error: r.error };
}
