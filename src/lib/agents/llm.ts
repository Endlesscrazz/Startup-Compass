import Groq from "groq-sdk";

let client: Groq | null = null;

function getGroqClient() {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    client = new Groq({ apiKey });
  }
  return client;
}

export async function completeJson<T>(
  system: string,
  user: string,
  fallback: T,
): Promise<{ data: T; demo: boolean }> {
  const groq = getGroqClient();
  if (!groq) return { data: fallback, demo: true };
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 1800,
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

export async function completeText(
  system: string,
  user: string,
  fallback: string,
): Promise<{ text: string; demo: boolean }> {
  const groq = getGroqClient();
  if (!groq) return { text: fallback, demo: true };
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text) return { text: fallback, demo: true };
    return { text, demo: false };
  } catch {
    return { text: fallback, demo: true };
  }
}
