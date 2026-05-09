import {
  getCompanyLogoUrlField,
  getCompanyName,
  getWebsiteHostname,
} from "@/lib/map/companyAccessors";
import type { Company } from "@/lib/map-config";

function initialsFromName(name: string): string {
  const parts = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function getCompanyInitials(company: Company): string {
  return initialsFromName(getCompanyName(company));
}

/**
 * Prefer explicit logo URL from data; else favicon discovery via website hostname only.
 */
export function getCompanyLogoUrl(company: Company): string | null {
  const direct = getCompanyLogoUrlField(company);
  if (direct) return direct;
  const host = getWebsiteHostname(company);
  if (!host) return null;
  const sz = 64;
  return `https://www.google.com/s2/favicons?sz=${sz}&domain=${encodeURIComponent(host)}`;
}

export function getCompanyMarkerKey(company: Company): string {
  return company.id;
}
