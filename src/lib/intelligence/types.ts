/** Domain types for the quiet backend intelligence layer (in-memory store; swap for DB later). */

export type ActivityEventType =
  | "search_performed"
  | "filter_applied"
  | "company_viewed"
  | "company_followed"
  | "company_unfollowed"
  | "resource_clicked"
  | "saved_search_created"
  | "company_brief_requested"
  | "email_brief_sent"
  | "sms_alert_sent";

export type ActivityEntityType = "company" | "resource" | "search" | "filter" | "none";

export type UserActivityEvent = {
  id: string;
  user_id: string;
  event_type: ActivityEventType;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type AudienceType =
  | "founder"
  | "investor"
  | "job_hunter"
  | "student"
  | "ecosystem_builder"
  | "unknown";

export type UserIntentProfile = {
  id: string;
  user_id: string;
  audience_type: AudienceType;
  sectors_json: string[];
  locations_json: string[];
  company_sizes_json: string[];
  stages_json: string[];
  hiring_interest: boolean;
  resource_interests_json: string[];
  inferred_keywords_json: string[];
  confidence_score: number;
  updated_at: string;
};

export type CompanyInterestScore = {
  id: string;
  user_id: string;
  company_id: string;
  score: number;
  reasons_json: string[];
  last_interaction_at: string;
  interaction_count: number;
  should_include_in_brief: boolean;
  created_at: string;
  updated_at: string;
};

export type WatchlistAlertCondition =
  | "hiring_status_changed"
  | "new_job_posting"
  | "profile_updated"
  | "stage_changed"
  | "employee_count_changed"
  | "funding_signal_added"
  | "company_claimed_profile"
  | "high_relevance_to_user_intent";

export type WatchlistRow = {
  id: string;
  user_id: string;
  company_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  alert_conditions_json: WatchlistAlertCondition[];
  created_at: string;
  updated_at: string;
};

export type EmailFrequency =
  | "after_meaningful_activity"
  | "daily"
  | "weekly"
  | "never";

export type SmsMinPriority = "low" | "medium" | "high";

export type NotificationPreferences = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  phone_number: string | null;
  sms_verified: boolean;
  email_frequency: EmailFrequency;
  sms_min_priority: SmsMinPriority;
  quiet_hours_json: { start: string; end: string; timezone?: string } | null;
  brief_audience_preference: AudienceType;
  personalization_disabled: boolean;
  created_at: string;
  updated_at: string;
};

export type BriefType =
  | "search_session"
  | "company_follow"
  | "weekly_watchlist"
  | "investor_style"
  | "job_hunter";

export type EmailBriefStatus = "preview" | "simulated" | "sent" | "failed";

export type EmailBrief = {
  id: string;
  user_id: string;
  brief_type: BriefType;
  subject: string;
  preview_text: string;
  html_body: string;
  companies_json: { companyId: string; name?: string }[];
  trigger_reason: string;
  status: EmailBriefStatus;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
};

export type SmsAlertStatus = "simulated" | "queued" | "sent" | "failed";

export type SmsAlert = {
  id: string;
  user_id: string;
  company_id: string;
  watchlist_id: string | null;
  event_type: string;
  message_body: string;
  status: SmsAlertStatus;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
};

export type CompanyEventType =
  | "company_added"
  | "profile_updated"
  | "hiring_status_changed"
  | "job_posting_added"
  | "job_posting_removed"
  | "stage_changed"
  | "employee_count_changed"
  | "funding_signal_added"
  | "profile_claimed"
  | "verification_completed"
  | "completeness_improved"
  | "high_intent_match";

export type EventPriority = "low" | "medium" | "high";

export type CompanyEvent = {
  id: string;
  company_id: string;
  event_type: CompanyEventType;
  old_value_json: Record<string, unknown> | null;
  new_value_json: Record<string, unknown> | null;
  priority: EventPriority;
  summary: string;
  created_at: string;
};

export type CompanySnapshot = {
  id: string;
  company_id: string;
  snapshot_json: Record<string, unknown>;
  source: string;
  created_at: string;
};

export type GmailTokenRecord = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
  scope: string;
  updated_at: string;
};
