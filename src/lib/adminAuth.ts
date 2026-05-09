import { NextRequest } from "next/server";

export function checkAdminAuth(req: NextRequest): boolean {
  const secret = req.headers.get("authorization");
  return Boolean(process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET);
}

/** Replicates scripts/generate_embeddings.py build_resource_text */
export function buildResourceText(resource: {
  title: string;
  description: string;
  topics: string[];
  industries: string[];
  communities: string[];
}): string {
  const parts = [resource.title, resource.description];
  if (resource.topics.length) parts.push("Topics: " + resource.topics.join(", "));
  if (resource.industries.length) parts.push("Industries: " + resource.industries.join(", "));
  if (resource.communities.length) parts.push("Communities: " + resource.communities.join(", "));
  return parts.join(" | ");
}
