/**
 * Deterministic sector colors from dataset sector labels — no fixed map from sector name → color.
 * Palette cycles through Utah Startup Compass brand-safe hues (copper / slate / pine).
 */

/** Golden-ratio spaced hues anchored in brand terracotta + navy family */
const BASE_HUES = [18, 205, 142, 32, 268, 12, 195, 38, 220, 160, 24, 200];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function hslForSector(sector: string, index: number): string {
  const hue = BASE_HUES[index % BASE_HUES.length]!;
  const sat = 42 + (hashString(sector) % 18);
  const light = 38 + (hashString(sector + ":L") % 10);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function buildSectorColorLookup(sectorsSorted: string[]): Map<string, string> {
  const m = new Map<string, string>();
  sectorsSorted.forEach((sector, i) => {
    m.set(sector, hslForSector(sector, i));
  });
  return m;
}

let cachedLookup: Map<string, string> | null = null;

export function initSectorColorsFromDataset(allSectors: string[]): void {
  const unique = [...new Set(allSectors)].sort((a, b) => a.localeCompare(b));
  cachedLookup = buildSectorColorLookup(unique);
}

export function getDynamicSectorColor(sector: string): string {
  if (!cachedLookup || cachedLookup.size === 0) {
    return "hsl(215 24% 42%)";
  }
  return cachedLookup.get(sector) ?? "hsl(215 24% 42%)";
}
