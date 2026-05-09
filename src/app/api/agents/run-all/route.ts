import { NextRequest, NextResponse } from "next/server";
import { runAllAgents } from "@/lib/agents/runner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runAllAgents({
      mode: body.mode === "production" ? "production" : "demo",
      personaId: body.personaId,
      userId: body.userId ?? "demo-user",
    });
    const status = result.success ? 200 : result.partial ? 207 : 500;
    return NextResponse.json(
      { success: result.success, data: result, demo: result.demo },
      { status },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, data: null, demo: true, error: message },
      { status: 500 },
    );
  }
}
