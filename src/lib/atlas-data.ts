import resourcesJson from "../../data/resources.json";
import {
  COMPANIES,
  getEmployees,
  getSectors,
  getStages,
  type Company,
} from "@/lib/map-config";

export type AtlasResource = {
  id: number;
  title: string;
  description: string;
  communities: string[];
  industries: string[];
  locations: string[];
  topics: string[];
  link: string | null;
  email: string | null;
};

export const RESOURCES = resourcesJson as AtlasResource[];

const UTAH_BOUNDS = {
  minLat: 36.95,
  maxLat: 42.05,
  minLng: -114.07,
  maxLng: -109.0,
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export function formatDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

export function getInitials(value: string) {
  const parts = value
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "UT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function profileCompleteness(company: Company) {
  const fields = [
    company.name,
    company.description,
    company.website,
    company.linkedin,
    company.address,
    company.stage !== "Unknown" ? company.stage : null,
    company.employees !== "Unknown" ? company.employees : null,
    company.sector,
    company.city,
  ];
  return Math.round(
    (fields.filter((field) => Boolean(field)).length / fields.length) * 100,
  );
}

export function getFeaturedCompany() {
  return [...COMPANIES]
    .sort((a, b) => {
      const scoreDiff = profileCompleteness(b) - profileCompleteness(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    })
    .at(0)!;
}

export function getAtlasStats() {
  const cities = new Set(COMPANIES.map((company) => company.city));
  const industries = new Set(
    RESOURCES.flatMap((resource) => resource.industries),
  );
  const topics = new Set(RESOURCES.flatMap((resource) => resource.topics));

  return [
    {
      value: formatCount(COMPANIES.length),
      label: "Verified Startups",
      kind: "startups" as const,
    },
    {
      value: formatCount(RESOURCES.length),
      label: "Founder Resources",
      kind: "resources" as const,
    },
    {
      value: formatCount(cities.size),
      label: "Utah Cities",
      kind: "cities" as const,
    },
    {
      value: formatCount(industries.size),
      label: "Industries Covered",
      kind: "industries" as const,
    },
    {
      value: formatCount(topics.size),
      label: "Resource Topics",
      kind: "topics" as const,
    },
  ];
}

export function getDatasetSourceLabels() {
  return [
    "data/resources.json",
    "data/embeddings.json",
    "src/data/companies.json",
  ];
}

function asPercentPosition(company: Company) {
  const left =
    ((company.lng - UTAH_BOUNDS.minLng) /
      (UTAH_BOUNDS.maxLng - UTAH_BOUNDS.minLng)) *
    100;
  const top =
    ((UTAH_BOUNDS.maxLat - company.lat) /
      (UTAH_BOUNDS.maxLat - UTAH_BOUNDS.minLat)) *
    100;

  return {
    left: `${Math.max(4, Math.min(93, left)).toFixed(1)}%`,
    top: `${Math.max(4, Math.min(94, top)).toFixed(1)}%`,
  };
}

export function getCityClusters(limit = 10) {
  const grouped = new Map<
    string,
    { city: string; count: number; latTotal: number; lngTotal: number }
  >();
  for (const company of COMPANIES) {
    const current = grouped.get(company.city) ?? {
      city: company.city,
      count: 0,
      latTotal: 0,
      lngTotal: 0,
    };
    current.count += 1;
    current.latTotal += company.lat;
    current.lngTotal += company.lng;
    grouped.set(company.city, current);
  }

  const clusters = [...grouped.values()]
    .map((cluster) => {
      const companyLike = {
        lat: cluster.latTotal / cluster.count,
        lng: cluster.lngTotal / cluster.count,
      } as Company;
      return {
        city: cluster.city,
        count: cluster.count,
        ...asPercentPosition(companyLike),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const placed: { left: number; top: number }[] = [];
  const offsets = [
    [0, 0],
    [7, -5],
    [-7, 5],
    [9, 7],
    [-9, -7],
    [13, -1],
    [-13, 1],
    [4, 12],
    [-4, -12],
  ];

  return clusters.map((cluster, index) => {
    const baseLeft = Number.parseFloat(cluster.left);
    const baseTop = Number.parseFloat(cluster.top);
    const offset = offsets[index % offsets.length];
    let next = {
      left: Math.max(4, Math.min(93, baseLeft + offset[0])),
      top: Math.max(4, Math.min(94, baseTop + offset[1])),
    };

    for (let attempts = 0; attempts < offsets.length; attempts += 1) {
      const collides = placed.some(
        (point) =>
          Math.abs(point.left - next.left) < 8 &&
          Math.abs(point.top - next.top) < 8,
      );
      if (!collides) break;
      const retry = offsets[(index + attempts + 1) % offsets.length];
      next = {
        left: Math.max(4, Math.min(93, baseLeft + retry[0])),
        top: Math.max(4, Math.min(94, baseTop + retry[1])),
      };
    }

    placed.push(next);
    return {
      ...cluster,
      left: `${next.left.toFixed(1)}%`,
      top: `${next.top.toFixed(1)}%`,
    };
  });
}

export function getStageFilterOptions() {
  return getStages().map((stage, index) => [
    stage.value,
    index < 3,
    formatCompactCount(stage.count),
  ]) as [string, boolean, string][];
}

export function getSectorFilterSummaries(limit = 4) {
  return getSectors()
    .slice(0, limit)
    .map((sector) => sector.value);
}

export function getEmployeeFilterValue() {
  return (
    getEmployees().find((item) => item.value !== "Unknown")?.value ?? "Unknown"
  );
}

export function getSignalOptions() {
  const completeCount = COMPANIES.filter(
    (company) => profileCompleteness(company) >= 80,
  ).length;
  return [
    ["Verified Profiles", true, formatCompactCount(COMPANIES.length)],
    [
      "Has Website",
      true,
      formatCompactCount(COMPANIES.filter((company) => company.website).length),
    ],
    [
      "Has LinkedIn",
      true,
      formatCompactCount(COMPANIES.filter((company) => company.linkedin).length),
    ],
    [
      "Has Description",
      true,
      formatCompactCount(
        COMPANIES.filter((company) => company.description).length,
      ),
    ],
    ["Complete Profiles", false, formatCompactCount(completeCount)],
  ] as [string, boolean, string][];
}

export function getCompanyFacts(company: Company) {
  return [
    ["City", company.city],
    ["Stage", company.stage],
    ["Employees", company.employees],
    ["Sector", company.sector],
  ].filter(([, value]) => Boolean(value));
}

export function getProfileLevel(score: number) {
  return `P${Math.max(1, Math.ceil(score / 10))}`;
}
