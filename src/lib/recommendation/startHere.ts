import type { AtlasResource } from "@/lib/atlas-data";

function startHereScore(r: AtlasResource): number {
  let s = 0;
  const blob = `${r.title} ${r.description}`.toLowerCase();
  if (r.locations.length >= 25) s += 8;
  else if (r.locations.length >= 10) s += 4;
  if (/sbdc|small business development|score|entrepreneur|founder|startup|goed|economic development|chamber/.test(blob)) {
    s += 6;
  }
  if (r.topics.some((t) => /start|launch|business|entrepreneur/i.test(t))) s += 4;
  return s;
}

/** Three broadly useful statewide or early-founder resources from the real dataset. */
export function pickUniversalStartHere(resources: readonly AtlasResource[]): AtlasResource[] {
  const ranked = [...resources].sort((a, b) => startHereScore(b) - startHereScore(a));
  const out: AtlasResource[] = [];
  const seen = new Set<number>();
  for (const r of ranked) {
    if (out.length >= 3) break;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}
