import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/agents/runner";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  return NextResponse.json({ success: true, data: getStats(userId), demo: true });
}
