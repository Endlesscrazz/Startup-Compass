import { prisma } from "@/lib/prisma";
import type { WatchlistAlertCondition, WatchlistRow } from "@/lib/intelligence/types";
import type { Prisma, WatchlistEntry as WLRow } from "@prisma/client";

const DEFAULT_ALERTS: WatchlistAlertCondition[] = [
  "hiring_status_changed",
  "new_job_posting",
  "profile_updated",
  "stage_changed",
  "employee_count_changed",
  "funding_signal_added",
  "high_relevance_to_user_intent",
];

function rowToDomain(r: WLRow): WatchlistRow {
  return {
    id: r.id,
    user_id: r.userId,
    company_id: r.companyId,
    email_enabled: r.emailEnabled,
    sms_enabled: r.smsEnabled,
    alert_conditions_json: r.alertConditionsJson as WatchlistRow["alert_conditions_json"],
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  };
}

export async function getWatchlistRowsDb(userId: string): Promise<WatchlistRow[]> {
  const rows = await prisma.watchlistEntry.findMany({ where: { userId } });
  return rows.map(rowToDomain);
}

export async function getWatchlistRowDb(
  userId: string,
  companyId: string,
): Promise<WatchlistRow | null> {
  const r = await prisma.watchlistEntry.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
  return r ? rowToDomain(r) : null;
}

export async function listUserIdsWatchingCompanyDb(companyId: string): Promise<string[]> {
  const rows = await prisma.watchlistEntry.findMany({
    where: { companyId },
    select: { userId: true },
  });
  return [...new Set(rows.map((x) => x.userId))];
}

export async function addWatchlistRowDb(input: {
  user_id: string;
  company_id: string;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  alert_conditions_json?: WatchlistAlertCondition[];
}): Promise<WatchlistRow> {
  const existing = await getWatchlistRowDb(input.user_id, input.company_id);
  const t = new Date();
  if (existing) {
    const row = await prisma.watchlistEntry.update({
      where: { userId_companyId: { userId: input.user_id, companyId: input.company_id } },
      data: {
        updatedAt: t,
        ...(input.email_enabled !== undefined ? { emailEnabled: input.email_enabled } : {}),
        ...(input.sms_enabled !== undefined ? { smsEnabled: input.sms_enabled } : {}),
        ...(input.alert_conditions_json
          ? { alertConditionsJson: input.alert_conditions_json as Prisma.InputJsonValue }
          : {}),
      },
    });
    return rowToDomain(row);
  }
  const row = await prisma.watchlistEntry.create({
    data: {
      userId: input.user_id,
      companyId: input.company_id,
      emailEnabled: input.email_enabled ?? true,
      smsEnabled: input.sms_enabled ?? false,
      alertConditionsJson: (input.alert_conditions_json ??
        DEFAULT_ALERTS) as Prisma.InputJsonValue,
    },
  });
  return rowToDomain(row);
}

export async function removeWatchlistRowDb(userId: string, companyId: string): Promise<boolean> {
  try {
    await prisma.watchlistEntry.delete({
      where: { userId_companyId: { userId, companyId } },
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncWatchlistIdsDb(
  userId: string,
  companyIds: string[],
  prefs: { email_enabled: boolean; sms_enabled: boolean },
): Promise<WatchlistRow[]> {
  if (companyIds.length === 0) {
    await prisma.watchlistEntry.deleteMany({ where: { userId } });
    return [];
  }
  const set = new Set(companyIds);
  await prisma.watchlistEntry.deleteMany({
    where: { userId, companyId: { notIn: [...set] } },
  });
  for (const id of companyIds) {
    await addWatchlistRowDb({
      user_id: userId,
      company_id: id,
      email_enabled: prefs.email_enabled,
      sms_enabled: prefs.sms_enabled,
    });
  }
  return getWatchlistRowsDb(userId);
}
