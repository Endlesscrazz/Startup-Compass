"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";
import { AtlasHeader } from "@/components/AtlasPages";
import type { JobMatch } from "@/lib/agents/groqRanker";

export default function JobHunterPage() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [sectors, setSectors] = useState("");
  const [remotePreference, setRemotePreference] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobMatch[] | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/agents/job-hunter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, skills, experience, sectors, remotePreference }),
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
          <h1 className="font-display text-[24px] font-bold text-ink mb-2">Job Hunter Agent</h1>
          <p className="text-[13px] text-ink-mute mb-6">Enter your professional profile to find actively hiring startups and generate personalized outreach messages.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Target Role</label>
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Key Skills</label>
              <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Node, AWS" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Experience Level</label>
              <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5+ years" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Sector Interests</label>
              <input value={sectors} onChange={e => setSectors(e.target.value)} placeholder="e.g. SaaS, Fintech" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-ink-mute mb-1">Remote Preference</label>
              <input value={remotePreference} onChange={e => setRemotePreference(e.target.value)} placeholder="e.g. Fully Remote" className="w-full rounded-lg border border-rule px-3 py-2 text-[13px] text-ink focus:border-accent outline-none" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-4 rounded-full bg-emerald-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? "Matching..." : "Find Opportunities"}
            </button>
          </form>
        </div>
        
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <h2 className="font-display text-[20px] font-semibold text-ink">Matches & Outreach Drafts</h2>
              {results.length === 0 ? (
                <p className="text-[14px] text-ink-mute">No actively hiring companies found matching your criteria.</p>
              ) : (
                results.map((r, i) => (
                  <div key={r.company.id} className="rounded-xl border border-rule bg-surface p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-[16px] text-ink">{i + 1}. {r.company.name}</h3>
                        <p className="text-[12px] text-ink-mute">{r.company.sector} · {r.company.stage} · {r.company.city}</p>
                      </div>
                      <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
                        {r.fitScore}% Match
                      </div>
                    </div>
                    <div className="bg-surface-tint rounded-lg p-4">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-mute mb-2">Suggested Outreach Message</p>
                      <p className="text-[13px] text-ink whitespace-pre-wrap">{r.outreachMessage}</p>
                      <div className="mt-3 flex gap-2">
                        <button className="text-[11px] font-medium px-3 py-1.5 border border-rule bg-surface rounded hover:border-emerald-500" onClick={() => navigator.clipboard.writeText(r.outreachMessage)}>Copy to Clipboard</button>
                        {r.company.linkedin && <a href={r.company.linkedin} target="_blank" className="text-[11px] font-medium px-3 py-1.5 border border-rule bg-surface rounded hover:border-emerald-500 text-ink">View LinkedIn</a>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[14px] text-ink-mute">
              Enter your profile on the left to see matches.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
