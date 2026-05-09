import { NextRequest, NextResponse } from "next/server";
import { getGmailDrafts } from "@/lib/agents/agentState";
import { GMAIL_CONNECTED, GMAIL_SEND_ENABLED } from "@/lib/agents/gmailAgent";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  const drafts = getGmailDrafts(userId);
  return NextResponse.json({
    success: true,
    data: drafts,
    demo: !GMAIL_CONNECTED,
    gmailConnected: GMAIL_CONNECTED,
    sendEnabled: GMAIL_SEND_ENABLED,
  });
}
