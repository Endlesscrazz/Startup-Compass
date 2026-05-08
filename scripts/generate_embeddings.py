"""
Generate Gemini text-embedding-004 vectors for all resources.
Output: data/embeddings.json — array of { id, embedding } objects.

Run from repo root: uv run scripts/generate_embeddings.py
Requires GEMINI_API_KEY in .env.local or environment.
Rate limit: ~700ms delay between calls to stay under free-tier quota.
Expected runtime: ~2.5 minutes for 211 resources.
"""

import json
import os
import sys
import time
from pathlib import Path

from google import genai

RESOURCES_PATH = Path(__file__).parent.parent / "data" / "resources.json"
OUT_PATH = Path(__file__).parent.parent / "data" / "embeddings.json"
# Note: paths resolve to repo root/data/ when run from repo root
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 3072
RATE_LIMIT_DELAY = 0.75  # seconds between API calls

# Search parent dirs for .env.local (works whether run from Startup-Compass or founder-navigator)
def load_env_local() -> None:
    search = [Path(__file__).parent.parent, Path(__file__).parent.parent.parent]
    for base in search:
        env_file = base / ".env.local"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            return


def build_resource_text(r: dict) -> str:
    """Compose the string that gets embedded for each resource."""
    parts = [r["title"], r["description"]]
    if r["topics"]:
        parts.append("Topics: " + ", ".join(r["topics"]))
    if r["industries"]:
        parts.append("Industries: " + ", ".join(r["industries"]))
    if r["communities"]:
        parts.append("Communities: " + ", ".join(r["communities"]))
    return " | ".join(parts)


def main() -> None:
    load_env_local()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # Explicitly pass key — prevents GOOGLE_API_KEY env var from taking precedence
    client = genai.Client(api_key=api_key)

    with open(RESOURCES_PATH) as f:
        resources = json.load(f)

    # Resume from existing output if partial run
    existing: dict[int, list[float]] = {}
    if OUT_PATH.exists():
        with open(OUT_PATH) as f:
            for entry in json.load(f):
                existing[entry["id"]] = entry["embedding"]
        print(f"Resuming — {len(existing)} embeddings already done")

    results = list(existing.items())  # (id, embedding) pairs already computed

    total = len(resources)
    pending = [r for r in resources if r["id"] not in existing]
    print(f"Generating {len(pending)} embeddings (skipping {len(existing)} cached)...")

    for i, resource in enumerate(pending):
        text = build_resource_text(resource)
        try:
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
            )
            embedding = result.embeddings[0].values
            assert len(embedding) == EMBEDDING_DIM, f"Unexpected dim: {len(embedding)}"
            results.append((resource["id"], embedding))
            done = len(existing) + i + 1
            print(f"  [{done}/{total}] {resource['title'][:60]}")
        except Exception as e:
            print(f"  ERROR on {resource['title']}: {e}", file=sys.stderr)
            # Save progress before failing
            _write(results, OUT_PATH)
            sys.exit(1)

        if i < len(pending) - 1:
            time.sleep(RATE_LIMIT_DELAY)

    _write(results, OUT_PATH)
    print(f"\nDone. {len(results)} embeddings written to {OUT_PATH}")
    print(f"Spot check dim: {len(results[0][1])} (expected {EMBEDDING_DIM})")


def _write(results: list[tuple[int, list[float]]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    output = [{"id": rid, "embedding": emb} for rid, emb in results]
    with open(path, "w") as f:
        json.dump(output, f)


if __name__ == "__main__":
    main()
