import { NextRequest, NextResponse } from "next/server";
import { createRule, getRules, updateRule, deleteRule } from "@/lib/agents/agentState";
import type { AgentRule } from "@/lib/agents/agentState";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") ?? "demo-user";
  return NextResponse.json({ success: true, data: getRules(userId), demo: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rule = createRule({
      userId: body.userId ?? "demo-user",
      name: String(body.name ?? "Untitled rule"),
      description: String(body.description ?? ""),
      entityScope: body.entityScope ?? "companies",
      triggerType: body.triggerType ?? "new_match",
      conditions: body.conditions ?? {},
      actions: body.actions ?? ["in_app_notification"],
      channels: body.channels ?? ["in_app"],
      priority: body.priority ?? "medium",
      enabled: body.enabled !== false,
    } as Omit<AgentRule, "id" | "createdAt" | "updatedAt">);
    return NextResponse.json({ success: true, data: rule, demo: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateRule(String(body.id), body);
    if (!updated) return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated, demo: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
  const ok = deleteRule(id);
  return NextResponse.json({ success: ok });
}
