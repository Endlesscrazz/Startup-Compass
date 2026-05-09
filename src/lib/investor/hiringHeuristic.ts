/**
 * No hiring field in current dataset — infer from public description text only.
 */
const HIRING_RE = /\b(hiring|we hire|we're hiring|were hiring|careers|career page|open roles|open positions|join (our|the) team|jobs at)\b/i;

export function inferHiringFromDescription(description: string | null): boolean {
  if (!description) return false;
  return HIRING_RE.test(description);
}
