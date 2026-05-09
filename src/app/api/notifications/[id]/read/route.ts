import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/agents/agentState";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_req: Request, { params }: Params) {
  const { id } = await params;
  const updated = markNotificationRead(id);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updated, demo: true });
}
