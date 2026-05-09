"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Company } from "@/lib/map-config";
import { stableCompanyKey } from "@/lib/investor/companyIdentity";
import { loadRemoteAppState, patchRemoteAppState } from "@/hooks/userAppStateApi";

const LS_KEY = "startup-compass-investor-watchlist-v1";
const META_KEY = "startup-compass-investor-watchlist-meta-v1";
const SNAPSHOT_KEY = "startup-compass-investor-watchlist-snapshots-v1";

/** Lightweight metadata stored alongside each watchlist entry */
export interface WatchlistMeta {
  addedAt: string;
  lastSeenAt: string | null;
  /** Snapshot of key fields at time of adding — used for change detection */
  snapshot: WatchlistSnapshot;
}

/** Fields we track for change detection */
export interface WatchlistSnapshot {
  hiringStatus?: Company["hiringStatus"];
  stage: string;
  employees: string;
  sector: string;
}

/** A detected change between snapshot and current state */
export interface WatchlistChange {
  field: string;
  from: string;
  to: string;
}

function makeSnapshot(c: Company): WatchlistSnapshot {
  return {
    hiringStatus: c.hiringStatus,
    stage: c.stage,
    employees: c.employees,
    sector: c.sector,
  };
}

function detectChanges(
  snap: WatchlistSnapshot,
  current: Company,
): WatchlistChange[] {
  const changes: WatchlistChange[] = [];
  if (snap.stage !== current.stage) {
    changes.push({ field: "Stage", from: snap.stage, to: current.stage });
  }
  if (snap.employees !== current.employees) {
    changes.push({
      field: "Team size",
      from: snap.employees,
      to: current.employees,
    });
  }
  if (snap.hiringStatus !== current.hiringStatus && current.hiringStatus) {
    changes.push({
      field: "Hiring",
      from: snap.hiringStatus ?? "unknown",
      to: current.hiringStatus,
    });
  }
  return changes;
}

function loadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function saveMeta(meta: Record<string, WatchlistMeta>) {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore quota */
  }
}

function loadMeta(): Record<string, WatchlistMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, WatchlistMeta>) : {};
  } catch {
    return {};
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
  const { status } = useSession();
  const [ids, setIds] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, WatchlistMeta>>({});
  const [hydrated, setHydrated] = useState(false);
  const remotePushReady = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate watchlist from localStorage once */
    setIds(loadIds());
    setMeta(loadMeta());
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
      const d = remote.data;
      const hasServer =
        (d.investorWatchlistIds?.length ?? 0) > 0 ||
        Object.keys((d.investorWatchlistMeta as object) ?? {}).length > 0;
      if (hasServer) {
        setIds(d.investorWatchlistIds ?? []);
        setMeta((d.investorWatchlistMeta as Record<string, WatchlistMeta>) ?? {});
      } else {
        const localIds = loadIds();
        const localMeta = loadMeta();
        if (localIds.length > 0 || Object.keys(localMeta).length > 0) {
          await patchRemoteAppState({
            investorWatchlistIds: localIds,
            investorWatchlistMeta: localMeta as Record<string, unknown>,
          });
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
    saveIds(ids);
  }, [ids, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveMeta(meta);
  }, [meta, hydrated]);

  useEffect(() => {
    if (!hydrated || status !== "authenticated" || !remotePushReady.current) return;
    const t = window.setTimeout(() => {
      void (async () => {
        const remote = await loadRemoteAppState();
        if (remote.persistence !== "database") return;
        await patchRemoteAppState({
          investorWatchlistIds: ids,
          investorWatchlistMeta: meta as Record<string, unknown>,
        });
      })();
    }, 700);
    return () => window.clearTimeout(t);
  }, [ids, meta, hydrated, status]);

  const set = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback((company: Company) => {
    const key = stableCompanyKey(company);
    setIds((prev) => {
      if (prev.includes(key)) {
        // Remove from watchlist — also clean up meta
        setMeta((m) => {
          const next = { ...m };
          delete next[key];
          return next;
        });
        return prev.filter((id) => id !== key);
      }
      // Add to watchlist — store snapshot
      setMeta((m) => ({
        ...m,
        [key]: {
          addedAt: new Date().toISOString(),
          lastSeenAt: null,
          snapshot: makeSnapshot(company),
        },
      }));
      return [...prev, key];
    });
  }, []);

  const has = useCallback(
    (company: Company) => set.has(stableCompanyKey(company)),
    [set],
  );

  const clear = useCallback(() => {
    setIds([]);
    setMeta({});
  }, []);

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

  /** Returns detected changes for a watchlisted company vs. its stored snapshot */
  const getChanges = useCallback(
    (company: Company): WatchlistChange[] => {
      const key = stableCompanyKey(company);
      const m = meta[key];
      if (!m) return [];
      return detectChanges(m.snapshot, company);
    },
    [meta],
  );

  /** Returns the ISO date when a company was added to the watchlist */
  const getAddedAt = useCallback(
    (company: Company): string | null => {
      const key = stableCompanyKey(company);
      return meta[key]?.addedAt ?? null;
    },
    [meta],
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
    getChanges,
    getAddedAt,
    meta,
  };
}
