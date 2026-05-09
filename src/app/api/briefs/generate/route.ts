import { NextRequest, NextResponse } from "next/server";
import { createBriefRecord } from "@/lib/intelligence/briefService";
import { getSessionUserId } from "@/lib/intelligence/session";
import type { BriefType } from "@/lib/intelligence/types";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      companyIds?: string[];
      briefType?: BriefType;
      reason?: string;
    };
    const data = await createBriefRecord({
      userId,
      companyIds: body.companyIds,
      briefType: body.briefType ?? "search_session",
      reason: body.reason ?? "Generated brief",
    });
    return NextResponse.json({
      success: true,
      data: {
        briefId: data.briefId,
        subject: data.subject,
        previewText: data.previewText,
        html: data.html,
        demo: data.demo,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg === "No companies to brief" ? 400 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
