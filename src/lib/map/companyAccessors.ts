import type { Company } from "@/lib/map-config";
import { normalizeDomain } from "@/lib/investor/verification";

export function getCompanyName(c: Company): string {
  return c.name?.trim() ?? "";
}

export function getCompanyWebsite(c: Company): string | null {
  const w = c.website?.trim();
  return w ? w : null;
}

export function getCompanyLinkedIn(c: Company): string | null {
  const v = c.linkedin?.trim();
  return v ? v : null;
}

export function getCompanySector(c: Company): string {
  return c.sector?.trim() ?? "";
}

export function getCompanyStage(c: Company): string {
  return c.stage?.trim() ?? "";
}

export function getCompanyEmployees(c: Company): string {
  return c.employees?.trim() ?? "";
}

export function getCompanyCity(c: Company): string {
  return c.city?.trim() ?? "";
}

export function getCompanyAddress(c: Company): string | null {
  const a = c.address?.trim();
  return a ? a : null;
}

export function getCompanyDescription(c: Company): string | null {
  const d = c.description?.trim();
  return d ? d : null;
}

export function getCompanyCoordinates(c: Company): { lat: number; lng: number } | null {
  if (typeof c.lat !== "number" || typeof c.lng !== "number") return null;
  if (Number.isNaN(c.lat) || Number.isNaN(c.lng)) return null;
  return { lat: c.lat, lng: c.lng };
}

/** Optional extended fields when dataset gains columns */
export function getCompanyYearFounded(c: Company): number | null {
  const ext = c as Company & { yearFounded?: number };
  const y = ext.yearFounded;
  return typeof y === "number" && y > 1800 ? y : null;
}

export function getCompanyLogoUrlField(c: Company): string | null {
  const ext = c as Company & { logo?: string | null };
  const v = ext.logo?.trim();
  return v ? v : null;
}

export function getWebsiteHostname(c: Company): string | null {
  return normalizeDomain(getCompanyWebsite(c));
}
