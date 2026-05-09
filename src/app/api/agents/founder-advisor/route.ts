import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/embed";
import { rankResources } from "@/lib/match";
import { adviseFounderResource } from "@/lib/agents/groqRanker";
import { resolveCounty } from "@/lib/counties";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stage, sector, teamSize, funding, challenge, city } = body;
    
    const profileString = `
      Stage: ${stage || "Any"}
      Sector: ${sector || "Any"}
      Team Size: ${teamSize || "Any"}
      Funding Status: ${funding || "Any"}
      Challenge: ${challenge || "None specified"}
    `.trim();

    const county = city ? resolveCounty(city) : null;

    // 1. Semantic search for resources
    const queryVector = await embedText(profileString);
    const candidates = rankResources(queryVector, county || "Utah", null, null, []);
    
    // 2. Select top K resources
    const topCandidates = candidates.slice(0, 5).map(c => c.entry);

    // 3. Advise using LLM
    const adviceList = await adviseFounderResource(challenge, topCandidates);
    
    // Combine resources with advice
    const results = topCandidates.map(c => {
      const adviceItem = adviceList.find(a => a.id === String(c.id));
      return {
        resource: c,
        advice: adviceItem?.advice || "Consider exploring this resource for your current stage.",
        actionSteps: adviceItem?.actionSteps || ["Review their website", "Check eligibility", "Contact their team"],
      };
    });
    
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Founder Advisor Agent Error:", err);
    return NextResponse.json({ error: "Failed to process advisor request." }, { status: 500 });
  }
}
