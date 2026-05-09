import { NextRequest, NextResponse } from "next/server";
import { getGmailTokens, setGmailTokens, takeGmailOAuthState } from "@/lib/intelligence/store";
import type { GmailTokenRecord } from "@/lib/intelligence/types";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(`${APP}/briefs-alerts?gmail=error&message=${encodeURIComponent(err)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${APP}/briefs-alerts?gmail=error&message=missing_code`);
  }
  const userId = takeGmailOAuthState(state);
  if (!userId) {
    return NextResponse.redirect(`${APP}/briefs-alerts?gmail=error&message=invalid_state`);
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${APP}/briefs-alerts?gmail=error&message=server_config`);
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokRes.ok) {
    return NextResponse.redirect(`${APP}/briefs-alerts?gmail=error&message=token_exchange`);
  }
  const tok = (await tokRes.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
  };
  const prev = getGmailTokens(userId);
  const rec: GmailTokenRecord = {
    user_id: userId,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? prev?.refresh_token ?? null,
    expires_at: Date.now() / 1000 + (tok.expires_in ?? 3600),
    scope: tok.scope ?? "",
    updated_at: new Date().toISOString(),
  };
  setGmailTokens(userId, rec);
  return NextResponse.redirect(`${APP}/briefs-alerts?gmail=connected`);
}
