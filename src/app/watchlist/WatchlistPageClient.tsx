"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { AtlasHeader } from "@/components/AtlasPages";
import { COMPANIES } from "@/lib/map-config";
import type { WatchlistAlertCondition } from "@/lib/intelligence/types";

type Row = {
  id: string;
  company_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  alert_conditions_json: WatchlistAlertCondition[];
};

export function WatchlistPageClient() {
  const { status, data: session } = useSession();
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/watchlist");
    const j = await r.json();
    if (j.success) setRows(j.data);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  const patchRow = async (companyId: string, patch: Partial<Row>) => {
    await fetch("/api/watchlist/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, ...patch }),
    });
    void load();
  };

  const remove = async (companyId: string) => {
    await fetch(`/api/watchlist?companyId=${encodeURIComponent(companyId)}`, { method: "DELETE" });
    void load();
  };

  if (status === "loading") {
    return (
      <div className="atlas-page atlas-page-light">
        <AtlasHeader />
        <p className="p-8 text-ink-mute">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="atlas-page atlas-page-light">
        <AtlasHeader />
        <main className="mx-auto max-w-xl px-6 py-16">
          <h1 className="font-display text-2xl text-ink">Watchlist</h1>
          <p className="mt-2 text-ink-soft">Sign in to sync followed companies across devices.</p>
          <Link href="/login" className="mt-6 inline-flex atlas-btn atlas-btn-primary">
            Log in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl text-ink">Watchlist</h1>
        <p className="mt-2 text-ink-soft">
          Companies you follow for updates.{" "}
          <Link href="/briefs-alerts" className="text-ink underline">
            Briefs &amp; alerts
          </Link>
        </p>

        <ul className="mt-8 space-y-4">
          {rows.length === 0 && (
            <li className="text-[14px] text-ink-mute">
              No saved companies yet — open the{" "}
              <Link href="/search" className="text-ink underline">
                map
              </Link>{" "}
              and tap Follow.
            </li>
          )}
          {rows.map((row) => {
            const c = COMPANIES.find((x) => x.id === row.company_id);
            return (
              <li key={row.id} className="rounded-xl border border-rule bg-surface-elev p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-ink">{c?.name ?? row.company_id}</p>
                    <p className="text-[13px] text-ink-mute">
                      {c ? `${c.sector} · ${c.city} · ${c.stage}` : "Open map to load profile"}
                    </p>
                  </div>
                  <Link
                    href={`/search?c=${encodeURIComponent(row.company_id)}`}
                    className="text-[13px] text-ink underline"
                  >
                    View
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-ink-soft">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.email_enabled}
                      onChange={(e) => void patchRow(row.company_id, { email_enabled: e.target.checked })}
                    />
                    Email briefs
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.sms_enabled}
                      onChange={(e) => void patchRow(row.company_id, { sms_enabled: e.target.checked })}
                    />
                    SMS updates
                  </label>
                  <button
                    type="button"
                    className="text-ink underline"
                    onClick={() => void remove(row.company_id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
