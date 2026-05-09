import { randomUUID } from "crypto";
import type {
  ActivityEntityType,
  ActivityEventType,
  AudienceType,
  BriefType,
  CompanyEvent,
  CompanyInterestScore,
  CompanySnapshot,
  EmailBrief,
  EmailBriefStatus,
  EmailFrequency,
  GmailTokenRecord,
  NotificationPreferences,
  SmsAlert,
  SmsAlertStatus,
  UserActivityEvent,
  UserIntentProfile,
  WatchlistAlertCondition,
  WatchlistRow,
} from "@/lib/intelligence/types";

const activity: UserActivityEvent[] = [];
const intentByUser = new Map<string, UserIntentProfile>();
const interestScores: CompanyInterestScore[] = [];
const watchlist: WatchlistRow[] = [];
const notifPrefs = new Map<string, NotificationPreferences>();
const emailBriefs: EmailBrief[] = [];
const smsAlerts: SmsAlert[] = [];
const snapshots: CompanySnapshot[] = [];
const companyEvents: CompanyEvent[] = [];
const gmailTokens = new Map<string, GmailTokenRecord>();
const gmailOAuthStates = new Map<string, { userId: string; created: number }>();
const lastSmsDayKey = new Map<string, number>();

const DEFAULT_ALERTS: WatchlistAlertCondition[] = [
  "hiring_status_changed",
  "new_job_posting",
  "profile_updated",
  "stage_changed",
  "employee_count_changed",
  "funding_signal_added",
  "high_relevance_to_user_intent",
];

function nowIso() {
  return new Date().toISOString();
}

function defaultPrefs(userId: string): NotificationPreferences {
  const t = nowIso();
  return {
    id: `np-${userId}`,
    user_id: userId,
    email_enabled: true,
    sms_enabled: false,
    phone_number: null,
    sms_verified: false,
    email_frequency: "after_meaningful_activity",
    sms_min_priority: "medium",
    quiet_hours_json: { start: "22:00", end: "07:00", timezone: "America/Denver" },
    brief_audience_preference: "unknown",
    personalization_disabled: false,
    created_at: t,
    updated_at: t,
  };
}

export function getNotificationPreferences(userId: string): NotificationPreferences {
  return notifPrefs.get(userId) ?? defaultPrefs(userId);
}

export function upsertNotificationPreferences(
  userId: string,
  patch: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at">>,
): NotificationPreferences {
  const cur = getNotificationPreferences(userId);
  const next: NotificationPreferences = {
    ...cur,
    ...patch,
    updated_at: nowIso(),
    created_at: cur.created_at,
  };
  notifPrefs.set(userId, next);
  return next;
}

export function recordActivity(input: {
  user_id: string;
  event_type: ActivityEventType;
  entity_type?: ActivityEntityType;
  entity_id?: string | null;
  metadata_json?: Record<string, unknown>;
}): UserActivityEvent {
  const row: UserActivityEvent = {
    id: `act-${randomUUID()}`,
    user_id: input.user_id,
    event_type: input.event_type,
    entity_type: input.entity_type ?? "none",
    entity_id: input.entity_id ?? null,
    metadata_json: input.metadata_json ?? {},
    created_at: nowIso(),
  };
  activity.unshift(row);
  if (activity.length > 5000) activity.length = 5000;
  return row;
}

export function listActivity(userId: string, limit = 200): UserActivityEvent[] {
  return activity.filter((a) => a.user_id === userId).slice(0, limit);
}

export function clearUserActivity(userId: string): void {
  for (let i = activity.length - 1; i >= 0; i--) {
    if (activity[i].user_id === userId) activity.splice(i, 1);
  }
}

export function clearUserInterestScores(userId: string): void {
  for (let i = interestScores.length - 1; i >= 0; i--) {
    if (interestScores[i].user_id === userId) interestScores.splice(i, 1);
  }
}

export function getIntentProfile(userId: string): UserIntentProfile | null {
  return intentByUser.get(userId) ?? null;
}

export function upsertIntentProfile(row: UserIntentProfile): void {
  intentByUser.set(row.user_id, row);
}

export function listInterestScores(userId: string): CompanyInterestScore[] {
  return interestScores.filter((s) => s.user_id === userId);
}

