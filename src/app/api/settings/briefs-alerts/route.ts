import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import {
  getNotificationPreferencesResolved,
  upsertNotificationPreferencesResolved,
} from "@/lib/intelligence/persistence";
import type { AudienceType, EmailFrequency, SmsMinPriority } from "@/lib/intelligence/types";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    }
    const data = await getNotificationPreferencesResolved(userId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[briefs-alerts GET]", e);
    return NextResponse.json(
      { success: false, error: "Could not load notification settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    }
    let body: Partial<{
      email_enabled: boolean;
      sms_enabled: boolean;
      email_frequency: EmailFrequency;
      sms_min_priority: SmsMinPriority;
      quiet_hours_json: { start: string; end: string; timezone?: string } | null;
      brief_audience_preference: AudienceType;
      personalization_disabled: boolean;
    }>;
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const prefs = await upsertNotificationPreferencesResolved(userId, body);
    return NextResponse.json({ success: true, data: prefs });
  } catch (e) {
    console.error("[briefs-alerts PATCH]", e);
    return NextResponse.json(
      { success: false, error: "Could not save notification settings." },
      { status: 500 },
    );
  }
}
