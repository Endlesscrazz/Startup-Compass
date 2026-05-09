/**
 * When DATABASE_URL is set, user prefs + watchlist use Postgres via Prisma.
 * Otherwise falls back to the in-memory maps in store.ts (single-process only).
 */
import { isDatabaseConfigured } from "@/lib/prisma";
import * as notifDb from "@/lib/db/notificationPrefsDb";
import * as wlDb from "@/lib/db/watchlistDb";
import * as appStateDb from "@/lib/db/userAppStateDb";
import {
  getNotificationPreferences as memGetPrefs,
  upsertNotificationPreferences as memUpsertPrefs,
  getWatchlistRows as memGetWatchlistRows,
  getWatchlistRow as memGetWatchlistRow,
  getAllWatchlistRows as memGetAllWatchlistRows,
  addWatchlistRow as memAddWatchlistRow,
  removeWatchlistRow as memRemoveWatchlistRow,
  syncWatchlistIds as memSyncWatchlistIds,
} from "@/lib/intelligence/store";
import type { NotificationPreferences, WatchlistRow } from "@/lib/intelligence/types";
import type { WatchlistAlertCondition } from "@/lib/intelligence/types";

export function isDbEnabled(): boolean {
  return isDatabaseConfigured();
}

export async function getNotificationPreferencesResolved(
  userId: string,
): Promise<NotificationPreferences> {
  if (isDbEnabled()) return notifDb.getNotificationPreferencesDb(userId);
  return memGetPrefs(userId);
}

export async function upsertNotificationPreferencesResolved(
  userId: string,
  patch: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>,
): Promise<NotificationPreferences> {
  if (isDbEnabled()) return notifDb.upsertNotificationPreferencesDb(userId, patch);
  return memUpsertPrefs(userId, patch);
}

export async function getWatchlistRowsResolved(userId: string): Promise<WatchlistRow[]> {
  if (isDbEnabled()) return wlDb.getWatchlistRowsDb(userId);
  return memGetWatchlistRows(userId);
}

export async function getWatchlistRowResolved(
  userId: string,
  companyId: string,
): Promise<WatchlistRow | null> {
  if (isDbEnabled()) return wlDb.getWatchlistRowDb(userId, companyId);
  return memGetWatchlistRow(userId, companyId);
}

export async function addWatchlistRowResolved(input: {
  user_id: string;
  company_id: string;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  alert_conditions_json?: WatchlistAlertCondition[];
}): Promise<WatchlistRow> {
  if (isDbEnabled()) return wlDb.addWatchlistRowDb(input);
  return memAddWatchlistRow(input);
}

export async function removeWatchlistRowResolved(
  userId: string,
  companyId: string,
): Promise<boolean> {
  if (isDbEnabled()) return wlDb.removeWatchlistRowDb(userId, companyId);
  return memRemoveWatchlistRow(userId, companyId);
}

export async function syncWatchlistIdsResolved(
  userId: string,
  companyIds: string[],
): Promise<WatchlistRow[]> {
  if (isDbEnabled()) {
    const prefs = await getNotificationPreferencesResolved(userId);
    return wlDb.syncWatchlistIdsDb(userId, companyIds, {
      email_enabled: prefs.email_enabled,
      sms_enabled: prefs.sms_enabled,
    });
  }
  memSyncWatchlistIds(userId, companyIds);
  return memGetWatchlistRows(userId);
}

export async function listWatchlistUserIdsForCompany(companyId: string): Promise<string[]> {
  if (isDbEnabled()) return wlDb.listUserIdsWatchingCompanyDb(companyId);
  return [
    ...new Set(
      memGetAllWatchlistRows()
        .filter((w) => w.company_id === companyId)
        .map((w) => w.user_id),
    ),
  ];
}

export const getUserAppStateDb = appStateDb.getUserAppStateDb;
export const patchUserAppStateDb = appStateDb.patchUserAppStateDb;
export type { UserAppStatePayload } from "@/lib/db/userAppStateDb";
