import { NextRequest, NextResponse } from "next/server";
import { resolveCounty } from "@/lib/counties";
import { composeProfileString, type QuizAnswers, type Goal, type Stage } from "@/lib/profile";
import { embedText } from "@/lib/embed";
import { rankResources, type MatchCandidate } from "@/lib/match";
import { generateExplanations } from "@/lib/explain";

// Quiz UI label → data field value normalization
const COMMUNITY_LABEL_MAP: Record<string, string> = {
  "Veteran-owned": "Veteran",
  "Woman-owned": "Women",
  "Rural business": "Rural",
  "University student": "Student",
  // Accept normalized values passed directly
  "Veteran": "Veteran",
  "Women": "Women",
  "Rural": "Rural",
  "Student": "Student",
};

interface MatchRequestBody {
  stage: Stage;
  sector: string;
  city: string;
  goal: Goal;
  community?: string[];
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

  const { stage, sector, city, goal, community = [] } = body;

  if (!stage || !sector || !city || !goal) {
    return NextResponse.json(
      { error: "Missing required fields: stage, sector, city, goal" },
      { status: 400 }
    );
  }

  // Normalize community tags from UI labels → data field values
  const normalizedCommunity = community
    .map((c) => COMMUNITY_LABEL_MAP[c] ?? c)
    .filter(Boolean);

  // Resolve city → county
  const county = resolveCounty(city);
  if (!county) {
    return NextResponse.json(
      {
        error: `Could not resolve "${city}" to a Utah county. Try entering your county name directly (e.g. "Salt Lake County").`,
      },
      { status: 422 }
    );
  }

  const answers: QuizAnswers = {
    stage,
    sector,
    city,
    county,
    goal,
    community: normalizedCommunity,
  };

  // Compose profile string → embed
  const profileString = composeProfileString(answers);

  let profileVector: Float32Array;
  try {
    profileVector = await embedText(profileString);
  } catch {
    return NextResponse.json(
      { error: "Matching service temporarily unavailable" },
      { status: 503 }
    );
  }

  // Rank resources
  const candidates: MatchCandidate[] = rankResources(
    profileVector,
    county,
    goal,
    sector,
    normalizedCommunity
  );

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No resources found for your location and criteria." },
      { status: 404 }
    );
  }

  // Generate LLM explanations (non-fatal if it fails)
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
    score: Math.round(score * 1000) / 1000,
  }));

  const response: MatchResponse = { results, profileString, county };
  return NextResponse.json(response);
}
