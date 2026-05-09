"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/map-config";
import { stableCompanyKey } from "@/lib/investor/companyIdentity";

const LS_KEY = "startup-compass-investor-watchlist-v1";

function loadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveIds(ids: string[]) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

export function useInvestorWatchlist() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate watchlist from localStorage once */
    setIds(loadIds());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveIds(ids);
  }, [ids, hydrated]);

  const set = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback((company: Company) => {
    const key = stableCompanyKey(company);
    setIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
    );
  }, []);

  const has = useCallback(
    (company: Company) => set.has(stableCompanyKey(company)),
    [set],
  );

  const clear = useCallback(() => setIds([]), []);

  const resolveCompanies = useCallback(
    (all: Company[]): Company[] => {
      const out: Company[] = [];
      for (const c of all) {
        if (ids.includes(stableCompanyKey(c))) out.push(c);
      }
      return out;
    },
    [ids],
  );

  return {
    ids,
    count: ids.length,
    hydrated,
    toggle,
    has,
    clear,
    resolveCompanies,
    isInWatchlist: has,
  };
}
