"use client";

import { readResponseJson } from "@/lib/client/readResponseJson";

export type RemoteAppState = {
  investorWatchlistIds: string[];
  investorWatchlistMeta: Record<string, unknown>;
  savedSearchesJson: unknown;
  userRole: string | null;
  digestSubscribed: boolean;
};

export async function loadRemoteAppState(): Promise<
  | { persistence: "database"; data: RemoteAppState }
  | { persistence: "memory"; data: RemoteAppState }
> {
  const r = await fetch("/api/user/app-state");
  const j = await readResponseJson(r, { success: false } as {
    success: boolean;
    persistence?: string;
    data?: RemoteAppState;
  });
  if (!j.success || !j.data) {
    return {
      persistence: "memory",
      data: {
        investorWatchlistIds: [],
        investorWatchlistMeta: {},
        savedSearchesJson: [],
        userRole: null,
        digestSubscribed: true,
      },
    };
  }
  if (j.persistence === "database") {
    return { persistence: "database", data: j.data };
  }
  return { persistence: "memory", data: j.data };
}

export async function patchRemoteAppState(patch: Partial<RemoteAppState>): Promise<boolean> {
  const r = await fetch("/api/user/app-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) return false;
  const j = await readResponseJson(r, { success: false } as { success: boolean });
  return Boolean(j.success);
}
