import { NextResponse } from "next/server";

/** Reserved for server-side / cron triggers. Clients should use watchlist-driven alerts or /test. */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Use watchlist change events or POST /api/notifications/sms/test" },
    { status: 405 },
  );
}
