"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isCompanyEmailMatch,
  normalizeDomain,
} from "@/lib/investor/verification";

const LS_KEY = "startup-compass-company-claims-v1";

export type ClaimStatus =
  | "unclaimed"
  | "pending"
  | "verified"
  | "manual_review";

export interface CompanyClaimRecord {
  companyId: string;
  status: ClaimStatus;
  submittedAt: string;
  name: string;
  email: string;
  role: string;
  website: string;
  note?: string;
  domainMatch: boolean;
}

export interface SubmitClaimInput {
  companyId: string;
  companyWebsite: string | null;
  name: string;
  email: string;
  role: string;
  website: string;
  note?: string;
}

type Store = Record<string, CompanyClaimRecord>;

function loadStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function useCompanyClaims() {
  const [store, setStore] = useState<Store>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate claims from localStorage once */
    setStore(loadStore());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStore(store);
  }, [store, hydrated]);

  const getStatus = useCallback(
    (companyId: string): ClaimStatus => {
      const rec = store[companyId];
      return rec?.status ?? "unclaimed";
    },
    [store],
  );

  const submitClaim = useCallback((input: SubmitClaimInput) => {
      const domainMatch = isCompanyEmailMatch(
        input.email,
        input.companyWebsite ?? input.website,
      );
      const status: ClaimStatus = domainMatch ? "verified" : "manual_review";
      const rec: CompanyClaimRecord = {
        companyId: input.companyId,
        status,
        submittedAt: new Date().toISOString(),
        name: input.name.trim(),
        email: input.email.trim(),
        role: input.role.trim(),
        website: input.website.trim(),
        note: input.note?.trim(),
        domainMatch,
      };
      setStore((s) => ({ ...s, [input.companyId]: rec }));
      return rec;
    },
    [],
  );

  const badgeLabel = useCallback(
    (companyId: string): string => {
      const st = getStatus(companyId);
      switch (st) {
        case "verified":
          return "Verified";
        case "manual_review":
          return "Manual review";
        case "pending":
          return "Claim pending";
        default:
          return "Unclaimed";
      }
    },
    [getStatus],
  );

  return {
    hydrated,
    getStatus,
    submitClaim,
    badgeLabel,
    normalizeDomain,
  };
}
