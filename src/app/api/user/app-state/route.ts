import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { UserAppStatePayload } from "@/lib/db/userAppStateDb";
import {
  getUserAppStateDb,
  isDbEnabled,
  patchUserAppStateDb,
  syncWatchlistIdsResolved,
} from "@/lib/intelligence/persistence";

const emptyState = (): UserAppStatePayload => ({
  investorWatchlistIds: [],
  investorWatchlistMeta: {},
  savedSearchesJson: [],
  userRole: null,
  digestSubscribed: true,
});

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    }
    if (!isDbEnabled()) {
      return NextResponse.json({
        success: true,
        data: emptyState(),
        persistence: "memory",
      });
    }
    const data = await getUserAppStateDb(userId);
    return NextResponse.json({
      success: true,
      data: data ?? emptyState(),
      persistence: "database",
    });
  } catch (e) {
    console.error("[app-state GET]", e);
    return NextResponse.json(
      { success: false, error: "Could not load app state. Check DATABASE_URL and migrations." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    }
    if (!isDbEnabled()) {
      return NextResponse.json(
        { success: false, error: "Set DATABASE_URL to sync preferences across devices." },
        { status: 503 },
      );
    }

    let body: Partial<{
      investorWatchlistIds: string[];
      investorWatchlistMeta: UserAppStatePayload["investorWatchlistMeta"];
      savedSearchesJson: UserAppStatePayload["savedSearchesJson"];
      userRole: string | null;
      digestSubscribed: boolean;
    }>;
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const next = await patchUserAppStateDb(userId, {
      ...(body.investorWatchlistIds !== undefined
        ? { investorWatchlistIds: body.investorWatchlistIds }
        : {}),
      ...(body.investorWatchlistMeta !== undefined
        ? { investorWatchlistMeta: body.investorWatchlistMeta }
        : {}),
      ...(body.savedSearchesJson !== undefined
        ? { savedSearchesJson: body.savedSearchesJson }
        : {}),
      ...(body.userRole !== undefined ? { userRole: body.userRole } : {}),
      ...(body.digestSubscribed !== undefined
        ? { digestSubscribed: body.digestSubscribed }
        : {}),
    });

    if (Array.isArray(body.investorWatchlistIds)) {
      await syncWatchlistIdsResolved(userId, body.investorWatchlistIds);
    }

    return NextResponse.json({ success: true, data: next });
  } catch (e) {
    console.error("[app-state PATCH]", e);
    return NextResponse.json(
      { success: false, error: "Could not save app state. Check DATABASE_URL and migrations." },
      { status: 500 },
    );
  }
}
