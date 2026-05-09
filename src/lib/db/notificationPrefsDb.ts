import { prisma } from "@/lib/prisma";
import type {
  AudienceType,
  EmailFrequency,
  NotificationPreferences,
  SmsMinPriority,
} from "@/lib/intelligence/types";
import type { NotificationPreference as NPRow, Prisma } from "@prisma/client";

function rowToDomain(row: NPRow): NotificationPreferences {
  return {
    id: `np-${row.userId}`,
    user_id: row.userId,
    email_enabled: row.emailEnabled,
    sms_enabled: row.smsEnabled,
    phone_number: row.phoneNumber,
    sms_verified: row.smsVerified,
    email_frequency: row.emailFrequency as EmailFrequency,
    sms_min_priority: row.smsMinPriority as SmsMinPriority,
    quiet_hours_json: row.quietHoursJson as NotificationPreferences["quiet_hours_json"],
    brief_audience_preference: row.briefAudiencePreference as AudienceType,
    personalization_disabled: row.personalizationDisabled,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function defaultCreate(userId: string) {
  const t = new Date();
  return {
    userId,
    emailEnabled: true,
    smsEnabled: false,
    phoneNumber: null as string | null,
    smsVerified: false,
    emailFrequency: "after_meaningful_activity",
    smsMinPriority: "medium",
    quietHoursJson: { start: "22:00", end: "07:00", timezone: "America/Denver" },
    briefAudiencePreference: "unknown",
    personalizationDisabled: false,
    createdAt: t,
    updatedAt: t,
  };
}

export async function getNotificationPreferencesDb(userId: string): Promise<NotificationPreferences> {
  let row = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!row) {
    row = await prisma.notificationPreference.create({ data: defaultCreate(userId) });
  }
  return rowToDomain(row);
}

export async function upsertNotificationPreferencesDb(
  userId: string,
  patch: Partial<
    Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">
  >,
): Promise<NotificationPreferences> {
  const cur = await getNotificationPreferencesDb(userId);
  const next = {
    emailEnabled: patch.email_enabled ?? cur.email_enabled,
    smsEnabled: patch.sms_enabled ?? cur.sms_enabled,
    phoneNumber: patch.phone_number !== undefined ? patch.phone_number : cur.phone_number,
    smsVerified: patch.sms_verified ?? cur.sms_verified,
    emailFrequency: patch.email_frequency ?? cur.email_frequency,
    smsMinPriority: patch.sms_min_priority ?? cur.sms_min_priority,
    quietHoursJson:
      patch.quiet_hours_json !== undefined ? patch.quiet_hours_json : cur.quiet_hours_json,
    briefAudiencePreference:
      patch.brief_audience_preference ?? cur.brief_audience_preference,
    personalizationDisabled:
      patch.personalization_disabled ?? cur.personalization_disabled,
    updatedAt: new Date(),
  };

  const row = await prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      emailEnabled: next.emailEnabled,
      smsEnabled: next.smsEnabled,
      phoneNumber: next.phoneNumber,
      smsVerified: next.smsVerified,
      emailFrequency: next.emailFrequency,
      smsMinPriority: next.smsMinPriority,
      quietHoursJson: next.quietHoursJson as Prisma.InputJsonValue,
      briefAudiencePreference: next.briefAudiencePreference,
      personalizationDisabled: next.personalizationDisabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      emailEnabled: next.emailEnabled,
      smsEnabled: next.smsEnabled,
      phoneNumber: next.phoneNumber,
      smsVerified: next.smsVerified,
      emailFrequency: next.emailFrequency,
      smsMinPriority: next.smsMinPriority,
      quietHoursJson: next.quietHoursJson as Prisma.InputJsonValue,
      briefAudiencePreference: next.briefAudiencePreference,
      personalizationDisabled: next.personalizationDisabled,
      updatedAt: new Date(),
    },
  });
  return rowToDomain(row);
}
