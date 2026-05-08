"""
Parse GOED Excel dataset → data/resources.json
Run from repo root: uv run scripts/parse_resources.py
"""

import json
import sys
from pathlib import Path

import openpyxl

EXCEL_PATH = Path(__file__).parent.parent / "dataset" / "Resources List - Builder Day.xlsx"
OUT_PATH = Path(__file__).parent.parent / "data" / "resources.json"

# Exact titles of the 2 known duplicates — keep first occurrence, drop second
DUPLICATE_TITLES = {
    "Bear River Association of Governments",
    "Five County Association of Governments",
}


def parse_pipe(value: str | None) -> list[str]:
    if not value:
        return []
    return [v.strip() for v in value.split("|") if v.strip()]


def main() -> None:
    if not EXCEL_PATH.exists():
        print(f"ERROR: dataset not found at {EXCEL_PATH}", file=sys.stderr)
        sys.exit(1)

    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    resources = []
    seen_titles: set[str] = set()
    skipped = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        rid, title, description, communities, industries, locations, topics, link, email = row

        if not title or not description:
            skipped += 1
            continue

        title = str(title).strip()

        # Drop second occurrence of known duplicates
        if title in DUPLICATE_TITLES and title in seen_titles:
            skipped += 1
            continue
        seen_titles.add(title)

        resources.append({
            "id": int(rid) if rid else None,
            "title": title,
            "description": str(description).strip(),
            "communities": parse_pipe(communities),
            "industries": parse_pipe(industries),
            "locations": parse_pipe(locations),
            "topics": parse_pipe(topics),
            "link": str(link).strip() if link else None,
            "email": str(email).strip() if email else None,
        })

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(resources, f, indent=2)

    print(f"Parsed {len(resources)} resources ({skipped} skipped/deduped) → {OUT_PATH}")
    print(f"Sample titles: {[r['title'] for r in resources[:3]]}")


if __name__ == "__main__":
    main()
