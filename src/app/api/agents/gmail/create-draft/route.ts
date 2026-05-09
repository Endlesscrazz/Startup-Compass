import { NextRequest, NextResponse } from "next/server";
import { createDraft, GMAIL_CONNECTED, GMAIL_SEND_ENABLED } from "@/lib/agents/gmailAgent";
import type { GmailDraft } from "@/lib/agents/agentState";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const draft = await createDraft({
      userId: body.userId ?? "demo-user",
      subject: String(body.subject ?? ""),
      body: String(body.body ?? ""),
      to: body.to,
      draftType: (body.draftType ?? "company_alert") as GmailDraft["draftType"],
      linkedEntityId: body.linkedEntityId,
      linkedRuleId: body.linkedRuleId,
    });
    return NextResponse.json({
      success: true,
      data: draft,
      demo: !GMAIL_CONNECTED,
      gmailConnected: GMAIL_CONNECTED,
      sendEnabled: GMAIL_SEND_ENABLED,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
