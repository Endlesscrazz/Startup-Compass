"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultCard } from "@/components/ResultCard";
import type { MatchResponse, MatchResultItem } from "@/app/api/match/route";

// Quiz path storage shape
type QuizStorage = {
  stage: string;
  sector: string;
  city: string;
  goal: string;
  community: string[];
};

// NL path storage shape
type NLStorage = {
  description: string;
  city: string;
};

type StorageShape = QuizStorage | NLStorage;

function isNLStorage(s: StorageShape): s is NLStorage {
  return "description" in s;
}

type Status = "loading" | "success" | "error" | "no-answers";

const STORAGE_SAVE_KEY = "sc_saved_results";

// ── Share ──────────────────────────────────────────────────────────────────

function buildShareText(results: MatchResultItem[]): string {
  const lines = results.slice(0, 5).map((r, i) => {
    const url = r.link ? `\n   ${r.link}` : "";
    return `${i + 1}. ${r.title}\n   ${r.explanation}${url}`;
  });
  return `My top Utah startup resources:\n\n${lines.join("\n\n")}\n\nFound via Startup Compass — startupcompass.vercel.app`;
}

function ShareButtons({ results }: { results: MatchResultItem[] }) {
  const [copied, setCopied] = useState(false);
  const text = buildShareText(results);
  const mailtoHref = `mailto:?subject=My%20Utah%20startup%20resources&body=${encodeURIComponent(text)}`;

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={mailtoHref}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        Email results
      </a>
      <button type="button" onClick={handleCopy}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink">
        {copied ? (
          <><svg className="h-3.5 w-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Copied!</>
        ) : (
          <><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>Copy list</>
        )}
      </button>
    </div>
  );
}

// ── Save to localStorage ───────────────────────────────────────────────────

function SaveButton({ data, stored }: { data: MatchResponse; stored: StorageShape }) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const payload = {
      results: data.results,
      profileString: data.profileString,
      county: data.county,
      stored,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_SAVE_KEY, JSON.stringify(payload));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <button type="button" onClick={handleSave}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft transition-colors hover:border-rule-strong hover:text-ink">
      {saved ? (
        <><svg className="h-3.5 w-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Saved!</>
      ) : (
        <><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>Save for later</>
      )}
    </button>
  );
}

// ── "How we matched you" transparency ─────────────────────────────────────

function MatchTransparency({ data, stored }: { data: MatchResponse; stored: StorageShape }) {
  const [open, setOpen] = useState(false);
  const isNL = isNLStorage(stored);

  return (
    <div className="mt-4 rounded-xl border border-rule/60 bg-surface-tint/40 text-[13px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-ink-mute hover:text-ink"
      >
        <span className="font-medium">How we matched you</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-rule/60 px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-ink-mute mb-1">Location filter</p>
            <p className="text-ink-soft">
              Showing resources available in <strong>{data.county} County</strong> —
              resources must list this county or serve all 29 Utah counties.
            </p>
          </div>

          {!isNL && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-mute mb-1">Ranking signals</p>
              <p className="text-ink-soft">
                Semantic similarity (embedding cosine) +{" "}
                {(stored as QuizStorage).goal && <span>goal match (<em>{(stored as QuizStorage).goal}</em>)</span>}
                {(stored as QuizStorage).sector && <span> + sector match (<em>{(stored as QuizStorage).sector}</em>)</span>}
                {(stored as QuizStorage).community?.length > 0 && (
                  <span> + community tags (<em>{(stored as QuizStorage).community.join(", ")}</em>)</span>
                )}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-ink-mute mb-1">Profile embedded</p>
            <p className="font-mono text-[12px] text-ink-soft bg-surface-tint rounded-lg px-3 py-2 leading-relaxed">
              {data.profileString}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  idea: "Idea stage",
  building: "Building",
  revenue: "Revenue stage",
  growth: "Growth stage",
};

export function ResultsClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<MatchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [stored, setStored] = useState<StorageShape | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const raw = sessionStorage.getItem("sc_quiz");
      if (!raw) {
        if (!cancelled) setStatus("no-answers");
        return;
      }

      let answers: StorageShape;
      try {
        answers = JSON.parse(raw);
      } catch {
        if (!cancelled) setStatus("no-answers");
        return;
      }

      if (!cancelled) setStored(answers);

      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Request failed (${res.status})`);
        }
        const json = (await res.json()) as MatchResponse;
        if (cancelled) return;
        setData(json);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Request failed");
        setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "no-answers") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink">No answers found.</p>
        <p className="mt-2 text-sm text-ink-mute">Please complete the quiz or describe your situation first.</p>
        <button type="button" onClick={() => router.push("/navigator")}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-[#fbf7f0] hover:bg-ink-soft">
          Find my resources →
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-rule border-t-gold" />
        <p className="text-[15px] font-medium text-ink">Finding your resources…</p>
        <p className="mt-1 text-[13px] text-ink-mute">Matching across 211 Utah programs</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink">Something went wrong</p>
        <p className="mt-2 text-sm text-ink-mute">{errorMsg}</p>
        <button type="button" onClick={() => router.push("/navigator")}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-[#fbf7f0] hover:bg-ink-soft">
          ← Try again
        </button>
      </div>
    );
  }

  if (!data || !stored) return null;

  const summaryParts: string[] = isNLStorage(stored)
    ? [stored.description.slice(0, 80) + (stored.description.length > 80 ? "…" : ""), `${data.county} County`]
    : [STAGE_LABEL[stored.stage] ?? stored.stage, stored.sector, `${data.county} County`, stored.goal];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Summary bar */}
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] uppercase tracking-[0.12em] text-ink-mute">
        {summaryParts.map((part, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>·</span>}
            {part}
          </span>
        ))}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Your matched resources
          </h2>
          <p className="mt-1.5 text-[14px] text-ink-mute">
            {data.results.length} resources ranked for you · Utah state programs &amp; organizations
          </p>
        </div>
        <button type="button" onClick={() => router.push("/navigator")}
          className="mt-1 shrink-0 inline-flex h-9 items-center rounded-full border border-rule px-4 text-[13px] font-medium text-ink-soft hover:border-rule-strong hover:text-ink">
          ← Retake
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <ShareButtons results={data.results} />
        <SaveButton data={data} stored={stored} />
      </div>

      {/* Transparency accordion */}
      <MatchTransparency data={data} stored={stored} />

      {/* Result cards */}
      <div className="mt-6 flex flex-col gap-4">
        {data.results.map((r, i) => (
          <ResultCard key={r.id} result={r} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
