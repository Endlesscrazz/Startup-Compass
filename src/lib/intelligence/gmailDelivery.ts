import { getGmailTokens, setGmailTokens } from "@/lib/intelligence/store";
import type { GmailTokenRecord } from "@/lib/intelligence/types";

export const EMAIL_SEND_ENABLED = process.env.EMAIL_SEND_ENABLED === "true";
export const GMAIL_SEND_ENABLED = process.env.GMAIL_SEND_ENABLED === "true";

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildRawRfc822(to: string, subject: string, html: string): string {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ];
  return base64UrlEncode(Buffer.from(lines.join("\r\n"), "utf8"));
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!r.ok) return null;
  return (await r.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}

async function ensureAccess(userId: string): Promise<string | null> {
  const rec = getGmailTokens(userId);
  if (!rec?.refresh_token && !rec?.access_token) return null;
  const now = Date.now() / 1000;
  if (rec.access_token && rec.expires_at > now + 60) return rec.access_token;
  if (!rec.refresh_token) return null;
  const tok = await refreshAccessToken(rec.refresh_token);
  if (!tok?.access_token) return null;
  const next: GmailTokenRecord = {
    ...rec,
    access_token: tok.access_token,
    expires_at: now + (tok.expires_in ?? 3600),
    refresh_token: tok.refresh_token ?? rec.refresh_token,
    updated_at: new Date().toISOString(),
  };
  setGmailTokens(userId, next);
  return next.access_token;
}

/**
 * Sends email via Gmail API when tokens exist and both EMAIL_SEND_ENABLED and GMAIL_SEND_ENABLED are true.
 */
export async function sendBriefEmail(params: {
  userId: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; mode: "sent" | "skipped" | "failed"; messageId?: string; error?: string }> {
  if (!EMAIL_SEND_ENABLED || !GMAIL_SEND_ENABLED) {
    return { ok: false, mode: "skipped" };
  }
  const access = await ensureAccess(params.userId);
  if (!access) {
    return { ok: false, mode: "skipped", error: "no_gmail_token" };
  }
  const raw = buildRawRfc822(params.to, params.subject, params.html);
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!r.ok) {
    const err = await r.text();
    return { ok: false, mode: "failed", error: err.slice(0, 200) };
  }
  const j = (await r.json()) as { id?: string };
  return { ok: true, mode: "sent", messageId: j.id };
}
