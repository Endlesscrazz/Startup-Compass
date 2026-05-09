import { NextRequest, NextResponse } from "next/server";
import { ingestCompanyForChangeDetection } from "@/lib/intelligence/changeDetection";
import { getCompanyById } from "@/lib/intelligence/companies";
import { getSessionUserId } from "@/lib/intelligence/session";

/**
 * Demo: simulate a profile/hiring change for a company to trigger SMS rules.
 * Body: { companyId, patch?: Partial<Company> } — merges patch onto dataset row in-memory for this request only.
 */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const body = (await req.json()) as { companyId?: string; hiringStatus?: string; stage?: string };
  const id = String(body.companyId ?? "");
  const base = getCompanyById(id);
  if (!base) {
    return NextResponse.json({ success: false, error: "Unknown company" }, { status: 400 });
  }
  const modified = {
    ...base,
    ...(body.hiringStatus ? { hiringStatus: body.hiringStatus as typeof base.hiringStatus } : {}),
    ...(body.stage ? { stage: body.stage } : {}),
  };
  const events = await ingestCompanyForChangeDetection(modified, "demo_simulation");
  return NextResponse.json({ success: true, data: { events } });
}
