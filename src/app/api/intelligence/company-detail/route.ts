import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/intelligence/session";
import { listCompanyEvents } from "@/lib/intelligence/store";
import { completeJson } from "@/lib/intelligence/llm";
import { COMPANIES } from "@/lib/map-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("id");

  if (!companyId) {
    return NextResponse.json({ success: false, error: "Missing company id" }, { status: 400 });
  }

  const company = COMPANIES.find((c) => c.id === companyId);
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }

  // 1. Get recent signals/events from store
  const events = listCompanyEvents(companyId, 5);
  console.log(`[company-detail] Found ${events.length} events for ${companyId}`);

  // 2. Generate an AI insight if possible
  const system = `You are a startup analyst for the Utah Governor's Office. 
Provide a single, impactful "Intelligence Insight" for the following company. 
Focus on what a founder or investor would find most useful about their current position or sector in Utah. 
Keep it under 30 words. Do NOT use the word "AI". Do NOT hallucinate funding.
Return JSON: { "insight": "string" }`;

  const user = `Company: ${company.name}
Sector: ${company.sector}
Stage: ${company.stage}
Employees: ${company.employees}
Description: ${company.description?.slice(0, 300) ?? "n/a"}`;

  const fallback = { insight: "Standard profile. Watch for upcoming signals like hiring or funding updates." };
  
  const { data: aiData } = await completeJson<{ insight: string }>(system, user, fallback);
  console.log(`[company-detail] Insight for ${companyId}: ${aiData.insight}`);

  return NextResponse.json({
    success: true,
    data: {
      events,
      insight: aiData.insight,
    },
  });
}

