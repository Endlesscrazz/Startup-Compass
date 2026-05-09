export function normalizeDomain(urlOrHost: string | null | undefined): string | null {
  if (!urlOrHost?.trim()) return null;
  try {
    const u = urlOrHost.includes("://")
      ? new URL(urlOrHost)
      : new URL(`https://${urlOrHost}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    const cleaned = urlOrHost
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      ?.toLowerCase();
    return cleaned || null;
  }
}

export function emailDomain(email: string): string | null {
  const m = email.trim().toLowerCase().match(/@([^@]+)$/);
  return m?.[1]?.replace(/^www\./, "") ?? null;
}

/**
 * True when contact email domain matches company website host (best-effort).
 */
export function isCompanyEmailMatch(
  email: string,
  companyWebsite: string | null,
): boolean {
  const ed = emailDomain(email);
  const wd = normalizeDomain(companyWebsite);
  if (!ed || !wd) return false;
  return ed === wd || ed.endsWith(`.${wd}`) || wd.endsWith(`.${ed}`);
}
