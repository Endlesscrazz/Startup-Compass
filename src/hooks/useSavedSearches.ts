"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Filters } from "@/lib/map-config";
import { loadRemoteAppState, patchRemoteAppState } from "@/hooks/userAppStateApi";

const LS_KEY = "sc-saved-searches-v1";

export interface SavedSearch {
  id: string;
  label: string;
  /** Serialisable snapshot of Filters (Sets → arrays) */
  snapshot: SavedSearchSnapshot;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Serialisable version of Filters (Set → array) */
export interface SavedSearchSnapshot {
  search: string;
  sectors: string[];
  stages: string[];
  employees: string[];
  cities: string[];
  hiringOnly?: boolean;
  remoteOnly?: boolean;
  universityConnected?: boolean;
  founderNeedsTags?: string[];
  claimedOnly?: boolean;
  minCompletenessScore?: number;
  recentlyUpdatedDays?: number;
}

function filtersToSnapshot(f: Filters): SavedSearchSnapshot {
  return {
    search: f.search,
    sectors: [...f.sectors],
    stages: [...f.stages],
    employees: [...f.employees],
    cities: [...f.cities],
    hiringOnly: f.hiringOnly,
    remoteOnly: f.remoteOnly,
    universityConnected: f.universityConnected,
    founderNeedsTags: f.founderNeedsTags,
    claimedOnly: f.claimedOnly,
    minCompletenessScore: f.minCompletenessScore,
    recentlyUpdatedDays: f.recentlyUpdatedDays,
  };
}

export function snapshotToFilters(s: SavedSearchSnapshot): Filters {
  return {
    search: s.search,
    sectors: new Set(s.sectors),
    stages: new Set(s.stages),
    employees: new Set(s.employees),
    cities: new Set(s.cities),
    hiringOnly: s.hiringOnly,
    remoteOnly: s.remoteOnly,
    universityConnected: s.universityConnected,
    founderNeedsTags: s.founderNeedsTags,
    claimedOnly: s.claimedOnly,
    minCompletenessScore: s.minCompletenessScore,
    recentlyUpdatedDays: s.recentlyUpdatedDays,
    geoFilter: undefined, // geo filters are ephemeral — not saved
  };
}

function load(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function persist(searches: SavedSearch[]) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(searches));
  } catch {
    /* ignore quota */
  }
}

function generateId(): string {
  return `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseSearchesFromRemote(raw: unknown): SavedSearch[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is SavedSearch =>
      Boolean(x) &&
      typeof x === "object" &&
      typeof (x as SavedSearch).id === "string" &&
      typeof (x as SavedSearch).label === "string",
  );
}

/** Returns a short auto-label summarising active filters */
export function autoLabel(filters: Filters): string {
  const parts: string[] = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.sectors.size > 0) parts.push([...filters.sectors].join(", "));
  if (filters.stages.size > 0) parts.push([...filters.stages].join(", "));
  if (filters.hiringOnly) parts.push("Hiring Now");
  if (filters.remoteOnly) parts.push("Remote");
  if (filters.universityConnected) parts.push("University");
  if (filters.cities.size > 0) parts.push([...filters.cities].join(", "));
  return parts.length > 0 ? parts.slice(0, 3).join(" · ") : "All companies";
}

export function useSavedSearches() {
  const { status } = useSession();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const remotePushReady = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSearches(load());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated || status !== "authenticated") {
      remotePushReady.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      const remote = await loadRemoteAppState();
      if (cancelled || remote.persistence !== "database") {
        remotePushReady.current = remote.persistence === "database";
        return;
      }
      const parsed = parseSearchesFromRemote(remote.data.savedSearchesJson);
      if (parsed.length > 0) {
        setSearches(parsed);
      } else {
        const local = load();
        if (local.length > 0) {
          await patchRemoteAppState({ savedSearchesJson: local });
        }
      }
      remotePushReady.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, status]);

  useEffect(() => {
    if (!hydrated) return;
    persist(searches);
  }, [searches, hydrated]);

  useEffect(() => {
    if (!hydrated || status !== "authenticated" || !remotePushReady.current) return;
    const t = window.setTimeout(() => {
      void (async () => {
        const remote = await loadRemoteAppState();
        if (remote.persistence !== "database") return;
        await patchRemoteAppState({ savedSearchesJson: searches });
      })();
    }, 700);
    return () => window.clearTimeout(t);
  }, [searches, hydrated, status]);

  const saveSearch = useCallback((label: string, filters: Filters) => {
    const entry: SavedSearch = {
      id: generateId(),
      label: label.trim() || autoLabel(filters),
      snapshot: filtersToSnapshot(filters),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    setSearches((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const deleteSearch = useCallback((id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const touchSearch = useCallback((id: string) => {
    setSearches((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, lastUsedAt: new Date().toISOString() } : s,
      ),
    );
  }, []);

  /** Returns the restored Filters object for a saved search */
  const resolveFilters = useCallback(
    (id: string): Filters | null => {
      const s = searches.find((x) => x.id === id);
      if (!s) return null;
      touchSearch(id);
      return snapshotToFilters(s.snapshot);
    },
    [searches, touchSearch],
  );

  /** True if the current filters match an existing saved search */
  const isSaved = useCallback(
    (filters: Filters): boolean => {
      const snap = JSON.stringify(filtersToSnapshot(filters));
      return searches.some((s) => JSON.stringify(s.snapshot) === snap);
    },
    [searches],
  );

  return {
    searches,
    hydrated,
    saveSearch,
    deleteSearch,
    resolveFilters,
    isSaved,
    count: searches.length,
  };
}
