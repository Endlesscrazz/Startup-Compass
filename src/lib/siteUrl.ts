/**
 * Public site origin for deep links (SMS, email, agents, metadata).
 * Set `NEXT_PUBLIC_APP_URL` on Vercel to your **stable** Production domain
 * (Project → Settings → Domains), not a one-off deployment URL.
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://startup-compass-one.vercel.app";
}
