import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/agents/similarity";
import { rankAndExplainInvestorThesis } from "@/lib/agents/groqRanker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stage, sectors, checkSize, traction, excludedSectors } = body;
    
    const thesisString = `
      Stage Focus: ${stage || "Any"}
      Sector Focus: ${sectors || "Agnostic"}
      Check Size: ${checkSize || "Not specified"}
      Traction Requirement: ${traction || "None"}
      Excluded Sectors: ${excludedSectors || "None"}
    `.trim();

    // 1. Semantic search for initial candidates
    const topCandidates = await searchCompanies(thesisString, 20);
    
    // 2. Rank and explain using LLM
    const ranked = await rankAndExplainInvestorThesis(thesisString, topCandidates.map(c => c.company));
    
    return NextResponse.json({ results: ranked });
  } catch (err) {
    console.error("Investor Thesis Agent Error:", err);
    return NextResponse.json({ error: "Failed to process thesis." }, { status: 500 });
  }
}
