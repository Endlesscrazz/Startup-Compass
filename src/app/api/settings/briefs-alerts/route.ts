import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { getNotificationPreferences, upsertNotificationPreferences } from "@/lib/intelligence/store";
import type { AudienceType, EmailFrequency, SmsMinPriority } from "@/lib/intelligence/types";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: getNotificationPreferences(userId) });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<{
    email_enabled: boolean;
    sms_enabled: boolean;
    email_frequency: EmailFrequency;
    sms_min_priority: SmsMinPriority;
    quiet_hours_json: { start: string; end: string; timezone?: string } | null;
    brief_audience_preference: AudienceType;
    personalization_disabled: boolean;
  }>;
  const prefs = upsertNotificationPreferences(userId, body);
  return NextResponse.json({ success: true, data: prefs });
}
