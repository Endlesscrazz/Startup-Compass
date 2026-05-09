import type { Company } from "@/lib/map-config";
import { BASE_URL } from "@/lib/intelligence/companyBriefGenerator";
import type { CompanyEvent, CompanyEventType, EventPriority } from "@/lib/intelligence/types";
import {
  addCompanyEvent,
  latestCompanySnapshot,
  saveCompanySnapshot,
  getNotificationPreferences,
  getWatchlistRow,
  getAllWatchlistRows,
  canSendSmsToday,
  markSmsSentToday,
} from "@/lib/intelligence/store";
import { sendIntelSms } from "@/lib/intelligence/smsDelivery";

function priorityFor(type: CompanyEventType): EventPriority {
  switch (type) {
    case "hiring_status_changed":
    case "job_posting_added":
    case "funding_signal_added":
    case "stage_changed":
      return "high";
    case "employee_count_changed":
    case "profile_updated":
    case "profile_claimed":
      return "medium";
    default:
      return "low";
  }
}

export function snapshotFromCompany(c: Company): Record<string, unknown> {
  return {
    name: c.name,
    stage: c.stage,
    employees: c.employees,
    sector: c.sector,
    hiringStatus: c.hiringStatus ?? null,
    description: c.description ?? null,
    fundingAmount: c.fundingAmount ?? null,
    claimedByFounder: c.claimedByFounder ?? false,
  };
}

export async function ingestCompanyForChangeDetection(
  c: Company,
  source: string,
): Promise<CompanyEvent[]> {
  const snap = snapshotFromCompany(c);
  const prev = latestCompanySnapshot(c.id);
  saveCompanySnapshot(c.id, snap, source);
  const emitted: CompanyEvent[] = [];
  if (!prev) return emitted;

  const o = prev.snapshot_json;
  const n = snap;

  const emit = (
    event_type: CompanyEventType,
    summary: string,
    oldVal: unknown,
    newVal: unknown,
  ) => {
    emitted.push(
      addCompanyEvent({
        company_id: c.id,
        event_type,
        old_value_json: oldVal != null ? { v: oldVal } : null,
        new_value_json: newVal != null ? { v: newVal } : null,
        priority: priorityFor(event_type),
        summary,
      }),
    );
  };

  if (o.stage !== n.stage) {
    emit("stage_changed", `Stage updated for ${c.name}`, o.stage, n.stage);
  }
  if (o.employees !== n.employees) {
    emit("employee_count_changed", `Team size changed for ${c.name}`, o.employees, n.employees);
  }
  if (o.hiringStatus !== n.hiringStatus) {
    emit("hiring_status_changed", `Hiring signal changed for ${c.name}`, o.hiringStatus, n.hiringStatus);
  }
  if (o.fundingAmount !== n.fundingAmount && n.fundingAmount) {
    emit("funding_signal_added", `Funding field updated for ${c.name}`, o.fundingAmount, n.fundingAmount);
  }
  if (o.description !== n.description) {
    emit("profile_updated", `Profile text updated for ${c.name}`, null, null);
  }
  if (!o.claimedByFounder && n.claimedByFounder) {
    emit("profile_claimed", `${c.name} profile was claimed`, false, true);
  }
  for (const ev of emitted) {
    await dispatchWatchlistSmsForEvent({
      companyId: c.id,
      companyName: c.name,
      eventType: ev.event_type,
      summary: ev.summary,
    });
  }
  return emitted;
}

export function mapEventToCondition(eventType: CompanyEventType): string | null {
  const m: Partial<Record<CompanyEventType, string>> = {
    hiring_status_changed: "hiring_status_changed",
    job_posting_added: "new_job_posting",
    profile_updated: "profile_updated",
    stage_changed: "stage_changed",
    employee_count_changed: "employee_count_changed",
    funding_signal_added: "funding_signal_added",
    profile_claimed: "company_claimed_profile",
    high_intent_match: "high_relevance_to_user_intent",
  };
  return m[eventType] ?? null;
}

function quietNow(prefs: ReturnType<typeof getNotificationPreferences>): boolean {
  const qh = prefs.quiet_hours_json;
  if (!qh) return false;
  const [sh, sm] = qh.start.split(":").map(Number);
  const [eh, em] = qh.end.split(":").map(Number);
  const d = new Date();
  const mins = d.getHours() * 60 + d.getMinutes();
  const start = sh * 60 + (sm || 0);
  const end = eh * 60 + (em || 0);
  if (start < end) return mins >= start && mins < end;
  return mins >= start || mins < end;
}

function priorityMeets(min: "low" | "medium" | "high", p: EventPriority): boolean {
  const rank = { low: 0, medium: 1, high: 2 };
  return rank[p] >= rank[min];
}

export async function dispatchWatchlistSmsForEvent(params: {
  companyId: string;
  companyName: string;
  eventType: CompanyEventType;
  summary: string;
}): Promise<void> {
  const cond = mapEventToCondition(params.eventType);
  if (!cond) return;

  const userIds = [
    ...new Set(
      getAllWatchlistRows()
        .filter((w) => w.company_id === params.companyId)
        .map((w) => w.user_id),
    ),
  ];

  for (const userId of userIds) {
    const row = getWatchlistRow(userId, params.companyId);
    if (!row || !row.sms_enabled) continue;
    if (!row.alert_conditions_json.includes(cond as (typeof row.alert_conditions_json)[number]))
      continue;

    const prefs = getNotificationPreferences(userId);
    if (!prefs.sms_enabled || !prefs.phone_number) continue;
    if (quietNow(prefs)) continue;

    const pr = priorityFor(params.eventType);
    if (!priorityMeets(prefs.sms_min_priority, pr)) continue;
    if (!canSendSmsToday(userId, params.companyId)) continue;

    const body = `Startup Compass: ${params.companyName} — ${params.summary}. View: ${BASE_URL}/search?c=${encodeURIComponent(params.companyId)}`;
    const result = await sendIntelSms({
      userId,
      to: prefs.phone_number,
      body: body.slice(0, 320),
      companyId: params.companyId,
      watchlistId: row.id,
      eventType: params.eventType,
    });
    if (result.ok) markSmsSentToday(userId, params.companyId);
  }
}
