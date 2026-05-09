// Sanitizes user-provided free-text before it enters the LLM prompt.
// The embedding step is safe (vectors don't execute instructions).
// The risk is the Groq explanation call where profileString appears in the user prompt.

const MAX_DESCRIPTION_CHARS = 500;

export function sanitizeDescription(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")           // strip HTML/script tags
    .replace(/[^\x20-\x7E\n]/g, " ")   // drop non-printable characters
    .replace(/\s+/g, " ")              // collapse whitespace
    .trim()
    .slice(0, MAX_DESCRIPTION_CHARS);
}
