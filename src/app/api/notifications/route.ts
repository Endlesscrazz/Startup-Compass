import { NextRequest, NextResponse } from "next/server";
import { listAllNotifications, listUnreadNotifications } from "@/lib/agents/agentState";

export async function GET(req: NextRequest) {
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  const notifications = unreadOnly ? listUnreadNotifications() : listAllNotifications();
  return NextResponse.json({ success: true, data: notifications, demo: true });
}
