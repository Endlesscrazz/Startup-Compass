import { NextRequest, NextResponse } from "next/server";
import { sendOrSimulateSms, SMS_SEND_ENABLED, TWILIO_CONFIGURED } from "@/lib/agents/smsAgent";
import type { SimulatedSms } from "@/lib/agents/agentState";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await sendOrSimulateSms({
      userId: body.userId ?? "demo-user",
      to: body.to ?? "+1-555-0100 (demo)",
      body: String(body.body ?? ""),
      messageType: (body.messageType ?? "company_alert") as SimulatedSms["messageType"],
      linkedEntityId: body.linkedEntityId,
    });
    return NextResponse.json({
      success: true,
      data: result,
      demo: result.mode === "simulated",
      smsEnabled: SMS_SEND_ENABLED,
      twilioConfigured: TWILIO_CONFIGURED,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
