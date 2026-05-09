import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { listEmailBriefs } from "@/lib/intelligence/store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  const items = listEmailBriefs(userId, 40);
  return NextResponse.json({ success: true, data: items });
}
