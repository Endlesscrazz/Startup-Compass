// City → Utah county lookup. All 29 Utah county names are valid passthrough values.
// Handles "Salt Lake County" format (strips " County" suffix before lookup).

const CITY_TO_COUNTY: Record<string, string> = {
  // Salt Lake
  "salt lake city": "Salt Lake",
  "slc": "Salt Lake",
  "west valley city": "Salt Lake",
  "west valley": "Salt Lake",
  "murray": "Salt Lake",
  "sandy": "Salt Lake",
  "west jordan": "Salt Lake",
  "south jordan": "Salt Lake",
  "taylorsville": "Salt Lake",
  "midvale": "Salt Lake",
  "cottonwood heights": "Salt Lake",
  "holladay": "Salt Lake",
  "millcreek": "Salt Lake",
  "herriman": "Salt Lake",
  "riverton": "Salt Lake",
  "draper": "Salt Lake",
  "bluffdale": "Salt Lake",
  // Utah
  "provo": "Utah",
  "orem": "Utah",
  "lehi": "Utah",
  "american fork": "Utah",
  "pleasant grove": "Utah",
  "springville": "Utah",
  "spanish fork": "Utah",
  "payson": "Utah",
  "saratoga springs": "Utah",
  "eagle mountain": "Utah",
  "lindon": "Utah",
  "vineyard": "Utah",
  // Weber
  "ogden": "Weber",
  "layton": "Davis",
  "roy": "Weber",
  "north ogden": "Weber",
  "south ogden": "Weber",
  "washington terrace": "Weber",
  // Davis
  "bountiful": "Davis",
  "kaysville": "Davis",
  "farmington": "Davis",
  "clearfield": "Davis",
  "clinton": "Davis",
  "syracuse": "Davis",
  "centerville": "Davis",
  "north salt lake": "Davis",
  // Cache
  "logan": "Cache",
  "north logan": "Cache",
  "hyde park": "Cache",
  "smithfield": "Cache",
  // Washington
  "st. george": "Washington",
  "st george": "Washington",
  "saint george": "Washington",
  "hurricane": "Washington",
  "washington": "Washington",
  "ivins": "Washington",
  "santa clara": "Washington",
  "la verkin": "Washington",
  // Summit
  "park city": "Summit",
  "coalville": "Summit",
  // Grand
  "moab": "Grand",
  // Uintah
  "vernal": "Uintah",
  // Carbon
  "price": "Carbon",
  // Iron
  "cedar city": "Iron",
  // Wasatch
  "heber city": "Wasatch",
  "heber": "Wasatch",
  // Tooele
  "tooele": "Tooele",
  // Sanpete
  "manti": "Sanpete",
  "ephraim": "Sanpete",
  // Sevier
  "richfield": "Sevier",
  // Box Elder
  "brigham city": "Box Elder",
  // Millard
  "delta": "Millard",
  // Beaver
  "beaver": "Beaver",
  // Piute
  "junction": "Piute",
  // Kane
  "kanab": "Kane",
  // Wayne
  "loa": "Wayne",
  // Garfield
  "panguitch": "Garfield",
  // Emery
  "castle dale": "Emery",
  // Daggett
  "manila": "Daggett",
  // San Juan
  "monticello": "San Juan",
  "blanding": "San Juan",
  // Rich
  "randolph": "Rich",
  // Morgan
  "morgan": "Morgan",
  // Juab
  "nephi": "Juab",
};

const VALID_COUNTIES = new Set([
  "Beaver", "Box Elder", "Cache", "Carbon", "Daggett", "Davis", "Duchesne",
  "Emery", "Garfield", "Grand", "Iron", "Juab", "Kane", "Millard", "Morgan",
  "Piute", "Rich", "Salt Lake", "San Juan", "Sanpete", "Sevier", "Summit",
  "Tooele", "Uintah", "Utah", "Wasatch", "Washington", "Wayne", "Weber",
]);

export function resolveCounty(input: string): string | null {
  const cleaned = input.trim().replace(/\s+County$/i, "").trim();

  // Direct county match (case-insensitive)
  const canonical = [...VALID_COUNTIES].find(
    (c) => c.toLowerCase() === cleaned.toLowerCase()
  );
  if (canonical) return canonical;

  // City lookup (case-insensitive)
  return CITY_TO_COUNTY[cleaned.toLowerCase()] ?? null;
}
