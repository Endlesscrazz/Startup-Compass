import { NextResponse } from "next/server";
import { EMAIL_SEND_ENABLED, GMAIL_SEND_ENABLED } from "@/lib/intelligence/gmailDelivery";
import { getSessionUserId } from "@/lib/intelligence/session";
import { getGmailTokens } from "@/lib/intelligence/store";

export async function GET() {
  const userId = await getSessionUserId();
  const tokens = userId ? getGmailTokens(userId) : null;
  const hasCredentials = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const userConnected = Boolean(tokens?.refresh_token || tokens?.access_token);
  return NextResponse.json({
    success: true,
    data: {
      oauthConfigured: hasCredentials,
      userConnected,
      sendEnabled: EMAIL_SEND_ENABLED && GMAIL_SEND_ENABLED,
      mode:
        userConnected && EMAIL_SEND_ENABLED && GMAIL_SEND_ENABLED
          ? "send"
          : userConnected
            ? "connected_preview"
            : "demo",
      description:
        userConnected && EMAIL_SEND_ENABLED && GMAIL_SEND_ENABLED
          ? "Gmail linked for this account. Briefs can be delivered to your inbox when you choose Send."
          : userConnected
            ? "Gmail linked. Turn on EMAIL_SEND_ENABLED and GMAIL_SEND_ENABLED to deliver real messages."
            : hasCredentials
              ? "Connect Gmail to allow optional inbox delivery (scopes: gmail.send)."
              : "Demo mode: briefs are saved in-app until Google OAuth env vars are configured.",
    },
  });
}
