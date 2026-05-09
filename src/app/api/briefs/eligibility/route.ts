import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { briefEligibilityCounts, shouldOfferBriefCta } from "@/lib/intelligence/store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const counts = briefEligibilityCounts(userId);
  return NextResponse.json({
    success: true,
    data: {
      ...counts,
      showBriefCta: shouldOfferBriefCta(userId),
    },
  });
}
