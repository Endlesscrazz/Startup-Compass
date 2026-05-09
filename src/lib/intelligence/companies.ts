import type { Company } from "@/lib/map-config";
import { COMPANIES } from "@/lib/map-config";

export function getCompanyById(id: string): Company | null {
  return COMPANIES.find((c) => c.id === id) ?? null;
}

export function resolveCompanies(ids: string[]): Company[] {
  const set = new Set(ids);
  return COMPANIES.filter((c) => set.has(c.id));
}