export function upsertInterestScore(input: {
  user_id: string;
  company_id: string;
  delta: number;
  reason: string;
}): CompanyInterestScore {
  const t = nowIso();
  let row = interestScores.find(
    (s) => s.user_id === input.user_id && s.company_id === input.company_id,
  );
  if (!row) {
    row = {
      id: `cis-${randomUUID()}`,
      user_id: input.user_id,
      company_id: input.company_id,
      score: 0,
      reasons_json: [],
      last_interaction_at: t,
      interaction_count: 0,
      should_include_in_brief: false,
      created_at: t,
      updated_at: t,
    };
    interestScores.push(row);
  }
  row.score = Math.max(0, row.score + input.delta);
  row.interaction_count += 1;
  row.last_interaction_at = t;
  row.updated_at = t;
  if (!row.reasons_json.includes(input.reason)) {
    row.reasons_json = [...row.reasons_json, input.reason].slice(-12);
  }
  row.should_include_in_brief = row.score >= 8;
  return row;
}

export function getWatchlistRows(userId: string): WatchlistRow[] {
  return watchlist.filter((w) => w.user_id === userId);
}

export function getAllWatchlistRows(): WatchlistRow[] {
  return [...watchlist];
}

export function getWatchlistRow(userId: string, companyId: string): WatchlistRow | null {
  return watchlist.find((w) => w.user_id === userId && w.company_id === companyId) ?? null;
}

export function addWatchlistRow(input: {
  user_id: string;
  company_id: string;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  alert_conditions_json?: WatchlistAlertCondition[];
}): WatchlistRow {
  const existing = getWatchlistRow(input.user_id, input.company_id);
  const t = nowIso();
  if (existing) {
    existing.updated_at = t;
    if (input.email_enabled !== undefined) existing.email_enabled = input.email_enabled;
    if (input.sms_enabled !== undefined) existing.sms_enabled = input.sms_enabled;
    if (input.alert_conditions_json)
      existing.alert_conditions_json = input.alert_conditions_json;
    return existing;
  }
  const row: WatchlistRow = {
    id: `wl-${randomUUID()}`,
    user_id: input.user_id,
    company_id: input.company_id,
    email_enabled: input.email_enabled ?? true,
    sms_enabled: input.sms_enabled ?? false,
    alert_conditions_json: input.alert_conditions_json ?? [...DEFAULT_ALERTS],
    created_at: t,
    updated_at: t,
  };
  watchlist.push(row);
  return row;
}

export function removeWatchlistRow(userId: string, companyId: string): boolean {
  const i = watchlist.findIndex((w) => w.user_id === userId && w.company_id === companyId);
  if (i === -1) return false;
  watchlist.splice(i, 1);
  return true;
}

export function syncWatchlistIds(userId: string, companyIds: string[]): void {
  const set = new Set(companyIds);
  const prefs = getNotificationPreferences(userId);
  for (let i = watchlist.length - 1; i >= 0; i--) {
    if (watchlist[i].user_id === userId && !set.has(watchlist[i].company_id)) {
      watchlist.splice(i, 1);
    }
  }
  for (const id of companyIds) {
    addWatchlistRow({
      user_id: userId,
      company_id: id,
      email_enabled: prefs.email_enabled,
      sms_enabled: prefs.sms_enabled,
    });
  }
}

export function saveEmailBrief(input: {
  user_id: string;
  brief_type: BriefType;
  subject: string;
  preview_text: string;
  html_body: string;
  companies_json: { companyId: string; name?: string }[];
  trigger_reason: string;
  status: EmailBriefStatus;
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
}): EmailBrief {
  const row: EmailBrief = {
    id: `eb-${randomUUID()}`,
    user_id: input.user_id,
    brief_type: input.brief_type,
    subject: input.subject,
    preview_text: input.preview_text,
    html_body: input.html_body,
    companies_json: input.companies_json,
    trigger_reason: input.trigger_reason,
    status: input.status,
    provider_message_id: input.provider_message_id ?? null,
    error_message: input.error_message ?? null,
    created_at: nowIso(),
    sent_at: input.sent_at ?? null,
  };
  emailBriefs.unshift(row);
  if (emailBriefs.length > 2000) emailBriefs.length = 2000;
  return row;
}

export function listEmailBriefs(userId: string, limit = 50): EmailBrief[] {
  return emailBriefs.filter((b) => b.user_id === userId).slice(0, limit);
}

export function getEmailBrief(id: string, userId: string): EmailBrief | null {
  return emailBriefs.find((b) => b.id === id && b.user_id === userId) ?? null;
}

export function updateEmailBrief(
  id: string,
  userId: string,
  patch: Partial<Pick<EmailBrief, "status" | "provider_message_id" | "error_message" | "sent_at">>,
): EmailBrief | null {
  const b = emailBriefs.find((x) => x.id === id && x.user_id === userId);
  if (!b) return null;
  Object.assign(b, patch);
  return b;
}

