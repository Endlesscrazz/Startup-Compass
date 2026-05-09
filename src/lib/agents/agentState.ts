/**
 * Unified in-memory state for the autonomous agent layer.
 * All entities are stored in module-level state (no external DB required).
 * Replace this module with a real DB adapter without changing agent logic.
 */
import { randomUUID } from "crypto";
import type { AgentRunLog, AgentRunResult, NotificationItem, SavedSearch } from "@/lib/agents/types";
import { DEMO_SAVED_SEARCHES } from "@/lib/agents/demo";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TriggerType =
  | "new_match"
  | "field_changed"
  | "new_job"
  | "hiring_status_changed"
  | "profile_updated"
  | "profile_stale"
  | "stage_changed"
  | "size_changed"
  | "resource_match"
  | "investor_fit"
  | "weekly_digest";

export type RulePriority = "low" | "medium" | "high";
export type RuleEntityScope = "companies" | "jobs" | "resources" | "investors" | "all";
export type ActionType =
  | "in_app_notification"
  | "gmail_draft"
  | "gmail_send"
  | "sms_draft"
  | "sms_send"
  | "weekly_digest_item"
  | "campaign_draft"
  | "admin_task"
  | "investor_brief"
  | "talent_alert";

export type ActionStatus = "queued" | "created" | "sent" | "failed" | "simulated";

export type AgentRule = {
  id: string;
  userId: string;
  name: string;
  description: string;
  entityScope: RuleEntityScope;
  triggerType: TriggerType;
  conditions: Record<string, unknown>;
  actions: ActionType[];
  channels: ("in_app" | "gmail" | "sms")[];
  priority: RulePriority;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
};

export type AgentEvent = {
  id: string;
  entityType: "company" | "job" | "resource" | "investor";
  entityId: string;
  eventType: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  detectedAt: string;
  source: "company-watch" | "manual" | "demo";
  metadata: Record<string, unknown>;
};

export type RuleMatch = {
  id: string;
  ruleId: string;
  eventId?: string;
  userId: string;
  matchScore: number;
  reasons: string[];
  status: "new" | "notified" | "dismissed" | "archived";
  createdAt: string;
};

export type AgentAction = {
  id: string;
  ruleMatchId?: string;
  actionType: ActionType;
  status: ActionStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
};

export type CompanySnapshot = {
  id: string;
  companyId: string;
  snapshot: Record<string, unknown>;
  source: "auto" | "manual";
  createdAt: string;
};

export type GmailDraft = {
  id: string;
  userId: string;
  subject: string;
  body: string;
  to?: string;
  draftType: "company_alert" | "weekly_digest" | "investor_outreach" | "founder_profile" | "talent_opportunity";
  status: "simulated" | "draft_created" | "sent";
  linkedEntityId?: string;
  linkedRuleId?: string;
  createdAt: string;
};

export type SimulatedSms = {
  id: string;
  userId: string;
  to: string;
  body: string;
  messageType: "company_alert" | "job_alert" | "investor_alert" | "digest_reminder";
  status: "simulated" | "sent" | "failed";
  linkedEntityId?: string;
  createdAt: string;
};

export type WatchedCompany = {
  companyId: string;
  userId: string;
  alerts: {
    hiringChange: boolean;
    profileUpdate: boolean;
    newJobs: boolean;
    stageChange: boolean;
  };
  addedAt: string;
};

export type NotificationPref = {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  digestFrequency: "daily" | "weekly" | "never";
  phoneNumber?: string;
  gmailConnected: boolean;
  createdAt: string;
};

// ─── State ──────────────────────────────────────────────────────────────────

type State = {
  runs: AgentRunLog[];
  results: Record<string, AgentRunResult>;
  notifications: NotificationItem[];
  savedSearches: SavedSearch[];
  rules: AgentRule[];
  events: AgentEvent[];
  ruleMatches: RuleMatch[];
  actions: AgentAction[];
  snapshots: CompanySnapshot[];
  gmailDrafts: GmailDraft[];
  simulatedSms: SimulatedSms[];
  watchlist: WatchedCompany[];
  notificationPrefs: Map<string, NotificationPref>;
};

const state: State = {
  runs: [],
  results: {},
  notifications: [],
  savedSearches: [],
  rules: [],
  events: [],
  ruleMatches: [],
  actions: [],
  snapshots: [],
  gmailDrafts: [],
  simulatedSms: [],
  watchlist: [],
  notificationPrefs: new Map(),
};

let seeded = false;

function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  state.savedSearches = [...DEMO_SAVED_SEARCHES];
  state.rules = buildDefaultRules();
  state.notificationPrefs.set("demo-user", {
    userId: "demo-user",
    emailEnabled: true,
    smsEnabled: false,
    digestFrequency: "weekly",
    gmailConnected: false,
    createdAt: new Date().toISOString(),
  });
}

