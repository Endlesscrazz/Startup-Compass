"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";
import { AtlasHeader } from "@/components/AtlasPages";
import type { RankedCompany } from "@/lib/agents/groqRanker";

export default function InvestorThesisPage() {
  const [stage, setStage] = useState("");
  const [sectors, setSectors] = useState("");
  const [checkSize, setCheckSize] = useState("");
  const [traction, setTraction] = useState("");
  const [excluded, setExcluded] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RankedCompany[] | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/agents/investor-thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, sectors, checkSize, traction, excludedSectors: excluded }),
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atlas-page atlas-page-light min-h-screen">
      <AtlasHeader />

      <main className="w-full max-w-[1000px] mx-auto px-5 py-10 grid gap-10 md:grid-cols-[380px_1fr]">
        <div className="rounded-2xl border border-rule bg-surface p-6 shadow-sm">
          <h1 className="font-display text-[24px] font-bold text-ink mb-2">Investor Thesis</h1>
          <p className="text-[13px] text-ink-mute mb-6">Define your investment thesis to generate a ranked shortlist of matching Utah startups.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Stage Focus</label>
              <input value={stage} onChange={e => setStage(e.target.value)} placeholder="e.g. Seed, Series A" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Target Sectors</label>
              <input value={sectors} onChange={e => setSectors(e.target.value)} placeholder="e.g. B2B SaaS, Healthtech" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Check Size</label>
              <input value={checkSize} onChange={e => setCheckSize(e.target.value)} placeholder="e.g. $500k - $2M" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Traction Requirement</label>
              <input value={traction} onChange={e => setTraction(e.target.value)} placeholder="e.g. $1M ARR, 10k MAU" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Excluded Sectors</label>
              <input value={excluded} onChange={e => setExcluded(e.target.value)} placeholder="e.g. Web3, Crypto" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-4 rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-surface hover:bg-ink-soft disabled:opacity-50">
              {loading ? "Matching..." : "Run Matcher"}
            </button>
          </form>
        </div>
        
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <h2 className="font-display text-[20px] font-semibold text-ink">Ranked Shortlist</h2>
              {results.length === 0 ? (
                <p className="text-[14px] text-ink-mute">No matches found.</p>
              ) : (
                results.map((r, i) => (
                  <div key={r.company.id} className="rounded-xl border border-rule bg-surface p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-[16px] text-ink">{i + 1}. {r.company.name}</h3>
                        <p className="text-[12px] text-ink-mute">{r.company.sector} · {r.company.stage} · {r.company.city}</p>
                      </div>
                      <div className="rounded-full bg-gold-soft/50 px-2.5 py-1 text-[12px] font-bold text-ink">
                        {r.fitScore}/100
                      </div>
                    </div>
                    <div className="bg-surface-tint rounded-lg p-3 mt-3">
                      <p className="text-[13px] text-ink leading-relaxed">
                        <span className="font-semibold">AI Rationale:</span> {r.rationale}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[14px] text-ink-mute">
              Enter your thesis on the left to see results.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
