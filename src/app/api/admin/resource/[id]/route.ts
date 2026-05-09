import { NextRequest, NextResponse } from "next/server";
import { updateInIndex, deleteFromIndex, getIndex } from "@/lib/index";
import type { Resource } from "@/lib/index";
import { embedText } from "@/lib/embed";
import { checkAdminAuth, buildResourceText } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: Partial<Resource>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }
  if (!body.locations?.length) {
    return NextResponse.json({ error: "at least one location is required" }, { status: 400 });
  }

  // Re-embed only if description or title or taxonomy changed
  const current = getIndex().find((e) => e.id === id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Partial<Resource> = {
    title: body.title.trim(),
    description: body.description.trim(),
    link: body.link?.trim() || null,
    email: body.email?.trim() || null,
    topics: body.topics ?? [],
    communities: body.communities ?? [],
    industries: body.industries ?? [],
    locations: body.locations,
  };

  const needsReEmbed =
    updates.title !== current.title ||
    updates.description !== current.description ||
    JSON.stringify(updates.topics) !== JSON.stringify(current.topics) ||
    JSON.stringify(updates.industries) !== JSON.stringify(current.industries) ||
    JSON.stringify(updates.communities) !== JSON.stringify(current.communities);

  let embedding: Float32Array | undefined;
  if (needsReEmbed) {
    const textToEmbed = buildResourceText({
      title: updates.title!,
      description: updates.description!,
      topics: updates.topics!,
      industries: updates.industries!,
      communities: updates.communities!,
    });
    embedding = await embedText(textToEmbed);
  }

  const entry = updateInIndex(id, updates, embedding);
  const { embedding: _, ...result } = entry;
  return NextResponse.json({ ok: true, resource: result, reEmbedded: needsReEmbed });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    deleteFromIndex(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
