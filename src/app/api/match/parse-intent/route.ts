import { NextRequest, NextResponse } from "next/server";
import { completeJson } from "@/lib/agents/llm";
import { parseIntentDeterministic } from "@/lib/recommendation/parseIntent";
import type { Goal, Stage } from "@/lib/profile";

const GOAL_OPTS = [
  "Start a Business",
  "Funding",
  "Mentorship",
  "Workspace",
  "International",
  "Scaling",
] as const;

const STAGE_OPTS = ["idea", "building", "revenue", "growth"] as const;

function normGoal(g: string | null | undefined): Goal | null {
  if (!g) return null;
  return (GOAL_OPTS as readonly string[]).includes(g) ? (g as Goal) : null;
}

function normStage(s: string | null | undefined): Stage | null {
  if (!s) return null;
  return (STAGE_OPTS as readonly string[]).includes(s) ? (s as Stage) : null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const query =
    typeof body === "object" && body !== null && "query" in body
      ? String((body as { query: unknown }).query ?? "").trim()
      : "";
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const det = parseIntentDeterministic(query);

  const system = `You map founder natural language to structured filters for a Utah resource directory.
Return JSON only:
{"chips": string[], "goal": string|null, "stage": string|null, "sectorHint": string|null, "appendToProfile": string|null}

Rules:
- chips: 2-5 short labels (Title Case) the UI can show as removable chips.
- goal: one of ${GOAL_OPTS.join(", ")} or null.
- stage: one of ${STAGE_OPTS.join(", ")} or null.
- sectorHint: short free-text sector label or null.
- appendToProfile: one concise English sentence to prepend to improve semantic search, or null.
No markdown, no extra keys.`;

  const fallback = {
    chips: det.chips,
    goal: det.goal,
    stage: det.stage,
    sectorHint: det.sectorHint,
    appendToProfile: det.appendToProfile,
  };

  const { data } = await completeJson<typeof fallback>(
    system,
    query.slice(0, 1200),
    fallback,
  );

  const chips = [...new Set([...(data.chips ?? []), ...det.chips])].slice(0, 8);
  const goal = normGoal(data.goal) ?? det.goal;
  const stage = normStage(data.stage) ?? det.stage;
  const sectorHint = data.sectorHint ?? det.sectorHint;
  const appendRaw = data.appendToProfile ?? det.appendToProfile;
  const appendToProfile =
    appendRaw && String(appendRaw).trim() ? String(appendRaw).trim() : null;

  return NextResponse.json({
    chips,
    goal,
    stage,
    sectorHint,
    appendToProfile,
  });
}
