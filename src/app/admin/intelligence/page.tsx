import Link from "next/link";
import { adminSnapshot, listCompanyEvents } from "@/lib/intelligence/store";

export default function IntelligenceDebugPage() {
  const snap = adminSnapshot();
  const events = listCompanyEvents(undefined, 15);
  return (
    <div className="min-h-screen bg-surface p-8 text-ink">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">Internal</p>
      <h1 className="mt-2 font-display text-2xl">Intelligence debug</h1>
      <p className="mt-2 max-w-xl text-[14px] text-ink-soft">
        Not linked from main navigation. In-memory counters for this server instance (resets on cold start).
      </p>
      <pre className="mt-6 overflow-auto rounded-lg border border-rule bg-surface-elev p-4 text-[12px]">
        {JSON.stringify(snap, null, 2)}
      </pre>
      <h2 className="mt-10 font-display text-lg">Recent company events</h2>
      <ul className="mt-3 space-y-2 text-[13px] text-ink-soft">
        {events.length === 0 && <li>No events yet.</li>}
        {events.map((e) => (
          <li key={e.id}>
            <strong className="text-ink">{e.company_id}</strong> · {e.event_type} · {e.summary}
          </li>
        ))}
      </ul>
      <Link href="/briefs-alerts" className="mt-10 inline-block text-ink underline">
        ← Back to Briefs &amp; alerts
      </Link>
    </div>
  );
}
