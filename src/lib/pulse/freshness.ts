import type { FreshnessStatus } from "@/lib/recommendation/types";

export function freshnessFromIso(iso: string | null | undefined): FreshnessStatus {
  if (!iso) return "unknown";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "unknown";
  const days = (Date.now() - t) / 86400000;
  if (days <= 30) return "fresh";
  if (days <= 90) return "aging";
  return "stale";
}

export function freshnessLabel(status: FreshnessStatus): string {
  switch (status) {
    case "fresh":
      return "Recently updated";
    case "aging":
      return "May need verification";
    case "stale":
      return "May be stale";
    default:
      return "Unknown freshness";
  }
}
