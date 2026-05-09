import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type UserAppStatePayload = {
  investorWatchlistIds: string[];
  investorWatchlistMeta: Prisma.JsonValue;
  savedSearchesJson: Prisma.JsonValue;
  userRole: string | null;
  digestSubscribed: boolean;
};

const emptyPayload = (): UserAppStatePayload => ({
  investorWatchlistIds: [],
  investorWatchlistMeta: {},
  savedSearchesJson: [],
  userRole: null,
  digestSubscribed: true,
});

export async function getUserAppStateDb(userId: string): Promise<UserAppStatePayload | null> {
  const row = await prisma.userAppState.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    investorWatchlistIds: (row.investorWatchlistIds as string[] | null) ?? [],
    investorWatchlistMeta: row.investorWatchlistMeta ?? {},
    savedSearchesJson: row.savedSearchesJson ?? [],
    userRole: row.userRole,
    digestSubscribed: row.digestSubscribed,
  };
}

export async function patchUserAppStateDb(
  userId: string,
  patch: Partial<UserAppStatePayload>,
): Promise<UserAppStatePayload> {
  const existing = await getUserAppStateDb(userId);
  const base = existing ?? emptyPayload();
  const next: UserAppStatePayload = {
    investorWatchlistIds:
      patch.investorWatchlistIds !== undefined
        ? patch.investorWatchlistIds
        : base.investorWatchlistIds,
    investorWatchlistMeta:
      patch.investorWatchlistMeta !== undefined
        ? patch.investorWatchlistMeta
        : base.investorWatchlistMeta,
    savedSearchesJson:
      patch.savedSearchesJson !== undefined
        ? patch.savedSearchesJson
        : base.savedSearchesJson,
    userRole: patch.userRole !== undefined ? patch.userRole : base.userRole,
    digestSubscribed:
      patch.digestSubscribed !== undefined ? patch.digestSubscribed : base.digestSubscribed,
  };

  await prisma.userAppState.upsert({
    where: { userId },
    create: {
      userId,
      investorWatchlistIds: next.investorWatchlistIds,
      investorWatchlistMeta: next.investorWatchlistMeta as Prisma.InputJsonValue,
      savedSearchesJson: next.savedSearchesJson as Prisma.InputJsonValue,
      userRole: next.userRole,
      digestSubscribed: next.digestSubscribed,
    },
    update: {
      investorWatchlistIds: next.investorWatchlistIds,
      investorWatchlistMeta: next.investorWatchlistMeta as Prisma.InputJsonValue,
      savedSearchesJson: next.savedSearchesJson as Prisma.InputJsonValue,
      userRole: next.userRole,
      digestSubscribed: next.digestSubscribed,
    },
  });

  return next;
}
