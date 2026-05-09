import { NextRequest, NextResponse } from "next/server";
import { getSimulatedSms } from "@/lib/agents/agentState";
import { SMS_SEND_ENABLED, TWILIO_CONFIGURED } from "@/lib/agents/smsAgent";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  return NextResponse.json({
    success: true,
    data: getSimulatedSms(userId),
    demo: !TWILIO_CONFIGURED,
    smsEnabled: SMS_SEND_ENABLED,
    twilioConfigured: TWILIO_CONFIGURED,
  });
}
