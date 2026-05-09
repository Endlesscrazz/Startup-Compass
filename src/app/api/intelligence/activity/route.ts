import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { recordActivity } from "@/lib/intelligence/store";
import { onActivitySideEffects } from "@/lib/intelligence/intentEngine";
import type { ActivityEntityType, ActivityEventType } from "@/lib/intelligence/types";

const ALLOWED: ActivityEventType[] = [
  "search_performed",
  "filter_applied",
  "company_viewed",
  "company_followed",
  "company_unfollowed",
  "resource_clicked",
  "saved_search_created",
  "company_brief_requested",
  "email_brief_sent",
  "sms_alert_sent",
];

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      event_type?: string;
      entity_type?: string;
      entity_id?: string | null;
      metadata_json?: Record<string, unknown>;
    };
    const event_type = body.event_type as ActivityEventType;
    if (!ALLOWED.includes(event_type)) {
      return NextResponse.json({ success: false, error: "Invalid event_type" }, { status: 400 });
    }
    const row = recordActivity({
      user_id: userId,
      event_type,
      entity_type: (body.entity_type as ActivityEntityType) ?? "none",
      entity_id: body.entity_id ?? null,
      metadata_json: body.metadata_json ?? {},
    });
    onActivitySideEffects({
      userId,
      event_type,
      company_id: body.entity_id ?? null,
      metadata: body.metadata_json,
    });
    return NextResponse.json({ success: true, data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
