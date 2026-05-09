import Link from "next/link";
import { AtlasHeader } from "@/components/AtlasPages";

export default function AgentsHubPage() {
  return (
    <div className="atlas-page atlas-page-light min-h-screen">
      <AtlasHeader />

      <main className="w-full max-w-[1100px] mx-auto px-5 py-10">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            AI Assistants
          </p>
          <h1 className="mt-2 font-display text-[clamp(32px,5vw,52px)] font-bold leading-tight text-ink">
            Compass Agents
          </h1>
          <p className="mt-3 max-w-[560px] mx-auto text-[16px] leading-relaxed text-ink-mute">
            Specialized AI workflows to help you navigate Utah's startup ecosystem faster.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/agents/investor-thesis" className="group flex flex-col rounded-2xl border border-rule bg-surface p-6 shadow-sm hover:border-accent hover:shadow-[var(--shadow-card-hover)] transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent text-[24px]">
              💰
            </div>
            <h2 className="font-display text-[20px] font-semibold text-ink group-hover:text-accent">Investor Thesis Matcher</h2>
            <p className="mt-2 text-[14px] text-ink-mute leading-relaxed flex-1">
              Input your stage, sector, and check size to instantly get a ranked shortlist of matching Utah startups with custom AI rationale.
            </p>
            <div className="mt-6 flex items-center text-[13px] font-medium text-accent">
              Launch Agent →
            </div>
          </Link>

          <Link href="/agents/job-hunter" className="group flex flex-col rounded-2xl border border-rule bg-surface p-6 shadow-sm hover:border-accent hover:shadow-[var(--shadow-card-hover)] transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 text-[24px]">
              🚀
            </div>
            <h2 className="font-display text-[20px] font-semibold text-ink group-hover:text-emerald-600">Job Hunter Matcher</h2>
            <p className="mt-2 text-[14px] text-ink-mute leading-relaxed flex-1">
              Find hiring startups that match your skills and experience. Get personalized outreach messages written for each opportunity.
            </p>
            <div className="mt-6 flex items-center text-[13px] font-medium text-emerald-600">
              Launch Agent →
            </div>
          </Link>

          <Link href="/agents/founder-advisor" className="group flex flex-col rounded-2xl border border-rule bg-surface p-6 shadow-sm hover:border-accent hover:shadow-[var(--shadow-card-hover)] transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 text-[24px]">
              🏔️
            </div>
            <h2 className="font-display text-[20px] font-semibold text-ink group-hover:text-amber-600">Founder Resource Advisor</h2>
            <p className="mt-2 text-[14px] text-ink-mute leading-relaxed flex-1">
              Describe your current challenge. The advisor finds the best grants, mentors, and programs, and gives you next action steps.
            </p>
            <div className="mt-6 flex items-center text-[13px] font-medium text-amber-600">
              Launch Agent →
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
