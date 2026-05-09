import { NextRequest, NextResponse } from "next/server";
import { dispatchWatchlistSmsForEvent } from "@/lib/intelligence/changeDetection";
import { getCompanyById } from "@/lib/intelligence/companies";
import { getSessionUserId } from "@/lib/intelligence/session";
import { resetSmsDayLimit } from "@/lib/intelligence/store";

/** Deterministic demo: fires a hiring alert for watchers without mutating dataset snapshots. */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as { companyId?: string };
  const id = String(body.companyId ?? "");
  const c = getCompanyById(id);
  if (!c) {
    return NextResponse.json({ success: false, error: "Unknown company" }, { status: 400 });
  }
  resetSmsDayLimit(userId, c.id);
  await dispatchWatchlistSmsForEvent({
    companyId: c.id,
    companyName: c.name,
    eventType: "hiring_status_changed",
    summary: "Hiring signal updated (demo)",
  });
  return NextResponse.json({ success: true, data: { companyId: c.id } });
}
