import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { upsertNotificationPreferencesResolved } from "@/lib/intelligence/persistence";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as {
    phone_number?: string | null;
    sms_verified?: boolean;
  };
  const prefs = await upsertNotificationPreferencesResolved(userId, {
    phone_number: body.phone_number ?? null,
    sms_verified: Boolean(body.sms_verified),
  });
  return NextResponse.json({ success: true, data: prefs });
}
