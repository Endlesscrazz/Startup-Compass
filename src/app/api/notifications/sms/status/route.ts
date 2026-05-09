import { NextResponse } from "next/server";
import { SMS_SEND_ENABLED, TWILIO_CONFIGURED } from "@/lib/intelligence/smsDelivery";
import { getSessionUserId } from "@/lib/intelligence/session";
import { getNotificationPreferencesResolved } from "@/lib/intelligence/persistence";

export async function GET() {
  const userId = await getSessionUserId();
  const prefs = userId ? await getNotificationPreferencesResolved(userId) : null;
  return NextResponse.json({
    success: true,
    data: {
      twilioConfigured: TWILIO_CONFIGURED,
      sendEnabled: SMS_SEND_ENABLED,
      canSendReal: SMS_SEND_ENABLED && TWILIO_CONFIGURED,
      userSmsEnabled: prefs?.sms_enabled ?? false,
      phoneOnFile: Boolean(prefs?.phone_number),
    },
  });
}
