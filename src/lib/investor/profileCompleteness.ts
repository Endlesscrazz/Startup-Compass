import type { Company } from "@/lib/map-config";

export interface ProfileCompletenessResult {
  score: number;
  missingFields: string[];
  completedFields: string[];
}

type Check = {
  id: string;
  label: string;
  test: (c: Company) => boolean;
};

const CHECKS: Check[] = [
  { id: "name", label: "Company name", test: (c) => Boolean(c.name?.trim()) },
  { id: "website", label: "Website", test: (c) => Boolean(c.website?.trim()) },
  { id: "sector", label: "Sector", test: (c) => Boolean(c.sector?.trim()) },
  {
    id: "linkedin",
    label: "LinkedIn",
    test: (c) => Boolean(c.linkedin?.trim()),
  },
  {
    id: "description",
    label: "Description",
    test: (c) => Boolean(c.description?.trim()),
  },
  { id: "address", label: "Address", test: (c) => Boolean(c.address?.trim()) },
  {
    id: "employees",
    label: "Team size",
    test: (c) =>
      Boolean(c.employees?.trim()) && c.employees !== "Unknown",
  },
  {
    id: "stage",
    label: "Stage",
    test: (c) => Boolean(c.stage?.trim()) && c.stage !== "Unknown",
  },
  { id: "city", label: "City / location", test: (c) => Boolean(c.city?.trim()) },
];

/**
 * Investor-readiness score from fields present in `Company` (dataset-driven).
 * Fields not present in the schema are omitted rather than hardcoded false negatives.
 */
export function computeProfileCompleteness(company: Company): ProfileCompletenessResult {
  const completedFields: string[] = [];
  const missingFields: string[] = [];

  for (const ch of CHECKS) {
    if (ch.test(company)) completedFields.push(ch.label);
    else missingFields.push(ch.label);
  }

  const score =
    CHECKS.length === 0
      ? 0
      : Math.round((completedFields.length / CHECKS.length) * 100);

  return { score, missingFields, completedFields };
}
