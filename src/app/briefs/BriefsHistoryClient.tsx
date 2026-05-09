"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AtlasHeader } from "@/components/AtlasPages";

type EmailBrief = {
  id: string;
  subject: string;
  preview_text: string;
  status: string;
  created_at: string;
  companies_json: { companyId: string; name?: string }[];
};

type SmsAlert = {
  id: string;
  message_body: string;
  status: string;
  company_id: string;
  created_at: string;
};

export function BriefsHistoryClient() {
  const { status, data: session } = useSession();
  const [emails, setEmails] = useState<EmailBrief[]>([]);
  const [sms, setSms] = useState<SmsAlert[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void (async () => {
      const [e, s] = await Promise.all([
        fetch("/api/briefs/history").then((r) => r.json()),
        fetch("/api/intelligence/sms-history").then((r) => r.json()).catch(() => ({ success: false })),
      ]);
      if (e.success) setEmails(e.data);
      if (s.success) setSms(s.data);
    })();
  }, [status]);

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
          <h1 className="font-display text-2xl text-ink">Brief history</h1>
          <p className="mt-2 text-ink-soft">Sign in to view generated briefs and SMS alerts.</p>
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
        <h1 className="font-display text-3xl text-ink">Brief history</h1>
        <p className="mt-2 text-ink-soft">
          Personalized briefs and SMS records for your account.{" "}
          <Link href="/briefs-alerts" className="text-ink underline">
            Settings
          </Link>
        </p>

        <h2 className="mt-10 font-display text-xl text-ink">Email briefs</h2>
        <ul className="mt-4 space-y-3">
          {emails.length === 0 && (
            <li className="text-[14px] text-ink-mute">No briefs yet — explore the map and tap “Email me a brief.”</li>
          )}
          {emails.map((b) => (
            <li key={b.id} className="rounded-xl border border-rule bg-surface-elev p-4">
              <p className="font-medium text-ink">{b.subject}</p>
              <p className="text-[13px] text-ink-soft">{b.preview_text}</p>
              <p className="mt-2 text-[11px] text-ink-mute">
                {new Date(b.created_at).toLocaleString()} · {b.status}
              </p>
              <p className="mt-1 text-[12px] text-ink-mute">
                {(b.companies_json ?? []).map((c) => c.name ?? c.companyId).join(" · ")}
              </p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-xl text-ink">SMS alerts</h2>
        <ul className="mt-4 space-y-3">
          {sms.length === 0 && (
            <li className="text-[14px] text-ink-mute">No SMS yet — enable alerts in settings and follow a company.</li>
          )}
          {sms.map((m) => (
            <li key={m.id} className="rounded-xl border border-rule bg-surface-elev p-4">
              <p className="text-[13px] text-ink">{m.message_body}</p>
              <p className="mt-2 text-[11px] text-ink-mute">
                {new Date(m.created_at).toLocaleString()} · {m.status} · {m.company_id}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
