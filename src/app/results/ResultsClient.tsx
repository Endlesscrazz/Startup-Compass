"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultCard } from "@/components/ResultCard";
import type { MatchResponse } from "@/app/api/match/route";

type QuizStorage = {
  stage: string;
  sector: string;
  city: string;
  goal: string;
  community: string[];
};

type Status = "loading" | "success" | "error" | "no-answers";

export function ResultsClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<MatchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<QuizStorage | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("sc_quiz");
    if (!raw) {
      setStatus("no-answers");
      return;
    }

    let answers: QuizStorage;
    try {
      answers = JSON.parse(raw);
    } catch {
      setStatus("no-answers");
      return;
    }

    setQuizAnswers(answers);

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Request failed (${res.status})`);
        }
        return res.json() as Promise<MatchResponse>;
      })
      .then((json) => {
        setData(json);
        setStatus("success");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, []);

  if (status === "no-answers") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-ink">No quiz answers found.</p>
        <p className="mt-2 text-sm text-ink-mute">Please complete the quiz first.</p>
        <button
          type="button"
          onClick={() => router.push("/navigator")}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-surface hover:bg-ink-soft"
        >
          Take the quiz →
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-rule border-t-accent" />
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
        <button
          type="button"
          onClick={() => router.push("/navigator")}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-surface hover:bg-ink-soft"
        >
          ← Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stageLabel: Record<string, string> = {
    idea: "Idea stage",
    building: "Building",
    revenue: "Revenue stage",
    growth: "Growth stage",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Summary header */}
      <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-ink-mute">
        <span>{stageLabel[quizAnswers?.stage ?? ""] ?? quizAnswers?.stage}</span>
        <span>·</span>
        <span>{quizAnswers?.sector}</span>
        <span>·</span>
        <span>{data.county} County</span>
        <span>·</span>
        <span>{quizAnswers?.goal}</span>
      </div>
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Your matched resources
      </h2>
      <p className="mt-1.5 text-[14px] text-ink-mute">
        {data.results.length} resources ranked for you · Utah state programs &amp; organizations
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {data.results.map((r, i) => (
          <ResultCard key={r.id} result={r} rank={i + 1} />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 border-t border-rule pt-8 text-center">
        <p className="text-[13px] text-ink-mute">Want different results?</p>
        <button
          type="button"
          onClick={() => router.push("/navigator")}
          className="inline-flex h-9 items-center rounded-full border border-rule px-5 text-[13px] font-medium text-ink-soft hover:border-rule-strong hover:text-ink"
        >
          ← Retake the quiz
        </button>
      </div>
    </div>
  );
}
