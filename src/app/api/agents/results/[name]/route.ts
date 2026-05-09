import { NextRequest, NextResponse } from "next/server";
import { getResult } from "@/lib/agents/runner";

type Params = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { name } = await params;
  const result = getResult(name);
  if (!result) {
    return NextResponse.json(
      { success: false, data: null, demo: true, error: "No result found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, data: result, demo: result.demo });
}
