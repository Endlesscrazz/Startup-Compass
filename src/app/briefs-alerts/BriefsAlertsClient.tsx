"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { AtlasHeader } from "@/components/AtlasPages";
import { readResponseJson } from "@/lib/client/readResponseJson";
import type { AudienceType, EmailFrequency, SmsMinPriority } from "@/lib/intelligence/types";

type Prefs = {
  email_enabled: boolean;
  sms_enabled: boolean;
  phone_number: string | null;
  sms_verified: boolean;
  email_frequency: EmailFrequency;
  sms_min_priority: SmsMinPriority;
  quiet_hours_json: { start: string; end: string; timezone?: string } | null;
  brief_audience_preference: AudienceType;
  personalization_disabled: boolean;
};

type GmailStatus = {
  userConnected: boolean;
  sendEnabled: boolean;
  mode: string;
  description: string;
};

export function BriefsAlertsClient() {
  const { data: session, status } = useSession();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [smsStatus, setSmsStatus] = useState<{ canSendReal: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [demoCompanyId, setDemoCompanyId] = useState("");

  const load = useCallback(async () => {
    const [pr, gr, sr] = await Promise.all([
      fetch("/api/settings/briefs-alerts"),
      fetch("/api/integrations/gmail/status"),
      fetch("/api/notifications/sms/status"),
    ]);
    const p = await readResponseJson(pr, { success: false } as { success: boolean; data?: Prefs });
    const g = await readResponseJson(gr, { success: false } as { success: boolean; data?: GmailStatus });
    const s = await readResponseJson(sr, {
      success: false,
    } as { success: boolean; data?: { canSendReal: boolean } });
    if (p.success && p.data) setPrefs(p.data);
    if (g.success && g.data) setGmail(g.data);
    if (s.success && s.data) setSmsStatus(s.data);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  useEffect(() => {
    const p = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    if (p?.get("gmail") === "connected") setToast("Gmail connected for optional delivery.");
  }, []);

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
          <h1 className="font-display text-2xl text-ink">Briefs &amp; alerts</h1>
          <p className="mt-2 text-ink-soft">Sign in to manage personalized briefs and SMS updates.</p>
          <Link href="/login" className="mt-6 inline-flex atlas-btn atlas-btn-primary">
            Log in
          </Link>
        </main>
      </div>
    );
  }

  const patchPrefs = async (body: Partial<Prefs>) => {
    const res = await fetch("/api/settings/briefs-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await readResponseJson(res, { success: false } as { success: boolean; data?: Prefs });
    if (j.success && j.data) setPrefs(j.data);
  };

  const savePhone = async () => {
    const phone = prefs?.phone_number ?? "";
    await fetch("/api/settings/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phone || null, sms_verified: false }),
    });
    setToast("Phone saved (demo verification not required for hackathon mode).");
    void load();
  };

  const sendTestBrief = async () => {
    const res = await fetch("/api/briefs/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Test brief from settings" }),
    });
    const j = await res.json();
    if (j.success) {
      setToast("Test brief saved — open Brief history to preview.");
    } else setToast(j.error ?? "Could not generate brief");
  };

  const sendTestSms = async () => {
    const res = await fetch("/api/notifications/sms/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const j = await res.json();
    setToast(j.success ? "Test SMS recorded (or sent if Twilio enabled)." : j.error);
  };

  const demoSms = async () => {
    if (!demoCompanyId.trim()) {
      setToast("Enter a company id from the map dataset.");
      return;
    }
    const res = await fetch("/api/intelligence/demo-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: demoCompanyId.trim() }),
    });
    const j = await res.json();
    setToast(j.success ? "Demo alert dispatched — check Brief history → SMS." : j.error);
  };

  const clearPrivacy = async () => {
    await fetch("/api/intelligence/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearActivity: true }),
    });
    setToast("Activity history cleared for this account (server memory).");
  };

  return (
    <div className="atlas-page atlas-page-light">
      <AtlasHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Personalization</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Briefs &amp; alerts</h1>
        <p className="mt-3 text-[15px] text-ink-soft leading-relaxed">
          Quiet updates based on what you explore on the map. No agent dashboard — just optional email briefs and
          high-signal SMS when companies you follow change.
        </p>

        {toast && (
          <p className="mt-6 rounded-lg border border-rule bg-surface-elev px-4 py-3 text-[13px] text-ink" role="status">
            {toast}
          </p>
        )}

        <section className="mt-10 space-y-4 rounded-xl border border-rule bg-surface-elev p-6">
          <h2 className="font-display text-xl text-ink">Email briefs</h2>
          <label className="flex items-center gap-2 text-[14px] text-ink-soft">
            <input
              type="checkbox"
              checked={prefs?.email_enabled ?? true}
              onChange={(e) => void patchPrefs({ email_enabled: e.target.checked })}
            />
            Enable personalized briefs
          </label>
          <label className="block text-[13px] text-ink-mute">
            Frequency
            <select
              className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-ink"
              value={prefs?.email_frequency ?? "after_meaningful_activity"}
              onChange={(e) => void patchPrefs({ email_frequency: e.target.value as EmailFrequency })}
            >
              <option value="after_meaningful_activity">After meaningful searches (subtle)</option>
              <option value="weekly">Weekly digest</option>
              <option value="daily">Daily (high volume)</option>
              <option value="never">Never</option>
            </select>
          </label>
          <label className="block text-[13px] text-ink-mute">
            Brief style
            <select
              className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-ink"
              value={prefs?.brief_audience_preference ?? "unknown"}
              onChange={(e) => void patchPrefs({ brief_audience_preference: e.target.value as AudienceType })}
            >
              <option value="unknown">Auto</option>
              <option value="founder">Founder</option>
              <option value="investor">Investor</option>
              <option value="job_hunter">Job hunter</option>
              <option value="student">Student</option>
              <option value="ecosystem_builder">Ecosystem</option>
            </select>
          </label>
          <p className="text-[13px] text-ink-soft">{gmail?.description}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/integrations/gmail/connect"
              className="inline-flex rounded-full border border-ink/20 px-4 py-2 text-[13px] font-medium text-ink hover:border-gold"
            >
              Connect Gmail (optional)
            </a>
            <button
              type="button"
              onClick={() => void sendTestBrief()}
              className="inline-flex rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-surface hover:bg-ink-soft"
            >
              Send me a test brief
            </button>
          </div>
          {gmail?.sendEnabled ? (
            <p className="text-[12px] text-emerald-800">Inbox delivery enabled server-side.</p>
          ) : (
            <p className="text-[12px] text-ink-mute">
              Demo mode: briefs are stored in <Link href="/briefs">Brief history</Link> until{" "}
              <code className="rounded bg-black/5 px-1">EMAIL_SEND_ENABLED</code> and{" "}
              <code className="rounded bg-black/5 px-1">GMAIL_SEND_ENABLED</code> are true and Gmail is connected.
            </p>
          )}
        </section>

        <section className="mt-8 space-y-4 rounded-xl border border-rule bg-surface-elev p-6">
          <h2 className="font-display text-xl text-ink">SMS updates</h2>
          <label className="flex items-center gap-2 text-[14px] text-ink-soft">
            <input
              type="checkbox"
              checked={prefs?.sms_enabled ?? false}
              onChange={(e) => void patchPrefs({ sms_enabled: e.target.checked })}
            />
            Enable SMS (requires phone)
          </label>
          <label className="block text-[13px] text-ink-mute">
            Mobile number (E.164, e.g. +18015550123)
            <input
              className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-ink"
              value={prefs?.phone_number ?? ""}
              onChange={(e) =>
                setPrefs((p) =>
                  p ? { ...p, phone_number: e.target.value } : p,
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() => void savePhone()}
            className="rounded-full border border-rule px-4 py-2 text-[13px] text-ink hover:border-gold"
          >
            Save phone
          </button>
          <label className="block text-[13px] text-ink-mute">
            Minimum priority
            <select
              className="mt-1 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-ink"
              value={prefs?.sms_min_priority ?? "medium"}
              onChange={(e) => void patchPrefs({ sms_min_priority: e.target.value as SmsMinPriority })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High only</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void sendTestSms()}
            className="mr-3 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-surface"
          >
            Send test SMS
          </button>
          <p className="text-[12px] text-ink-mute">
            Real SMS only when <code className="rounded bg-black/5 px-1">SMS_SEND_ENABLED=true</code> and Twilio env
            vars are set. Otherwise messages are simulated and listed in history.
            {smsStatus?.canSendReal ? " Twilio is live." : ""}
          </p>
          <div className="border-t border-rule/80 pt-4">
            <p className="text-[13px] font-medium text-ink">Demo: hiring alert for a followed company</p>
            <input
              className="mt-2 w-full rounded-lg border border-rule bg-surface px-3 py-2 text-[13px] text-ink"
              placeholder="Company id (from URL ?c=...)"
              value={demoCompanyId}
              onChange={(e) => setDemoCompanyId(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void demoSms()}
              className="mt-2 rounded-full border border-gold/50 px-4 py-2 text-[13px] text-ink"
            >
              Simulate watched-company alert
            </button>
          </div>
        </section>

        <section className="mt-8 space-y-3 rounded-xl border border-rule bg-surface-elev p-6">
          <h2 className="font-display text-xl text-ink">Privacy</h2>
          <p className="text-[14px] text-ink-soft leading-relaxed">
            We use your searches, followed companies, and filters only to personalize briefs and alerts on Startup Compass.
            Data is kept in server memory for this deployment (replace with a database for production).
          </p>
          <button
            type="button"
            onClick={() => void clearPrivacy()}
            className="text-[13px] text-ink underline"
          >
            Delete my activity history
          </button>
          <label className="flex items-center gap-2 text-[14px] text-ink-soft">
            <input
              type="checkbox"
              checked={prefs?.personalization_disabled ?? false}
              onChange={(e) => void patchPrefs({ personalization_disabled: e.target.checked })}
            />
            Disable personalization
          </label>
        </section>

        <p className="mt-10 text-[12px] text-ink-mute">
          Operator tools:{" "}
          <Link href="/admin/intelligence" className="text-ink underline">
            Intelligence debug
          </Link>
        </p>
      </main>
    </div>
  );
}
