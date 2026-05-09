import { NextResponse } from "next/server";

const LS_STORE: Array<{ email: string; role: string | null; subscribedAt: string }> = [];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      role?: string | null;
    };

    const email = body.email?.trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Deduplicate
    const exists = LS_STORE.some((r) => r.email === email);
    if (exists) {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    LS_STORE.push({
      email,
      role: body.role ?? null,
      subscribedAt: new Date().toISOString(),
    });

    console.info(
      `[Digest] New subscriber: ${email} (role: ${body.role ?? "none"}) — total: ${LS_STORE.length}`,
    );

    // TODO Phase 2: persist to Supabase + send welcome email via Resend
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  // Admin endpoint — returns count only (no emails)
  return NextResponse.json({ count: LS_STORE.length });
}
