import { NextResponse } from "next/server";
import { SMS_SEND_ENABLED, TWILIO_CONFIGURED } from "@/lib/intelligence/smsDelivery";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      configured: TWILIO_CONFIGURED,
      sendEnabled: SMS_SEND_ENABLED,
      mode: TWILIO_CONFIGURED ? (SMS_SEND_ENABLED ? "send" : "simulate") : "demo",
      description: TWILIO_CONFIGURED
        ? SMS_SEND_ENABLED
          ? "Twilio connected. SMS can be sent automatically."
          : "Twilio connected. Simulating only (SMS_SEND_ENABLED=false)."
        : "Demo mode. SMS messages are simulated in-app. Set TWILIO_* env variables to enable real SMS.",
    },
  });
}
