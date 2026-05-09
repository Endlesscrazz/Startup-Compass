/**
 * SMS / Messages integration agent.
 * Default: create simulated in-app messages.
 * Real SMS: requires TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER.
 * Real sending: requires SMS_SEND_ENABLED=true.
 */
import { createSimulatedSms, addAction } from "@/lib/agents/agentState";
import type { SimulatedSms } from "@/lib/agents/agentState";
import { getPublicSiteUrl } from "@/lib/siteUrl";

export const SMS_SEND_ENABLED = process.env.SMS_SEND_ENABLED === "true";
export const TWILIO_CONFIGURED = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER,
);

export type SmsInput = {
  userId: string;
  to: string;
  body: string;
  messageType: SimulatedSms["messageType"];
  linkedEntityId?: string;
};

/**
 * Sends or simulates an SMS message.
 * Always creates an in-app record. Never sends for real unless both
 * TWILIO_CONFIGURED and SMS_SEND_ENABLED=true.
 */
export async function sendOrSimulateSms(input: SmsInput): Promise<SimulatedSms & { mode: "simulated" | "real" }> {
  const shouldSendReal = SMS_SEND_ENABLED && TWILIO_CONFIGURED;
  let status: SimulatedSms["status"] = "simulated";

  if (shouldSendReal) {
    try {
      // Real Twilio call — only executes if both flags are set
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const body = new URLSearchParams({
        To: input.to,
        From: process.env.TWILIO_FROM_NUMBER ?? "",
        Body: input.body,
      });
      const resp = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      status = resp.ok ? "sent" : "failed";
    } catch {
      status = "failed";
    }
  }

  const msg = createSimulatedSms({ ...input, status });

  addAction({
    actionType: status === "sent" ? "sms_send" : "sms_draft",
    status: status === "sent" ? "sent" : status === "failed" ? "failed" : "simulated",
    payload: { to: input.to, body: input.body, type: input.messageType },
    result: { msgId: msg.id, status },
    ruleMatchId: undefined,
  });

  return { ...msg, mode: shouldSendReal && status === "sent" ? "real" : "simulated" };
}

// ─── Message templates ────────────────────────────────────────────────────────

const BASE_URL = getPublicSiteUrl();

export function buildCompanyAlertSms(params: {
  companyName: string;
  ruleName: string;
  reason: string;
}): string {
  return `Startup Compass: ${params.companyName} matches your "${params.ruleName}" alert. ${params.reason} View: ${BASE_URL}/map`;
}

export function buildJobAlertSms(params: {
  companyName: string;
  roleLabel: string;
  sector: string;
}): string {
  return `New Utah role: ${params.roleLabel} at ${params.companyName} (${params.sector}). View: ${BASE_URL}/search`;
}

export function buildInvestorAlertSms(params: {
  companyName: string;
  sector: string;
  stage: string;
}): string {
  return `Investor Radar: ${params.companyName} (${params.sector}, ${params.stage}) is a high-fit signal. Brief ready: ${BASE_URL}/briefs`;
}

export function buildDigestSms(): string {
  return `Your Startup Compass weekly digest is ready. ${BASE_URL}/briefs`;
}
