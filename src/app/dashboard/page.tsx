"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AtlasHeader } from "@/components/AtlasPages";
import { AuthStatus } from "@/components/AuthStatus";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useInvestorWatchlist } from "@/hooks/useInvestorWatchlist";
import { COMPANIES } from "@/lib/map-config";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { searches, deleteSearch } = useSavedSearches();
  const { resolveCompanies, toggle } = useInvestorWatchlist();
  const [digestSubscribed, setDigestSubscribed] = useState(true);
  
  const trackedCompanies = resolveCompanies(COMPANIES);

  // If not authenticated, prompt login
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-6">
        <h1 className="font-display text-2xl font-bold mb-4 text-ink">Sign in to view your dashboard</h1>
        <Link href="/login" className="rounded-full border-2 border-gold bg-utah-blue px-6 py-2 font-medium text-white hover:bg-utah-blue-hover">Log in</Link>
      </div>
    );
  }

  return (
    <div className="atlas-page atlas-page-light min-h-screen">
      <AtlasHeader />

      <main className="w-full max-w-[1000px] mx-auto px-5 py-10 grid gap-10 md:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-[28px] font-bold text-ink">Welcome back, {session?.user?.name}</h1>
            <p className="text-[14px] text-ink-mute mt-1">Manage your alerts, watchlists, and saved searches.</p>
          </div>

          <section className="rounded-2xl border border-rule bg-surface p-6 shadow-sm">
            <h2 className="font-display text-[20px] font-semibold text-ink mb-4">Saved Searches</h2>
            {searches.length === 0 ? (
              <p className="text-[13px] text-ink-mute">No saved searches yet. Go to the map to save a search.</p>
            ) : (
              <div className="space-y-3">
                {searches.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-rule">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{s.label}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/search?searchId=${s.id}`} className="rounded-lg border-2 border-gold bg-utah-blue px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-utah-blue-hover">Run Search</Link>
                      <button onClick={() => deleteSearch(s.id)} className="px-3 py-1.5 border border-rule rounded text-[12px] text-ink hover:border-red-500 hover:text-red-500">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-rule bg-surface p-6 shadow-sm">
            <h2 className="font-display text-[20px] font-semibold text-ink mb-4">Watchlist Signals (Heatmap Preview)</h2>
            <div className="bg-surface-tint rounded-lg p-4 mb-4 border border-rule">
              <p className="text-[13px] font-medium text-ink">🔥 Ecosystem Heatmap Status: <span className="text-emerald-600 font-bold">Active</span></p>
              <p className="text-[12px] text-ink-mute mt-1">Your watchlisted companies are being monitored for automated signals.</p>
            </div>
            
            {trackedCompanies.length === 0 ? (
              <p className="text-[13px] text-ink-mute">Your watchlist is empty.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] font-medium text-ink mb-2">Tracking {trackedCompanies.length} companies</p>
                <div className="flex flex-wrap gap-2">
                  {trackedCompanies.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-surface-elev border border-rule rounded-full text-[12px]">
                      <span>{c.name}</span>
                      <button onClick={() => toggle(c)} className="text-ink-mute hover:text-red-500">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-rule bg-surface p-5 shadow-sm">
            <h3 className="font-display text-[18px] font-semibold text-ink mb-3">Email Digest</h3>
            <p className="text-[13px] text-ink-mute mb-4">Receive automated signals for your saved searches and watchlist.</p>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={digestSubscribed} 
                onChange={(e) => setDigestSubscribed(e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-[14px] font-medium text-ink">Weekly Pulse Digest</span>
            </label>
            
            <button className="w-full mt-4 py-2 border border-rule rounded-lg text-[13px] font-medium hover:bg-surface-tint transition-colors">
              Save Preferences
            </button>
          </section>

          <section className="rounded-xl bg-gold-soft/50 p-5 border border-gold/40">
            <h3 className="font-display text-[16px] font-semibold text-ink mb-2">CRM Export</h3>
            <p className="text-[12px] text-ink-mute mb-3">Download your entire watchlist and saved searches as a CSV for your CRM.</p>
            <button className="w-full rounded-lg border-2 border-gold bg-utah-blue py-2 text-[13px] font-semibold text-white transition-colors hover:bg-utah-blue-hover">
              Export to CSV
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
