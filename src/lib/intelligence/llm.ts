import Groq from "groq-sdk";

let client: Groq | null = null;

function getGroqClient() {
  const apiKey = process.env.LLM_API_KEY ?? process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Groq({ apiKey });
  return client;
}

const MODEL = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";

export async function completeJson<T>(
  system: string,
  user: string,
  fallback: T,
): Promise<{ data: T; demo: boolean }> {
  const groq = getGroqClient();
  if (!groq) return { data: fallback, demo: true };
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.25,
      max_tokens: 2000,
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const clean = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    return { data: JSON.parse(clean) as T, demo: false };
  } catch {
    return { data: fallback, demo: true };
  }
}
