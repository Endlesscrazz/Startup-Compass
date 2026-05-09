import Groq from "groq-sdk";
import type { Company } from "@/lib/map-config";

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    _client = new Groq({ apiKey });
  }
  return _client;
}

export interface RankedCompany {
  company: Company;
  fitScore: number;
  rationale: string;
}

export async function rankAndExplainInvestorThesis(
  thesis: string,
  candidates: Company[]
): Promise<RankedCompany[]> {
  const client = getClient();
  
  const summaries = candidates.map(c => ({
    id: c.id,
    name: c.name,
    sector: c.sector,
    stage: c.stage,
    description: c.description,
  }));

  const systemPrompt = 
    "You are an expert VC associate analyzing startups against an investor's thesis. " +
    "Given the thesis and a list of companies, provide a rationale (1-2 sentences) for why each company fits. " +
    "Also provide a fitScore out of 100 for each company. " +
    "Return a JSON array ONLY with format: [{\"id\": \"company-id\", \"fitScore\": 85, \"rationale\": \"...\"}]";

  const userPrompt = `Investor Thesis:\n${thesis}\n\nCompanies:\n${JSON.stringify(summaries, null, 2)}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  
  let parsed: any[] = [];
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    console.warn("Failed to parse LLM response for rankAndExplainInvestorThesis");
  }

  const result: RankedCompany[] = [];
  for (const c of candidates) {
    const p = parsed.find(item => item.id === c.id);
    result.push({
      company: c,
      fitScore: p?.fitScore ?? 50,
      rationale: p?.rationale ?? "A potential fit based on sector and stage alignment.",
    });
  }

  return result.sort((a, b) => b.fitScore - a.fitScore);
}

export interface JobMatch {
  company: Company;
  fitScore: number;
  outreachMessage: string;
}

export async function rankAndExplainJobHunter(
  profile: string,
  candidates: Company[]
): Promise<JobMatch[]> {
  const client = getClient();
  
  const summaries = candidates.map(c => ({
    id: c.id,
    name: c.name,
    sector: c.sector,
    hiringStatus: c.hiringStatus,
    description: c.description,
  }));

  const systemPrompt = 
    "You are an expert tech recruiter and career coach. " +
    "Given a candidate profile and a list of hiring companies, draft a short, highly personalized cold outreach message (2-3 sentences) the candidate can send to each company's founder or recruiter. " +
    "Also provide a fitScore out of 100. " +
    "Return a JSON array ONLY with format: [{\"id\": \"company-id\", \"fitScore\": 85, \"outreachMessage\": \"...\"}]";

  const userPrompt = `Candidate Profile:\n${profile}\n\nCompanies:\n${JSON.stringify(summaries, null, 2)}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 1500,
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  
  let parsed: any[] = [];
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    console.warn("Failed to parse LLM response for rankAndExplainJobHunter");
  }

  const result: JobMatch[] = [];
  for (const c of candidates) {
    const p = parsed.find(item => item.id === c.id);
    result.push({
      company: c,
      fitScore: p?.fitScore ?? 50,
      outreachMessage: p?.outreachMessage ?? "Hi there, I noticed you're hiring and would love to connect to discuss how my background aligns with your needs.",
    });
  }

  return result.sort((a, b) => b.fitScore - a.fitScore);
}

export interface FounderResourceAdvice {
  id: string;
  advice: string;
  actionSteps: string[];
}

export async function adviseFounderResource(
  challenge: string,
  resources: any[] // From match.ts candidates
): Promise<FounderResourceAdvice[]> {
  const client = getClient();

  const summaries = resources.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
  }));

  const systemPrompt = 
    "You are an elite startup advisor. " +
    "Given a founder's challenge and a list of resources, provide 1 sentence of advice on how they can use each resource to overcome the challenge, and exactly 3 bullet points of next action steps they should take with it. " +
    "Return a JSON array ONLY with format: [{\"id\": \"resource-id\", \"advice\": \"...\", \"actionSteps\": [\"Step 1\", \"Step 2\", \"Step 3\"]}]";

  const userPrompt = `Founder Challenge:\n${challenge}\n\nResources:\n${JSON.stringify(summaries, null, 2)}`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 1500,
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  
  let parsed: any[] = [];
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    console.warn("Failed to parse LLM response for adviseFounderResource");
  }

  return parsed.map(p => ({
    id: String(p.id),
    advice: p.advice || "",
    actionSteps: Array.isArray(p.actionSteps) ? p.actionSteps.slice(0, 3) : [],
  }));
}
