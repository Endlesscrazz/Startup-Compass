import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/agents/similarity";
import { rankAndExplainJobHunter } from "@/lib/agents/groqRanker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, skills, experience, sectors, remotePreference } = body;
    
    const profileString = `
      Target Role: ${role || "Any"}
      Key Skills: ${skills || "Not specified"}
      Experience Level: ${experience || "Any"}
      Sector Interests: ${sectors || "Any"}
      Remote Preference: ${remotePreference || "Any"}
    `.trim();

    // 1. Semantic search for initial candidates (filter to hiring companies)
    const topCandidates = await searchCompanies(profileString, 15, (c) => c.company.hiringStatus === "hiring");
    
    // 2. Rank and write outreach using LLM
    const ranked = await rankAndExplainJobHunter(profileString, topCandidates.map(c => c.company));
    
    return NextResponse.json({ results: ranked });
  } catch (err) {
    console.error("Job Hunter Agent Error:", err);
    return NextResponse.json({ error: "Failed to process job match." }, { status: 500 });
  }
}
