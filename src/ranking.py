from groq import Groq
import json
import os
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add: resolve data directory and ensure it exists
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
GROQ_CLIENT = Groq(api_key=os.getenv('GROQ_API_KEY'))

RANKING_SYSTEM_PROMPT = """You are a location intelligence ranking system (GPT-OSS-120B). Produce ONLY the required JSON.

Core tasks:
1. Understand the user query + context (location, time).
2. Infer needs (relevant category, proximity, quality) and reasonable exclusions (off‑category, clearly poorer, needlessly far when similar nearer).
3. Merge Foursquare + Google; dedupe ONLY on strong name + lat/long match (then merge: keep Google rating/reviews_count; keep FS tel/website if present).
4. Rank by weighted factors: Relevance 0.4, Proximity 0.3, Quality 0.3 (rating + reviews_count + sentiment from recent_reviews).
5. Do NOT fabricate any field. Use null if unknown. Do not compute new distances.

Scoring guidance:
- Relevance: exact bakery category/name > mixed cafe if query is “bakery” (unless reviews emphasize baked goods strongly).
- Proximity: closer generally better; large rating/review superiority can outweigh small distance difference.
- Quality: higher rating with solid review_count preferred; very low count lowers confidence.
Tie-breakers: higher reviews_count, stronger category match, presence of tel/website, clearer address.

Review & summaries:
- review_summary: 1–2 sentences; synthesize themes (quality, freshness, variety, service, consistency). If no reviews: “No review data available.”
- location_summary: ≤3 sentences; what it is, appeal for the query, proximity/setting / distinguishing strengths.
Keep factual; never invent sentiment not grounded in provided snippets or rating.

Output schema (must match exactly):
{
  "query_analysis": {
    "interpreted_intent": "<one sentence>",
    "context_used": "<concise context summary>",
    "needs_inferred": ["..."],
    "not_wanted_inferred": ["..."],
    "ranking_approach": "Relevance-Proximity-Quality weighted ranking with data-driven tie-breakers"
  },
  "ranked_places": [
    {
      "rank": <int>,
      "place_id": "<id>",
      "google_place_id": "<google_place_id or null>",
      "latitude": <number>,
      "longitude": <number>,
      "distance": <number or null>,
      "name": "<string>",
      "address": "<string or null>",
      "tel": "<string or null>",
      "website": "<string or null>",
      "rating": <number or null>,
      "review_count": <number or null>,
      "review_summary": "<should use the "interpreted_intent",should be personal to each query, very detailed summary look at all the reviews available then create this or 'No review data available.'>",
      "location_summary": "< very detailed summary of the the location looking at all the data we have on the place then write it>"
    }
  ]
}

Validation:
- Return ONLY one JSON object (no markdown / fences / commentary).
- Include all relevant places (merged where justified). If any excluded, list reason(s) in not_wanted_inferred.
- Preserve data types exactly.
- Do not compute or alter distances; use given distance_km as distance.
- Preserve google_place_id from original data if available; use null if not present.
Strict rule: Output must start with { and end with }. Nothing else."""

def rank_places_api(combined_results: Dict[str, Any], save_to_file: bool = False) -> Dict[str, Any]:
    """
    API endpoint function for ranking places using AI analysis.
    
    Args:
        combined_results: Output from search_places_api()
        save_to_file: Whether to save results to file (default: False)
        
    Returns:
        Ranked results with analysis and success/error status
    """
    try:
        resp = GROQ_CLIENT.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": RANKING_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(combined_results, ensure_ascii=False)}
            ],
            temperature=0.5,
            max_tokens=8000,
            stream=False,
        )
        
        raw_response = resp.choices[0].message.content
        
        # Try to parse the AI response as JSON
        try:
            ranked_data = json.loads(raw_response)
            result = {"success": True, "data": ranked_data, "raw_response": raw_response}
            
            # Save to file if requested
            if save_to_file:
                try:
                    DATA_DIR.mkdir(parents=True, exist_ok=True)
                    (DATA_DIR / "ranked_results.json").write_text(raw_response, encoding="utf-8")
                    print(f"Ranked results saved -> {DATA_DIR / 'ranked_results.json'}")
                except Exception as save_error:
                    print(f"Warning: Failed to save ranked results to file: {save_error}")
            
            return result
        
        except json.JSONDecodeError as e:
            return {
                "success": False, 
                "error": f"Invalid JSON response from AI: {str(e)}", 
                "raw_response": raw_response
            }
    
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def main():
    """
    Main function that provides usage instructions.
    """
    print("PlacesFinder Ranking API")
    print("=======================")
    print("This module is designed to be used as an API component.")
    print("Please use the Next.js frontend or call rank_places_api() directly.")
    print()
    print("Example usage:")
    print("  from ranking import rank_places_api")
    print("  from fsgm import search_places_api")
    print("  search_result = search_places_api('coffee shops', location_data)")
    print("  ranking_result = rank_places_api(search_result['data'])")
    print()

if __name__ == "__main__":
    main()