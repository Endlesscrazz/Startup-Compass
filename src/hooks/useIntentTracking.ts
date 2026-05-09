"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import type { Company, Filters } from "@/lib/map-config";

export function useIntentTracking(
  filters: Filters,
  focusedCompany: Company | null,
  visibleCompanyIds: string[],
) {
  const { status } = useSession();
  const searchRef = useRef("");
  const filterKeyRef = useRef("");
  const lastViewedRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const q = filters.search.trim();
    if (!q || q === searchRef.current) return;
    searchRef.current = q;
    const t = window.setTimeout(() => {
      void fetch("/api/intelligence/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "search_performed",
          entity_type: "search",
          entity_id: null,
          metadata_json: { query: q },
        }),
      });
    }, 650);
    return () => window.clearTimeout(t);
  }, [filters.search, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const key = JSON.stringify({
      sectors: [...filters.sectors].sort(),
      stages: [...filters.stages].sort(),
      cities: [...filters.cities].sort(),
      employees: [...filters.employees].sort(),
      search: filters.search,
      hiringOnly: filters.hiringOnly,
      remoteOnly: filters.remoteOnly,
    });
    if (key === filterKeyRef.current) return;
    filterKeyRef.current = key;
    const t = window.setTimeout(() => {
      void fetch("/api/intelligence/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "filter_applied",
          entity_type: "filter",
          entity_id: null,
          metadata_json: {
            matchingCompanyIds: visibleCompanyIds.slice(0, 16),
            hiringOnly: filters.hiringOnly,
          },
        }),
      });
    }, 900);
    return () => window.clearTimeout(t);
  }, [filters, visibleCompanyIds, status]);

  useEffect(() => {
    if (status !== "authenticated" || !focusedCompany) return;
    if (lastViewedRef.current === focusedCompany.id) return;
    lastViewedRef.current = focusedCompany.id;
    void fetch("/api/intelligence/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "company_viewed",
        entity_type: "company",
        entity_id: focusedCompany.id,
        metadata_json: {
          sector: focusedCompany.sector,
          city: focusedCompany.city,
          stage: focusedCompany.stage,
          employees: focusedCompany.employees,
        },
      }),
    });
  }, [focusedCompany, status]);
}
