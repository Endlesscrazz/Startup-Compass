import { saveSmsAlert } from "@/lib/intelligence/store";
import type { CompanyEventType } from "@/lib/intelligence/types";

export const SMS_SEND_ENABLED = process.env.SMS_SEND_ENABLED === "true";
export const TWILIO_CONFIGURED = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER,
);

export async function sendIntelSms(input: {
  userId: string;
  to: string;
  body: string;
  companyId: string;
  watchlistId: string | null;
  eventType: CompanyEventType | string;
}): Promise<{ ok: boolean; mode: "simulated" | "sent" | "failed"; providerId?: string }> {
  const shouldSendReal = SMS_SEND_ENABLED && TWILIO_CONFIGURED;
  let status: "simulated" | "sent" | "failed" = "simulated";
  let providerId: string | undefined;

  if (shouldSendReal) {
    try {
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
      if (resp.ok) {
        const j = (await resp.json()) as { sid?: string };
        status = "sent";
        providerId = j.sid;
      } else {
        status = "failed";
      }
    } catch {
      status = "failed";
    }
  }

  saveSmsAlert({
    user_id: input.userId,
    company_id: input.companyId,
    watchlist_id: input.watchlistId,
    event_type: String(input.eventType),
    message_body: input.body,
    status,
    provider_message_id: providerId ?? null,
    error_message: status === "failed" ? "twilio_error" : null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });

  return {
    ok: status === "sent" || status === "simulated",
    mode: status === "sent" ? "sent" : status === "failed" ? "failed" : "simulated",
    providerId,
  };
}

/** Test SMS — respects same flags; does not require watchlist. */
export async function sendTestSms(userId: string, to: string, body: string) {
  const shouldSendReal = SMS_SEND_ENABLED && TWILIO_CONFIGURED;
  let status: "simulated" | "sent" | "failed" = "simulated";
  let providerId: string | undefined;
  if (shouldSendReal) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const form = new URLSearchParams({
        To: to,
        From: process.env.TWILIO_FROM_NUMBER ?? "",
        Body: body,
      });
      const resp = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      if (resp.ok) {
        const j = (await resp.json()) as { sid?: string };
        status = "sent";
        providerId = j.sid;
      } else status = "failed";
    } catch {
      status = "failed";
    }
  }
  saveSmsAlert({
    user_id: userId,
    company_id: "test",
    watchlist_id: null,
    event_type: "test",
    message_body: body,
    status,
    provider_message_id: providerId ?? null,
    error_message: status === "failed" ? "twilio_error" : null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
  return { status, providerId };
}
