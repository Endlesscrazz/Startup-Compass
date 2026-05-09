import { NextRequest, NextResponse } from "next/server";
import { followCompany, unfollowCompany, getWatchlist } from "@/lib/agents/agentState";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  return NextResponse.json({ success: true, data: getWatchlist(userId), demo: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = String(body.companyId ?? "");
    const userId = String(body.userId ?? "demo-user");
    if (!companyId) return NextResponse.json({ success: false, error: "companyId required" }, { status: 400 });
    const entry = followCompany(companyId, userId);
    return NextResponse.json({ success: true, data: entry, demo: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  if (!companyId) return NextResponse.json({ success: false, error: "companyId required" }, { status: 400 });
  const ok = unfollowCompany(companyId, userId);
  return NextResponse.json({ success: ok });
}
