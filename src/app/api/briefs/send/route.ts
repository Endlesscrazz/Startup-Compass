import { NextRequest, NextResponse } from "next/server";
import { createBriefRecord, deliverBriefToInbox } from "@/lib/intelligence/briefService";
import { getSessionUserId } from "@/lib/intelligence/session";
import type { BriefType } from "@/lib/intelligence/types";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      briefId?: string;
      companyIds?: string[];
      briefType?: BriefType;
      reason?: string;
    };
    let briefId = body.briefId;
    if (!briefId) {
      const created = await createBriefRecord({
        userId,
        companyIds: body.companyIds,
        briefType: body.briefType ?? "search_session",
        reason: body.reason ?? "Send brief",
      });
      briefId = created.briefId;
    }
    const delivery = await deliverBriefToInbox({ userId, briefId });
    return NextResponse.json({ success: true, data: { briefId, delivery } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg === "No companies to brief" || msg === "Brief not found" ? 400 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
