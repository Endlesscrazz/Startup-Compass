import type { Company } from "@/lib/map-config";
import { normalizeDomain } from "@/lib/investor/verification";

/** Prefer stable dataset id; fallback when missing */
export function stableCompanyKey(company: Company): string {
  if (company.id?.trim()) return company.id;
  const dom = normalizeDomain(company.website);
  const slug = company.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return dom ? `${slug}|${dom}` : slug || "unknown";
}
