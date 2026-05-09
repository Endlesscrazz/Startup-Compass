/**
 * Parse fetch Response JSON without throwing on empty or non-JSON bodies.
 */
export async function readResponseJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text?.trim()) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
