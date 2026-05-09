import type { Company } from "@/lib/map-config";

const EMP_RANK: string[] = [
  "1",
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1,000",
  "1,001-5,000",
  "5,001-10,000",
  "10,001+",
  "Unknown",
];

function empRank(e: string): number {
  const i = EMP_RANK.indexOf(e);
  return i === -1 ? 999 : i;
}

function tokenize(text: string | null): Set<string> {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return new Set(words);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function similarityScore(a: Company, b: Company): number {
  let s = 0;
  if (a.sector === b.sector) s += 32;
  if (a.stage === b.stage) s += 24;
  if (a.city === b.city) s += 18;
  const de = Math.abs(empRank(a.employees) - empRank(b.employees));
  s += Math.max(0, 14 - de * 2);
  s += jaccard(tokenize(a.description), tokenize(b.description)) * 22;
  return s;
}

export function findSimilarCompanies(
  company: Company,
  allCompanies: Company[],
  limit = 3,
): Company[] {
  return allCompanies
    .filter((c) => c.id !== company.id)
    .map((c) => ({ c, score: similarityScore(company, c) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.c);
}
