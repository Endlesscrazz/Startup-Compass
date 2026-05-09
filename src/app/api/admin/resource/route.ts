import { NextRequest, NextResponse } from "next/server";
import { getNextId, addToIndex } from "@/lib/index";
import type { Resource } from "@/lib/index";
import { embedText } from "@/lib/embed";
import { checkAdminAuth, buildResourceText } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const resource: Resource = {
    id: getNextId(),
    title: body.title.trim(),
    description: body.description.trim(),
    link: body.link?.trim() || null,
    email: body.email?.trim() || null,
    topics: body.topics ?? [],
    communities: body.communities ?? [],
    industries: body.industries ?? [],
    locations: body.locations,
  };

  const embedText_ = buildResourceText(resource);
  const embedding = await embedText(embedText_);
  const entry = addToIndex(resource, embedding);

  const { embedding: _, ...result } = entry;
  return NextResponse.json({ ok: true, resource: result }, { status: 201 });
}
