import { NextRequest, NextResponse } from "next/server";
import { reloadIndex } from "@/lib/index";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const t0 = Date.now();
    const index = reloadIndex();
    const elapsed = Date.now() - t0;
    return NextResponse.json({
      ok: true,
      count: index.length,
      dim: index[0]?.embedding.length ?? 0,
      reloadedIn: `${elapsed}ms`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Reindex failed: ${message}` }, { status: 500 });
  }
}
