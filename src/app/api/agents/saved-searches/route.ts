import { NextRequest, NextResponse } from "next/server";
import { createSavedSearch, getSavedSearches } from "@/lib/agents/store";

export async function GET() {
  const searches = getSavedSearches();
  return NextResponse.json({
    success: true,
    data: searches,
    demo: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = createSavedSearch({
      name: String(body.name ?? "Untitled search"),
      audienceType: String(body.audienceType ?? "general"),
      criteria: (body.criteria ?? {}) as Record<string, unknown>,
      enabled: body.enabled !== false,
      frequency: body.frequency === "weekly" ? "weekly" : "daily",
      userId: body.userId ?? "demo-user",
      lastCheckedAt: body.lastCheckedAt,
    });
    return NextResponse.json({ success: true, data: created, demo: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, data: null, demo: true, error: message },
      { status: 500 },
    );
  }
}