function buildDefaultRules(): AgentRule[] {
  const now = new Date().toISOString();
  return [
    {
      id: "rule-b2b-hiring",
      userId: "demo-user",
      name: "B2B Software hiring alert",
      description: "Alert me when B2B Software companies in Salt Lake or Lehi show hiring signals.",
      entityScope: "companies",
      triggerType: "hiring_status_changed",
      conditions: { sector: "B2B Software", cities: ["Salt Lake City", "Lehi", "S Lehi"], employeeRange: ["11-50", "51-200"] },
      actions: ["in_app_notification", "gmail_draft"],
      channels: ["in_app", "gmail"],
      priority: "high",
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rule-biotech-investor",
      userId: "demo-user",
      name: "Bio/Medical investor radar",
      description: "Create investor brief when Bio/Medical companies reach Seed or Series A.",
      entityScope: "companies",
      triggerType: "investor_fit",
      conditions: { sector: "Bio/Medical Tech", stage: ["Seed", "Series A", "Series B"] },
      actions: ["investor_brief", "gmail_draft"],
      channels: ["in_app", "gmail"],
      priority: "medium",
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rule-weekly-digest",
      userId: "demo-user",
      name: "Weekly startup digest",
      description: "Every Friday, send me a digest of all watched companies and top matches.",
      entityScope: "all",
      triggerType: "weekly_digest",
      conditions: { frequency: "weekly", day: "Friday" },
      actions: ["weekly_digest_item", "gmail_draft"],
      channels: ["in_app", "gmail"],
      priority: "low",
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ─── Saved Searches ──────────────────────────────────────────────────────────

export function getSavedSearches(): SavedSearch[] {
  ensureSeeded();
  return state.savedSearches;
}

export function createSavedSearch(input: Omit<SavedSearch, "id" | "createdAt">): SavedSearch {
  ensureSeeded();
  const next: SavedSearch = { ...input, id: `search-${randomUUID()}`, createdAt: new Date().toISOString() };
  state.savedSearches.unshift(next);
  return next;
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export function getRules(userId = "demo-user"): AgentRule[] {
  ensureSeeded();
  return state.rules.filter((r) => r.userId === userId);
}

export function createRule(input: Omit<AgentRule, "id" | "createdAt" | "updatedAt">): AgentRule {
  ensureSeeded();
  const now = new Date().toISOString();
  const next: AgentRule = { ...input, id: `rule-${randomUUID()}`, createdAt: now, updatedAt: now };
  state.rules.unshift(next);
  return next;
}

export function updateRule(id: string, patch: Partial<AgentRule>): AgentRule | null {
  const rule = state.rules.find((r) => r.id === id);
  if (!rule) return null;
  Object.assign(rule, patch, { updatedAt: new Date().toISOString() });
  return rule;
}

export function deleteRule(id: string): boolean {
  const idx = state.rules.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  state.rules.splice(idx, 1);
  return true;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function addEvent(input: Omit<AgentEvent, "id" | "detectedAt">): AgentEvent {
  const next: AgentEvent = { ...input, id: `evt-${randomUUID()}`, detectedAt: new Date().toISOString() };
  state.events.unshift(next);
  return next;
}

export function getEvents(limit = 50): AgentEvent[] {
  return state.events.slice(0, limit);
}

// ─── Rule Matches ────────────────────────────────────────────────────────────

export function addRuleMatch(input: Omit<RuleMatch, "id" | "createdAt">): RuleMatch {
  const next: RuleMatch = { ...input, id: `match-${randomUUID()}`, createdAt: new Date().toISOString() };
  state.ruleMatches.unshift(next);
  return next;
}

export function getRuleMatches(userId = "demo-user"): RuleMatch[] {
  return state.ruleMatches.filter((m) => m.userId === userId);
}

// ─── Actions Log ─────────────────────────────────────────────────────────────

export function addAction(input: Omit<AgentAction, "id" | "createdAt">): AgentAction {
  const next: AgentAction = { ...input, id: `action-${randomUUID()}`, createdAt: new Date().toISOString() };
  state.actions.unshift(next);
  return next;
}

export function getActions(limit = 100): AgentAction[] {
  return state.actions.slice(0, limit);
}

// ─── Company Snapshots ───────────────────────────────────────────────────────

export function saveSnapshot(companyId: string, snapshot: Record<string, unknown>): CompanySnapshot {
  const next: CompanySnapshot = {
    id: `snap-${randomUUID()}`,
    companyId,
    snapshot,
    source: "auto",
    createdAt: new Date().toISOString(),
  };
  state.snapshots.push(next);
  return next;
}

export function getLatestSnapshot(companyId: string): CompanySnapshot | null {
  return (
    [...state.snapshots]
      .filter((s) => s.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

// ─── Gmail Drafts ────────────────────────────────────────────────────────────

export function createGmailDraft(input: Omit<GmailDraft, "id" | "createdAt">): GmailDraft {
  const next: GmailDraft = { ...input, id: `gmail-${randomUUID()}`, createdAt: new Date().toISOString() };
  state.gmailDrafts.unshift(next);
  return next;
}

export function getGmailDrafts(userId = "demo-user"): GmailDraft[] {
  return state.gmailDrafts.filter((d) => d.userId === userId);
}

// ─── Simulated SMS ───────────────────────────────────────────────────────────

export function createSimulatedSms(input: Omit<SimulatedSms, "id" | "createdAt">): SimulatedSms {
  const next: SimulatedSms = { ...input, id: `sms-${randomUUID()}`, createdAt: new Date().toISOString() };
  state.simulatedSms.unshift(next);
  return next;
}

export function getSimulatedSms(userId = "demo-user"): SimulatedSms[] {
  return state.simulatedSms.filter((s) => s.userId === userId);
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

export function followCompany(companyId: string, userId = "demo-user"): WatchedCompany {
  const existing = state.watchlist.find((w) => w.companyId === companyId && w.userId === userId);
  if (existing) return existing;
  const entry: WatchedCompany = {
    companyId,
    userId,
    alerts: { hiringChange: true, profileUpdate: true, newJobs: true, stageChange: true },
    addedAt: new Date().toISOString(),
  };
  state.watchlist.push(entry);
  return entry;
}

export function unfollowCompany(companyId: string, userId = "demo-user"): boolean {
  const idx = state.watchlist.findIndex((w) => w.companyId === companyId && w.userId === userId);
  if (idx === -1) return false;
  state.watchlist.splice(idx, 1);
  return true;
}

export function getWatchlist(userId = "demo-user"): WatchedCompany[] {
  return state.watchlist.filter((w) => w.userId === userId);
}

export function isWatched(companyId: string, userId = "demo-user"): boolean {
  return state.watchlist.some((w) => w.companyId === companyId && w.userId === userId);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function addNotification(item: Omit<NotificationItem, "id" | "createdAt">): NotificationItem {
  const next: NotificationItem = { ...item, id: `notif-${randomUUID()}`, createdAt: new Date().toISOString() };
  state.notifications.unshift(next);
  return next;
}

export function listUnreadNotifications(): NotificationItem[] {
  return state.notifications.filter((n) => !n.readAt);
}

export function listAllNotifications(): NotificationItem[] {
  return state.notifications;
}

export function markNotificationRead(id: string): NotificationItem | null {
  const match = state.notifications.find((n) => n.id === id);
  if (!match) return null;
  if (!match.readAt) match.readAt = new Date().toISOString();
  return match;
}

// ─── Agent Run Logs ──────────────────────────────────────────────────────────

export function setAgentRunning(agentName: string, startedAt = new Date().toISOString()): AgentRunLog {
  const run: AgentRunLog = {
    id: `run-${randomUUID()}`,
    agentName,
    status: "running",
    inputCount: 0,
    outputCount: 0,
    summary: "Running...",
    startedAt,
    demo: false,
  };
  state.runs.unshift(run);
  return run;
}

export function finalizeAgentRun(runId: string, result: AgentRunResult, error?: string): void {
  const run = state.runs.find((r) => r.id === runId);
  if (run) {
    run.status = result.success ? "success" : "failed";
    run.outputCount = result.outputCount;
    run.summary = result.summary;
    run.error = error;
    run.finishedAt = new Date().toISOString();
    run.demo = result.demo;
  }
  state.results[result.agentName] = result;
}

export function getAgentStatuses(agentNames: string[]) {
  ensureSeeded();
  return agentNames.map((name) => {
    const latest = state.runs.find((r) => r.agentName === name);
    return {
      name,
      status: latest?.status ?? "idle",
      lastRunAt: latest?.finishedAt ?? null,
      outputCount: latest?.outputCount ?? 0,
      summary: latest?.summary ?? "Never run",
      demo: latest?.demo ?? false,
    };
  });
}

export function getAgentResult(name: string): AgentRunResult | null {
  return state.results[name] ?? null;
}

// ─── Notification Prefs ──────────────────────────────────────────────────────

export function getNotificationPrefs(userId = "demo-user"): NotificationPref {
  ensureSeeded();
  return (
    state.notificationPrefs.get(userId) ?? {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      digestFrequency: "weekly",
      gmailConnected: false,
      createdAt: new Date().toISOString(),
    }
  );
}

export function updateNotificationPrefs(userId: string, patch: Partial<NotificationPref>): NotificationPref {
  const existing = getNotificationPrefs(userId);
  const updated = { ...existing, ...patch };
  state.notificationPrefs.set(userId, updated);
  return updated;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export function getDashboardStats(userId = "demo-user") {
  ensureSeeded();
  return {
    companiesWatched: state.watchlist.filter((w) => w.userId === userId).length,
    rulesActive: state.rules.filter((r) => r.userId === userId && r.enabled).length,
    eventsDetectedToday: state.events.filter((e) => {
      const today = new Date().toDateString();
      return new Date(e.detectedAt).toDateString() === today;
    }).length,
    alertsQueued: state.notifications.filter((n) => !n.readAt).length,
    gmailDraftsCreated: state.gmailDrafts.filter((d) => d.userId === userId).length,
    messagesSimulated: state.simulatedSms.filter((s) => s.userId === userId).length,
    investorBriefs: state.actions.filter((a) => a.actionType === "investor_brief").length,
    totalActions: state.actions.length,
  };
}
