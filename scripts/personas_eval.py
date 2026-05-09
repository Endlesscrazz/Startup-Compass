"""
Persona Evaluation Harness — Startup Compass / Founder's Navigator
Tests the NL input path against 6 custom edge-case personas.
Uses LLM-as-Judge (Groq llama-3.3-70b) to score result quality 1–5.

Usage:
  uv run python scripts/personas_eval.py
  uv run python scripts/personas_eval.py --url https://your-vercel-url.vercel.app

Dev server must be running: npm run dev (from repo root)
GROQ_API_KEY must be set in .env.local or environment.
"""

import json
import os
import sys
import argparse
import time
import requests
from pathlib import Path
from groq import Groq

# ── Config ────────────────────────────────────────────────────────────────────

BASE_URL = "http://localhost:3000"
PERSONAS_FILE = Path(__file__).parent / "personas.json"
GROQ_MODEL = "llama-3.3-70b-versatile"

JUDGE_SYSTEM = """You are an expert startup advisor grading an AI resource matching tool for Utah founders.
Given a founder description and the top 5 resources returned by the system, grade the recommendations 1–5.

Scoring guide:
  5 — All resources clearly fit the founder's stage, sector, location, and goal
  4 — Most resources fit well; one minor mismatch
  3 — Mix of relevant and irrelevant; some useful results buried
  2 — Mostly wrong matches; stage or sector clearly misunderstood
  1 — Results are completely wrong or harmful (e.g. VC shown to someone bootstrapping)

Automatic deductions:
  -1 if venture capital is recommended to someone explicitly avoiding it
  -1 if beginner "start a business" resources shown to an established scaling company
  -1 if resources are from the wrong geographic area for the founder

Return ONLY valid JSON, no other text: {"score": <1-5>, "reason": "<one concise sentence>"}"""

# ── Helpers ───────────────────────────────────────────────────────────────────

def fuzzy_match(needle: str, haystack: list[str]) -> bool:
    """Case-insensitive substring match — handles 'SBDC' matching 'Small Business Development Center (SBDC)'."""
    needle_lower = needle.lower()
    return any(needle_lower in item.lower() for item in haystack)


def get_top_results(persona: dict, base_url: str) -> list[str]:
    """Call /api/match NL path, return list of resource titles."""
    payload = {
        "description": persona["description"],
        "city": persona["city"],
    }
    resp = requests.post(
        f"{base_url}/api/match",
        json=payload,
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    return [r["title"] for r in data.get("results", [])]


def judge_results(persona: dict, top_results: list[str], client: Groq) -> dict:
    """Ask Groq to score the results for this persona. Returns {score, reason}."""
    top5 = top_results[:5]
    user_prompt = (
        f"Founder description: {persona['description']}\n\n"
        f"Top 5 resources recommended:\n"
        + "\n".join(f"  {i+1}. {r}" for i, r in enumerate(top5))
    )
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": JUDGE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=120,
        )
        raw = response.choices[0].message.content or ""
        clean = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean)
        return {
            "score": int(parsed["score"]),
            "reason": str(parsed["reason"]),
        }
    except Exception as e:
        return {"score": None, "reason": f"Judge failed: {e}"}


# ── Main ──────────────────────────────────────────────────────────────────────

def run_evaluation(base_url: str) -> None:
    with open(PERSONAS_FILE) as f:
        personas = json.load(f)

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        # Try loading from .env.local
        env_path = Path(__file__).parent.parent / ".env.local"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("GROQ_API_KEY="):
                    groq_key = line.split("=", 1)[1].strip().strip('"')
                    break
    if not groq_key:
        print("ERROR: GROQ_API_KEY not found. Set it in .env.local or environment.")
        sys.exit(1)

    groq_client = Groq(api_key=groq_key)

    expect_hits = 0
    expect_total = 0
    must_not_see_passes = 0
    must_not_see_total = 0
    llm_scores: list[int] = []

    sep = "─" * 60

    print(f"\n{'='*60}")
    print(f"  Startup Compass — Persona Evaluation ({len(personas)} personas)")
    print(f"  Target: {base_url}")
    print(f"{'='*60}\n")

    for persona in personas:
        print(sep)
        print(f"  {persona['name']}  |  {persona['city']}  |  {persona['goal']}")
        print(sep)

        # Fetch results
        try:
            top_results = get_top_results(persona, base_url)
        except requests.exceptions.ConnectionError:
            print("  ❌ CONNECTION ERROR — is the dev server running? (npm run dev)")
            sys.exit(1)
        except requests.exceptions.HTTPError as e:
            print(f"  ❌ API ERROR: {e}")
            continue

        print(f"  Results returned: {len(top_results)}")
        for i, r in enumerate(top_results[:5]):
            print(f"    {i+1}. {r}")

        # Expect check (fuzzy)
        expected = persona.get("expect", [])
        if expected:
            hits = [e for e in expected if fuzzy_match(e, top_results)]
            misses = [e for e in expected if not fuzzy_match(e, top_results)]
            expect_hits += len(hits)
            expect_total += len(expected)
            if hits:
                print(f"  ✅ Expect hits:   {hits}")
            if misses:
                print(f"  ❌ Expect misses: {misses}")

        # MustNotSee check (fuzzy)
        forbidden = persona.get("mustNotSee", [])
        if forbidden:
            must_not_see_total += 1
            poisons = [f for f in forbidden if fuzzy_match(f, top_results)]
            if poisons:
                print(f"  🚨 CRITICAL: Forbidden results shown: {poisons}")
            else:
                must_not_see_passes += 1
                print(f"  ✅ MustNotSee:    PASS")

        # LLM judge
        verdict = judge_results(persona, top_results, groq_client)
        score = verdict["score"]
        reason = verdict["reason"]
        if score is not None:
            llm_scores.append(score)
            bar = "█" * score + "░" * (5 - score)
            print(f"  🤖 LLM score:     {score}/5 [{bar}]  {reason}")
        else:
            print(f"  🤖 LLM score:     N/A  ({reason})")

        print()
        time.sleep(0.5)  # avoid Groq rate limit between personas

    # Final scorecard
    print("=" * 60)
    print("  FINAL SCORECARD")
    print("=" * 60)
    hit_pct = f"{expect_hits}/{expect_total}" if expect_total else "N/A"
    pass_pct = f"{must_not_see_passes}/{must_not_see_total}" if must_not_see_total else "N/A"
    avg_score = f"{sum(llm_scores)/len(llm_scores):.1f}/5" if llm_scores else "N/A"
    print(f"  Expect hits:     {hit_pct}")
    print(f"  MustNotSee pass: {pass_pct}")
    print(f"  LLM avg score:   {avg_score}  (across {len(llm_scores)} personas)")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--url",
        default=BASE_URL,
        help="Base URL to test against (default: http://localhost:3000)",
    )
    args = parser.parse_args()
    run_evaluation(args.url)
