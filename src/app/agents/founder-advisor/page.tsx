"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";
import { AtlasHeader } from "@/components/AtlasPages";

export default function FounderAdvisorPage() {
  const [stage, setStage] = useState("");
  const [sector, setSector] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [funding, setFunding] = useState("");
  const [city, setCity] = useState("");
  const [challenge, setChallenge] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/agents/founder-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, sector, teamSize, funding, city, challenge }),
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
          <h1 className="font-display text-[24px] font-bold text-ink mb-2">Founder Advisor</h1>
          <p className="text-[13px] text-ink-mute mb-6">Describe your current startup challenge to get 5 curated resources and immediate action steps.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Your Stage</label>
              <input value={stage} onChange={e => setStage(e.target.value)} placeholder="e.g. Pre-Seed, Series A" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Your Sector</label>
              <input value={sector} onChange={e => setSector(e.target.value)} placeholder="e.g. Cleantech, Edtech" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Provo, Salt Lake City" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Biggest Challenge</label>
              <textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="e.g. I need non-dilutive funding to build my MVP." className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-gold outline-none min-h-[80px]" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-4 rounded-full bg-amber-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {loading ? "Analyzing..." : "Get Advice"}
            </button>
          </form>
        </div>
        
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <h2 className="font-display text-[20px] font-semibold text-ink">Action Plan</h2>
              {results.length === 0 ? (
                <p className="text-[14px] text-ink-mute">No resources found.</p>
              ) : (
                results.map((r, i) => (
                  <div key={r.resource.id} className="rounded-xl border border-rule bg-surface p-5 shadow-sm">
                    <div className="mb-3">
                      <h3 className="font-semibold text-[17px] text-ink flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[12px]">{i+1}</span>
                        {r.resource.title}
                      </h3>
                      <p className="text-[13px] text-ink-mute mt-1">{r.resource.description}</p>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <p className="text-[13px] text-amber-900 font-medium mb-3">💡 {r.advice}</p>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2">Next Steps:</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {r.actionSteps.map((step: string, idx: number) => (
                          <li key={idx} className="text-[12px] text-amber-900">{step}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {r.resource.link && (
                      <div className="mt-4">
                        <a href={r.resource.link} target="_blank" className="text-[12px] font-semibold text-amber-700 hover:underline">Go to Resource →</a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[14px] text-ink-mute">
              Describe your challenge to get advice.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
