import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import {
  addWatchlistRowResolved,
  getWatchlistRowResolved,
} from "@/lib/intelligence/persistence";
import type { WatchlistAlertCondition } from "@/lib/intelligence/types";

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as {
    companyId?: string;
    email_enabled?: boolean;
    sms_enabled?: boolean;
    alert_conditions_json?: WatchlistAlertCondition[];
  };
  const companyId = String(body.companyId ?? "");
  if (!companyId) {
    return NextResponse.json({ success: false, error: "companyId required" }, { status: 400 });
  }
  const existing = await getWatchlistRowResolved(userId, companyId);
  if (!existing) {
    await addWatchlistRowResolved({ user_id: userId, company_id: companyId });
  }
  const row = await addWatchlistRowResolved({
    user_id: userId,
    company_id: companyId,
    email_enabled: body.email_enabled,
    sms_enabled: body.sms_enabled,
    alert_conditions_json: body.alert_conditions_json,
  });
  return NextResponse.json({ success: true, data: row });
}
