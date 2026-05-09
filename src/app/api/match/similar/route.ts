import { NextRequest, NextResponse } from "next/server";
import { getIndex } from "@/lib/index";
import { resolveCounty } from "@/lib/counties";

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

const STATEWIDE_MIN_LOCATIONS = 20;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.resourceId !== "number" || typeof body.city !== "string") {
    return NextResponse.json({ error: "resourceId (number) and city (string) required" }, { status: 400 });
  }

  const county = resolveCounty(body.city);
  if (!county) {
    return NextResponse.json({ error: "Could not resolve county from city" }, { status: 422 });
  }

  const index = getIndex();
  const source = index.find((e) => e.id === body.resourceId);
  if (!source) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const results = index
    .filter((e) => {
      if (e.id === body.resourceId) return false;
      const locs = e.locations;
      return (
        locs.includes(county) ||
        locs.includes("Utah") ||
        locs.length >= STATEWIDE_MIN_LOCATIONS
      );
    })
    .map((e) => ({ entry: e, score: cosineSim(source.embedding, e.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ entry, score }) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      explanation: entry.description.split(/\s+/).slice(0, 25).join(" ") +
        (entry.description.split(/\s+/).length > 25 ? "…" : ""),
      link: entry.link,
      email: entry.email,
      topics: entry.topics,
      communities: entry.communities,
      industries: entry.industries,
      locations: entry.locations,
      score,
    }));

  return NextResponse.json({
    results,
    sourceTitle: source.title,
    county,
  });
}
