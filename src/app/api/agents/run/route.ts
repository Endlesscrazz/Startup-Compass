import { NextRequest, NextResponse } from "next/server";
import { runSingleAgent } from "@/lib/agents/runner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "");
    if (!name) {
      return NextResponse.json(
        { success: false, data: null, demo: true, error: "name is required" },
        { status: 400 },
      );
    }
    const result = await runSingleAgent(name, {
      mode: body.mode === "production" ? "production" : "demo",
      personaId: body.personaId,
      userId: body.userId ?? "demo-user",
    });
    return NextResponse.json({
      success: result.success,
      data: result,
      demo: result.demo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, data: null, demo: true, error: message },
      { status: 500 },
    );
  }
}
