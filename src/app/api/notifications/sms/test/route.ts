import { NextRequest, NextResponse } from "next/server";
import { sendTestSms } from "@/lib/intelligence/smsDelivery";
import { getSessionUserId } from "@/lib/intelligence/session";
import { getNotificationPreferencesResolved } from "@/lib/intelligence/persistence";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as { to?: string };
  const prefs = await getNotificationPreferencesResolved(userId);
  const to = body.to ?? prefs.phone_number;
  if (!to) {
    return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 });
  }
  const r = await sendTestSms(
    userId,
    to,
    "Startup Compass: SMS test. Alerts for watched companies will look like this when enabled.",
  );
  return NextResponse.json({ success: true, data: r });
}
