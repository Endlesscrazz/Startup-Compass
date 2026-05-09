import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import {
  clearUserActivity,
  clearUserInterestScores,
  upsertIntentProfile,
  upsertNotificationPreferences,
} from "@/lib/intelligence/store";
import type { UserIntentProfile } from "@/lib/intelligence/types";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as { clearActivity?: boolean; disablePersonalization?: boolean };
  if (body.clearActivity) {
    clearUserActivity(userId);
    clearUserInterestScores(userId);
    const t = new Date().toISOString();
    const blank: UserIntentProfile = {
      id: `uip-${userId}`,
      user_id: userId,
      audience_type: "unknown",
      sectors_json: [],
      locations_json: [],
      company_sizes_json: [],
      stages_json: [],
      hiring_interest: false,
      resource_interests_json: [],
      inferred_keywords_json: [],
      confidence_score: 0,
      updated_at: t,
    };
    upsertIntentProfile(blank);
  }
  if (body.disablePersonalization) {
    upsertNotificationPreferences(userId, { personalization_disabled: true });
  }
  return NextResponse.json({ success: true });
}
