import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { onActivitySideEffects } from "@/lib/intelligence/intentEngine";
import {
  addWatchlistRowResolved,
  getNotificationPreferencesResolved,
  getWatchlistRowsResolved,
  removeWatchlistRowResolved,
  syncWatchlistIdsResolved,
} from "@/lib/intelligence/persistence";
import { recordActivity } from "@/lib/intelligence/store";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    }
    const data = await getWatchlistRowsResolved(userId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[watchlist GET]", e);
    return NextResponse.json(
      { success: false, error: "Could not load watchlist. Check DATABASE_URL if using Postgres." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as {
    companyId?: string;
    email_enabled?: boolean;
    sms_enabled?: boolean;
  };
  const companyId = String(body.companyId ?? "");
  if (!companyId) {
    return NextResponse.json({ success: false, error: "companyId required" }, { status: 400 });
  }
  const defaults = await getNotificationPreferencesResolved(userId);
  const row = await addWatchlistRowResolved({
    user_id: userId,
    company_id: companyId,
    email_enabled: body.email_enabled ?? defaults.email_enabled,
    sms_enabled: body.sms_enabled ?? defaults.sms_enabled,
  });
  recordActivity({
    user_id: userId,
    event_type: "company_followed",
    entity_type: "company",
    entity_id: companyId,
    metadata_json: {},
  });
  onActivitySideEffects({
    userId,
    event_type: "company_followed",
    company_id: companyId,
  });
  return NextResponse.json({ success: true, data: row });
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as { companyIds?: string[] };
  const ids = Array.isArray(body.companyIds) ? body.companyIds.map(String) : [];
  const data = await syncWatchlistIdsResolved(userId, ids);
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ success: false, error: "companyId required" }, { status: 400 });
  }
  await removeWatchlistRowResolved(userId, companyId);
  recordActivity({
    user_id: userId,
    event_type: "company_unfollowed",
    entity_type: "company",
    entity_id: companyId,
    metadata_json: {},
  });
  return NextResponse.json({ success: true });
}
