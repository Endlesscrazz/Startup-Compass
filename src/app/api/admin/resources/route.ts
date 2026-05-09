import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/index";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const idParam = searchParams.get("id");

  const index = getIndex();

  if (idParam) {
    const id = parseInt(idParam, 10);
    const entry = index.find((e) => e.id === id);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { embedding: _, ...resource } = entry;
    return NextResponse.json(resource);
  }

  const resources = index
    .filter((e) => !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
    .map(({ embedding: _, ...r }) => r)
    .sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({ resources, total: index.length });
}
