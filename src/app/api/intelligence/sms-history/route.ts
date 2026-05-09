import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { listSmsAlerts } from "@/lib/intelligence/store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: listSmsAlerts(userId, 40) });
}
