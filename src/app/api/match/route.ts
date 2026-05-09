import { NextRequest, NextResponse } from "next/server";
import { resolveCounty } from "@/lib/counties";
import { composeProfileString, type QuizAnswers, type Goal, type Stage } from "@/lib/profile";
import { embedText } from "@/lib/embed";
import { rankResources, type MatchCandidate } from "@/lib/match";
import { generateExplanations } from "@/lib/explain";
import { sanitizeDescription } from "@/lib/sanitize";

const COMMUNITY_LABEL_MAP: Record<string, string> = {
  "Veteran-owned": "Veteran",
  "Woman-owned": "Women",
  "Rural business": "Rural",
  "University student": "Student",
  "Veteran": "Veteran",
  "Women": "Women",
  "Rural": "Rural",
  "Student": "Student",
};

// Path A — quiz fields (all required together)
interface QuizRequestBody {
  stage: Stage;
  sector: string;
  city: string;
  goal: Goal;
  community?: string[];
}

// Path B — natural language description + city
interface NLRequestBody {
  description: string;
  city: string;
}

type MatchRequestBody = QuizRequestBody | NLRequestBody;

function isNLPath(body: MatchRequestBody): body is NLRequestBody {
  return "description" in body && typeof (body as NLRequestBody).description === "string";
}

export interface MatchResultItem {
  id: number;
  title: string;
  description: string;
  explanation: string;
  link: string | null;
  email: string | null;
  topics: string[];
  communities: string[];
  industries: string[];
  locations: string[];
  score: number;
}

export interface MatchResponse {
  results: MatchResultItem[];
  profileString: string;
  county: string;
}

export async function POST(req: NextRequest) {
  let body: MatchRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const city = body.city?.trim();
  if (!city) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  const county = resolveCounty(city);
  if (!county) {
    return NextResponse.json(
      { error: `Could not resolve "${city}" to a Utah county. Try entering your county name directly (e.g. "Salt Lake County").` },
      { status: 422 }
    );
  }

  let profileString: string;
  let goal: Goal | null = null;
  let sector: string | null = null;
  let community: string[] = [];

  if (isNLPath(body)) {
    // ── Path B: natural language ──────────────────────────────────────────
    const clean = sanitizeDescription(body.description);
    if (!clean) {
      return NextResponse.json({ error: "description is empty after sanitization" }, { status: 400 });
    }
    profileString = clean;
    // goal/sector/community intentionally null — pure cosine, no boost (DECISION-17)
  } else {
    // ── Path A: quiz ──────────────────────────────────────────────────────
    const { stage, sector: rawSector, goal: rawGoal, community: rawCommunity = [] } = body;
    if (!stage || !rawSector || !rawGoal) {
      return NextResponse.json(
        { error: "Provide either description (NL path) or stage + sector + goal (quiz path)" },
        { status: 400 }
      );
    }
    community = rawCommunity.map((c) => COMMUNITY_LABEL_MAP[c] ?? c).filter(Boolean);
    goal = rawGoal;
    sector = rawSector;

    const answers: QuizAnswers = { stage, sector, city, county, goal, community };
    profileString = composeProfileString(answers);
  }

  let profileVector: Float32Array;
  try {
    profileVector = await embedText(profileString);
  } catch {
    return NextResponse.json({ error: "Matching service temporarily unavailable" }, { status: 503 });
  }

  const candidates: MatchCandidate[] = rankResources(
    profileVector,
    county,
    goal,
    sector,
    community
  );

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No resources found for your location and criteria." },
      { status: 404 }
    );
  }

  const explanations = await generateExplanations(
    profileString,
    candidates.map((c) => c.entry)
  );

  const results: MatchResultItem[] = candidates.map(({ entry, score }) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    explanation: explanations.get(entry.id) ?? entry.description.slice(0, 120),
    link: entry.link,
    email: entry.email,
    topics: entry.topics,
    communities: entry.communities,
    industries: entry.industries,
    locations: entry.locations,
    score: Math.round(score * 1000) / 1000,
  }));

  return NextResponse.json({ results, profileString, county } satisfies MatchResponse);
}