export function saveSmsAlert(input: Omit<SmsAlert, "id" | "created_at">): SmsAlert {
  const row: SmsAlert = {
    id: `smsa-${randomUUID()}`,
    user_id: input.user_id,
    company_id: input.company_id,
    watchlist_id: input.watchlist_id,
    event_type: input.event_type,
    message_body: input.message_body,
    status: input.status,
    provider_message_id: input.provider_message_id ?? null,
    error_message: input.error_message ?? null,
    created_at: nowIso(),
    sent_at: input.sent_at ?? null,
  };
  smsAlerts.unshift(row);
  if (smsAlerts.length > 2000) smsAlerts.length = 2000;
  return row;
}

export function listSmsAlerts(userId: string, limit = 50): SmsAlert[] {
  return smsAlerts.filter((s) => s.user_id === userId).slice(0, limit);
}

export function saveCompanySnapshot(companyId: string, snapshot: Record<string, unknown>, source: string): CompanySnapshot {
  const row: CompanySnapshot = {
    id: `csn-${randomUUID()}`,
    company_id: companyId,
    snapshot_json: snapshot,
    source,
    created_at: nowIso(),
  };
  snapshots.push(row);
  return row;
}

export function latestCompanySnapshot(companyId: string): CompanySnapshot | null {
  const list = snapshots.filter((s) => s.company_id === companyId);
  if (!list.length) return null;
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function addCompanyEvent(row: Omit<CompanyEvent, "id" | "created_at">): CompanyEvent {
  const ev: CompanyEvent = {
    ...row,
    id: `cev-${randomUUID()}`,
    created_at: nowIso(),
  };
  companyEvents.unshift(ev);
  if (companyEvents.length > 3000) companyEvents.length = 3000;
  return ev;
}

export function listCompanyEvents(companyId?: string, limit = 100): CompanyEvent[] {
  const list = companyId ? companyEvents.filter((e) => e.company_id === companyId) : companyEvents;
  return list.slice(0, limit);
}

export function setGmailOAuthState(state: string, userId: string): void {
  gmailOAuthStates.set(state, { userId, created: Date.now() });
}

export function takeGmailOAuthState(state: string): string | null {
  const v = gmailOAuthStates.get(state);
  if (!v) return null;
  if (Date.now() - v.created > 600_000) {
    gmailOAuthStates.delete(state);
    return null;
  }
  gmailOAuthStates.delete(state);
  return v.userId;
}

export function setGmailTokens(userId: string, rec: GmailTokenRecord): void {
  gmailTokens.set(userId, rec);
}

export function getGmailTokens(userId: string): GmailTokenRecord | null {
  return gmailTokens.get(userId) ?? null;
}

export function briefEligibilityCounts(userId: string): {
  searchCount: number;
  companyViews: number;
  follows: number;
  savedSearches: number;
} {
  const acts = listActivity(userId, 500);
  return {
    searchCount: acts.filter((a) => a.event_type === "search_performed").length,
    companyViews: acts.filter((a) => a.event_type === "company_viewed").length,
    follows: acts.filter((a) => a.event_type === "company_followed").length,
    savedSearches: acts.filter((a) => a.event_type === "saved_search_created").length,
  };
}

export function shouldOfferBriefCta(userId: string): boolean {
  const prefs = getNotificationPreferences(userId);
  if (prefs.personalization_disabled || prefs.email_frequency === "never") return false;
  const c = briefEligibilityCounts(userId);
  return (
    c.follows >= 1 ||
    c.savedSearches >= 1 ||
    (c.searchCount >= 1 && c.companyViews >= 2)
  );
}

export function canSendSmsToday(userId: string, companyId: string): boolean {
  const key = `${userId}:${companyId}`;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getTime();
  const last = lastSmsDayKey.get(key);
  return last !== day;
}

export function markSmsSentToday(userId: string, companyId: string): void {
  const key = `${userId}:${companyId}`;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  lastSmsDayKey.set(key, start.getTime());
}

export function resetSmsDayLimit(userId: string, companyId: string): void {
  lastSmsDayKey.delete(`${userId}:${companyId}`);
}

export function adminSnapshot() {
  return {
    activityCount: activity.length,
    watchlistCount: watchlist.length,
    emailBriefCount: emailBriefs.length,
    smsAlertCount: smsAlerts.length,
    companyEventCount: companyEvents.length,
    gmailConnectedUsers: gmailTokens.size,
  };
}

export type { BriefType, EmailBriefStatus, SmsAlertStatus, AudienceType, EmailFrequency };
