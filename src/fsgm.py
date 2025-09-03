"""
Unified script: single user prompt -> Foursquare (dataFS.json) + Google Local (gm_results.json) + combined_results.json
Uses dynamic location/time from location_context.json (created by ranking.py browser capture).
NOW: Adds distance_km (haversine) from user context to every place.
"""

import json
import math
import datetime as dt
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ---------- Shared dynamic context ----------
# Use data directory under project root
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

LOCATION_CACHE = DATA_DIR / "location_context.json"
DEFAULT_LL = f"{os.getenv('DEFAULT_LATITUDE', '28.6304')},{os.getenv('DEFAULT_LONGITUDE', '77.2177')}"
DEFAULT_TZ = os.getenv('DEFAULT_TIMEZONE', 'UTC')

def _reverse_geocode(lat: float, lon: float) -> Optional[str]:
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 10, "addressdetails": 1},
            headers={"User-Agent": "local-geo-context/1.0"},
            timeout=120,  # 2 minute timeout
        )
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address", {}) or {}
        city = addr.get("city") or addr.get("town") or addr.get("village")
        if city and addr.get("state"):
            return f"{city}, {addr.get('state')}"
        if city and addr.get("country"):
            return f"{city}, {addr.get('country')}"
        if addr.get("state") and addr.get("country"):
            return f"{addr.get('state')}, {addr.get('country')}"
        return data.get("display_name")
    except Exception:
        return None

def search_places_api(query: str, location_data: Dict[str, Any], save_to_file: bool = False) -> Dict[str, Any]:
    """
    API endpoint function for place search from both Foursquare and Google.
    
    Args:
        query: User search query
        location_data: Location data from frontend
        save_to_file: Whether to save results to files (default: False)
        
    Returns:
        Combined search results with success/error status
    """
    try:
        # Create context from location data instead of file
        ctx = create_context_from_location(location_data)
        
        # Run searches without saving to files in API mode
        fs_out = run_fs(query, ctx, save_to_file=save_to_file)
        gm_out = run_gm(query, ctx, save_to_file=save_to_file)
        
        # Create combined results
        combined = {
            "query": query,
            "context": ctx,
            "foursquare": {"count": fs_out["count"], "results": fs_out["results"]},
            "google": {"count": gm_out["count"], "results": gm_out["results"]},
        }
        
        # Optionally save combined results to file
        if save_to_file:
            with open(DATA_DIR / "combined_results.json", "w", encoding="utf-8") as f:
                json.dump(combined, f, ensure_ascii=False, indent=2)
            print(f"Combined results saved -> {DATA_DIR / 'combined_results.json'}")
        
        return {"success": True, "data": combined}
    
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def create_context_from_location(location_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create context object from frontend location data instead of file.
    
    Args:
        location_data: Location data from frontend
        
    Returns:
        Context dict for API functions
    """
    lat = location_data.get('latitude')
    lon = location_data.get('longitude')
    tz = location_data.get('timezone', DEFAULT_TZ)
    
    # Get current time
    captured_local = dt.datetime.now().astimezone()
    captured_at = location_data.get('captured_at')
    if captured_at:
        try:
            captured_dt = dt.datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
            captured_local = captured_dt.astimezone()
        except Exception:
            pass
    
    # Reverse geocode if we have coordinates
    text_location = None
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        text_location = _reverse_geocode(lat, lon)
    
    # Create ll parameter
    ll = f"{lat},{lon}" if isinstance(lat, (int, float)) and isinstance(lon, (int, float)) else DEFAULT_LL
    
    return {
        "latitude": lat,
        "longitude": lon,
        "ll": ll,
        "timezone": tz,
        "current_time": captured_local.strftime("%Y-%m-%d %H:%M"),
        "text_location": text_location,
        "source": "frontend_geolocation",
        "captured_at": captured_at,
    }


def load_context() -> Dict[str, Any]:
    """
    DEPRECATED: Legacy function for backward compatibility.
    Use create_context_from_location() instead.
    """
    print("Warning: load_context() is deprecated. Use create_context_from_location() instead.")
    
    # Try to load from cache file for backward compatibility
    lat = lon = None
    tz = None
    source = "default"
    captured_local = dt.datetime.now().astimezone()
    captured_at = None
    if LOCATION_CACHE.exists():
        try:
            raw = json.loads(LOCATION_CACHE.read_text(encoding="utf-8"))
            lat = raw.get("latitude")
            lon = raw.get("longitude")
            tz = raw.get("timezone")
            source = raw.get("source") or "browser_geolocation"
            captured_at = raw.get("captured_at")
            if captured_at:
                try:
                    captured_dt = dt.datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
                    captured_local = captured_dt.astimezone()
                except Exception:
                    pass
        except Exception:
            pass
    if not tz:
        tzinfo = dt.datetime.now().astimezone().tzinfo
        tz = getattr(tzinfo, "key", str(tzinfo)) or DEFAULT_TZ
    text_location = None
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        text_location = _reverse_geocode(lat, lon)
    ll = f"{lat},{lon}" if isinstance(lat, (int, float)) and isinstance(lon, (int, float)) else DEFAULT_LL
    return {
        "latitude": lat,
        "longitude": lon,
        "ll": ll,
        "timezone": tz,
        "current_time": captured_local.strftime("%Y-%m-%d %H:%M"),
        "text_location": text_location,
        "source": source,
        "captured_at": captured_at,
    }

# ---------- Distance helpers ----------
def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def _add_distance(ctx: Dict[str, Any], lat: Optional[float], lon: Optional[float]) -> Optional[float]:
    clat, clon = ctx.get("latitude"), ctx.get("longitude")
    if not (isinstance(clat, (int, float)) and isinstance(clon, (int, float)) and isinstance(lat, (int, float)) and isinstance(lon, (int, float))):
        return None
    return _haversine_km(clat, clon, lat, lon)

# ---------- Groq client ----------
GROQ_CLIENT = Groq(api_key=os.getenv('GROQ_API_KEY'))

# ==================================================================
#                        FOURSQUARE SECTION
# ==================================================================
PLACES_SEARCH_URL = "https://places-api.foursquare.com/places/search"
PLACE_DETAILS_URL_TMPL = "https://places-api.foursquare.com/places/{fsq_place_id}"

FSQ_HEADERS = {
    "accept": "application/json",
    "X-Places-Api-Version": "2025-06-17",
    "authorization": f"Bearer {os.getenv('FOURSQUARE_API_KEY')}",
}

def _fs_system_prompt(ctx: Dict[str, Any]) -> str:
    return f'''You convert natural language queries into Foursquare Places API search parameters.

USER CONTEXT:
- user_location_ll: {ctx["ll"]}
- user_timezone: {ctx["timezone"]}
- current_time: {ctx["current_time"]}

Return ONLY JSON (no extra text) with this schema (omit unused or set null):
{{
  "ll": "lat,lng" | null,
  "near": "city or address" | null,
  "radius": number (1000-100000) | null,
  "query": "free text" | null,
  "categories": "comma_separated_numeric_ids" | null,
  "chains": "comma_separated_chain_ids" | null,
  "open_now": "true" | "false" | null,
  "open_at": "DOWTHHMM" | null,
  "min_price": 1 | 2 | 3 | 4 | null,
  "max_price": 1 | 2 | 3 | 4 | null,
  "sort": "DISTANCE" | "RELEVANCE" | "RATING" | null,
  "limit": number (1-50) | null,
  "fields": "comma_separated_fields" | null
}}
Rules:
- If user doesn't specify another location, use ll from context.
- Keep limit <= 5.
'''

def generate_fs_params(user_prompt: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
    resp = GROQ_CLIENT.chat.completions.create(
        model=os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b'),
        messages=[
            {"role": "system", "content": _fs_system_prompt(ctx)},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
        max_tokens=800,
        stream=False,
    )
    content = resp.choices[0].message.content
    try:
        params = json.loads(content)
    except json.JSONDecodeError:
        params = {
            "ll": ctx["ll"],
            "near": None,
            "radius": 5000,
            "query": user_prompt or "coffee",
            "categories": None,
            "chains": None,
            "open_now": None,
            "open_at": None,
            "min_price": None,
            "max_price": None,
            "sort": "RELEVANCE",
            "limit": 5,
            "fields": None,
        }
    if not params.get("limit") or params.get("limit", 0) > 5:
        params["limit"] = 5
    if not params.get("ll") and not params.get("near"):
        params["ll"] = ctx["ll"]
    return params

def search_foursquare(params: Dict[str, Any]) -> List[str]:
    clean = {k: v for k, v in params.items() if v not in (None, "null")}
    clean["fields"] = "fsq_place_id"
    r = requests.get(PLACES_SEARCH_URL, headers=FSQ_HEADERS, params=clean, timeout=120)  # 2 minute timeout
    r.raise_for_status()
    data = r.json()
    ids: List[str] = []
    for p in data.get("results", []):
        fid = p.get("fsq_place_id")
        if fid:
            ids.append(fid)
        if len(ids) >= 5:
            break
    return ids

def fetch_place_details(fsq_id: str) -> Dict[str, Any]:
    url = PLACE_DETAILS_URL_TMPL.format(fsq_place_id=fsq_id)
    r = requests.get(url, headers=FSQ_HEADERS, timeout=120)  # 2 minute timeout
    r.raise_for_status()
    return r.json()

def summarize_fs(detail: Dict[str, Any]) -> Dict[str, Any]:
    loc = detail.get("location") or {}
    formatted = loc.get("formatted_address")
    if not formatted:
        parts = [loc.get("address"), loc.get("locality"), loc.get("region"), loc.get("postcode"), loc.get("country")]
        formatted = ", ".join([p for p in parts if p]) or None
    cats = detail.get("categories") or []
    cat_names = [c.get("name") for c in cats if isinstance(c, dict) and c.get("name")]
    chains = detail.get("chains") or []
    chain_name = chains[0].get("name") if chains and isinstance(chains[0], dict) else None
    return {
        "fsq_place_id": detail.get("fsq_place_id"),
        "name": detail.get("name"),
        "address": formatted,
        "latitude": detail.get("latitude"),
        "longitude": detail.get("longitude"),
        "categories": cat_names if cat_names else None,
        "chain": chain_name,
        "tel": detail.get("tel"),
        "website": detail.get("website"),
    }

def run_fs(user_query: str, ctx: Dict[str, Any], save_to_file: bool = False) -> Dict[str, Any]:
    params = generate_fs_params(user_query, ctx)
    ids = search_foursquare(params)
    details: List[Dict[str, Any]] = []
    for fid in ids:
        rec = summarize_fs(fetch_place_details(fid))
        rec["distance_km"] = _add_distance(ctx, rec.get("latitude"), rec.get("longitude"))
        details.append(rec)
    out = {
        "context": ctx,
        "query": user_query,
        "count": len(details),
        "results": details,
    }
    
    # Only save to file if explicitly requested (for backward compatibility)
    if save_to_file:
        with open(DATA_DIR / "dataFS.json", "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        print(f"[Foursquare] Saved {len(details)} -> {DATA_DIR / 'dataFS.json'} (ll={ctx['ll']})")
    else:
        print(f"[Foursquare] Found {len(details)} results (ll={ctx['ll']})")
    
    return out

# ==================================================================
#                        GOOGLE LOCAL SECTION
# ==================================================================
SERP_API_KEY = os.getenv('SERPAPI_KEY')
SEARCH_ENDPOINT = "https://serpapi.com/search.json"

def _gm_system_prompt(ctx: Dict[str, Any]) -> str:
    coord_line = f"{ctx['latitude']},{ctx['longitude']}" if ctx["latitude"] is not None and ctx["longitude"] is not None else "unknown"
    inferred_loc = ctx.get("text_location") or "unknown"
    return f'''You convert natural language place-search queries into SerpApi Google Local parameters.

USER CONTEXT:
- coordinates: {coord_line}
- inferred_location_text: {inferred_loc}
- user_timezone: {ctx["timezone"]}
- current_time_local: {ctx["current_time"]}

Output ONLY JSON (no extra text):
{{
  "engine": "google_local",
  "q": "search terms",
  "location": "city or full address" | null,
  "hl": "language code" | null,
  "gl": "country code" | null,
  "num": number (1-20) | null
}}
Rules:
- engine must be google_local.
- If user omits location and inferred_location_text != "unknown", use it.
- Default hl="en", gl="in", num=10.
'''

def generate_serp_params(user_prompt: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
    resp = GROQ_CLIENT.chat.completions.create(
        model=os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b'),
        messages=[
            {"role": "system", "content": _gm_system_prompt(ctx)},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=400,
        stream=False,
    )
    content = resp.choices[0].message.content
    try:
        params = json.loads(content)
    except json.JSONDecodeError:
        params = {
            "engine": "google_local",
            "q": user_prompt or "coffee",
            "location": ctx.get("text_location") or None,
            "hl": "en",
            "gl": "in",
            "num": 10,
        }
    params.setdefault("engine", "google_local")
    if not params.get("location") and ctx.get("text_location"):
        params["location"] = ctx["text_location"]
    if isinstance(params.get("num"), str):
        try:
            params["num"] = int(params["num"])
        except ValueError:
            params["num"] = 10
    params["hl"] = params.get("hl") or "en"
    params["gl"] = params.get("gl") or "in"
    params["num"] = params.get("num") or 10
    params["api_key"] = SERP_API_KEY
    return params

# --- New helpers / enhanced error handling for Google Local (SerpApi) ---

def _simplify_location(loc: Optional[str]) -> Optional[str]:
    """
    Reduce overly specific / verbose location strings that may trigger SerpApi 400 errors.
    Strategy:
      - Keep only first two comma-separated segments.
      - Strip extra whitespace.
      - If segment contains 'Municipal Corporation', drop that phrase.
    """
    if not loc or not isinstance(loc, str):
        return loc
    parts = [p.strip() for p in loc.split(",") if p.strip()]
    if not parts:
        return loc
    # Remove verbose municipal corporation wording
    cleaned = []
    for p in parts:
        cleaned.append(p.replace("Municipal Corporation", "").strip())
    cleaned = [c for c in cleaned if c]
    simplified = ", ".join(cleaned[:2])  # keep at most two segments
    return simplified or loc

def fetch_local_results(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch Google Local results with resilience:
      1. First attempt with (possibly simplified) location.
      2. On 400 error: retry with further simplified location (if changed).
      3. Final fallback: remove location parameter entirely.
    Returns {} if all attempts fail.
    """
    base_params = dict(params)
    # Pre-simplify before first request
    if base_params.get("location"):
        pre = base_params["location"]
        simp = _simplify_location(pre)
        if simp != pre:
            base_params["location"] = simp

    def _attempt(p: Dict[str, Any], tag: str) -> Optional[Dict[str, Any]]:
        try:
            r = requests.get(SEARCH_ENDPOINT, params=p, timeout=120)  # 2 minute timeout
            if r.status_code == 400:
                raise requests.HTTPError("400 Bad Request", response=r)
            r.raise_for_status()
            return r.json()
        except requests.HTTPError as he:
            if getattr(he.response, "status_code", None) == 400:
                print(f"[Google] 400 Bad Request on attempt '{tag}' with params subset={{'q': {p.get('q')}, 'location': {p.get('location')}}}")
                return None
            print(f"[Google] HTTP error on attempt '{tag}': {he}")
            return None
        except Exception as e:
            print(f"[Google] Exception on attempt '{tag}': {e}")
            return None

    # Attempt 1: (maybe simplified) location
    payload = _attempt(base_params, "initial")
    if payload:
        return payload

    # Attempt 2: further simplified (aggressively keep only first token)
    if base_params.get("location"):
        loc = base_params["location"]
        aggressive = loc.split(",")[0].strip()
        if aggressive and aggressive != loc:
            p2 = dict(base_params)
            p2["location"] = aggressive
            payload = _attempt(p2, "aggressive_location")
            if payload:
                return payload

    # Attempt 3: drop location entirely (let SerpApi infer or fail gracefully)
    if base_params.get("location"):
        p3 = dict(base_params)
        p3.pop("location", None)
        payload = _attempt(p3, "no_location")
        if payload:
            return payload

    print("[Google] All retries failed; returning empty payload.")
    return {}

def normalize_results(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    local_results = payload.get("local_results", []) or []
    out: List[Dict[str, Any]] = []
    for item in local_results:
        gps = item.get("gps_coordinates") or {}
        
        # Capture both ID formats for completeness
        place_id = item.get("place_id")
        data_id = item.get("data_id") 
        ludocid = item.get("ludocid")
        
        # Use the first available ID, with preference for data_id
        google_place_id = data_id or place_id or ludocid
        
        out.append({
            "google_place_id": google_place_id,
            "name": item.get("title"),
            "address": item.get("address"),
            "latitude": gps.get("latitude"),
            "longitude": gps.get("longitude"),
            "rating": item.get("rating"),
            "reviews_count": item.get("reviews"),
            "price": item.get("price"),
            "category": item.get("type"),
            "recent_reviews": None,
        })
    return out

# --- Helper functions for SerpAPI ID handling ---
def _format_google_place_id(id_value: Any) -> Dict[str, str]:
    """
    Format Google Place ID for SerpAPI based on its format.
    
    Args:
        id_value: The Google Place ID to format
        
    Returns:
        Dict with either data_id or place_id parameter for SerpAPI
    """
    if not id_value:
        return {}
            
    # For IDs that are already in hex format (start with '0x')
    if isinstance(id_value, str) and id_value.startswith("0x"):
        return {"data_id": id_value}
            
    # For all other formats, use place_id
    return {"place_id": str(id_value)}
    
# --- Review fetching helpers ---
def _select_review_identifier(result: Dict[str, Any]) -> Dict[str, str]:
    gid = result.get("google_place_id")
    if gid:
        return _format_google_place_id(gid)
    return {}

def _resolve_data_id_via_maps(base_params: Dict[str, Any], result: Dict[str, Any]) -> Optional[str]:
    """
    Try to resolve a place ID by searching for the place by name and address.
    Returns either data_id (preferred) or place_id if found.
    
    Args:
        base_params: Base parameters for the API request
        result: Place result containing name and address
        
    Returns:
        String place identifier (either data_id or place_id) or None if not found
    """
    name = result.get("name") or ""
    address = result.get("address") or ""
    q = f"{name} {address}".strip()
    if not q:
        return None
    params = {
        "engine": "google_maps",
        "q": q,
        "hl": base_params.get("hl", "en"),
        "api_key": base_params.get("api_key"),
    }
    try:
        r = requests.get(SEARCH_ENDPOINT, params=params, timeout=120)  # 2 minute timeout
        r.raise_for_status()
        data = r.json()
    except Exception:
        return None
        
    # Check place_results first
    pr = data.get("place_results") or {}
    
    # Prefer data_id over place_id when available
    if pr.get("data_id"):
        return pr["data_id"]
    if pr.get("place_id"):
        return pr["place_id"]
    
    # Check local_results as fallback
    for it in data.get("local_results", []) or []:
        if it.get("data_id"):
            return it["data_id"]
        if it.get("place_id"):
            return it["place_id"]
            
    return None

def fetch_place_photos(base_params: Dict[str, Any], result: Dict[str, Any], max_photos: int = 10) -> List[Dict[str, Any]]:
    """
    This function has been removed as part of the photo fetching removal.
    Returns an empty list as photos are no longer supported.
    
    Returns:
        Empty list
    """
    return []

def fetch_reviews(base_params: Dict[str, Any], result: Dict[str, Any], max_reviews: int = 5) -> List[Dict[str, Any]]:
    # Get the properly formatted ID parameter (either place_id or data_id)
    id_param = _select_review_identifier(result)
    
    if not id_param:
        # Try to resolve ID from name/address search
        resolved_id = _resolve_data_id_via_maps(base_params, result)
        if not resolved_id:
            return []
        id_param = _format_google_place_id(resolved_id)
    
    # Build request parameters
    params = {
        "engine": "google_maps_reviews",
        "api_key": base_params.get("api_key"),
        "hl": base_params.get("hl", "en"),
        **id_param,  # This will add either place_id or data_id parameter
    }
    
    try:
        r = requests.get(SEARCH_ENDPOINT, params=params, timeout=120)  # 2 minute timeout
        r.raise_for_status()
        payload = r.json()
    except Exception:
        payload = {}
        
    reviews = payload.get("reviews", []) or []
    
    # If no reviews were found with the first attempt, try to search by name and address
    if not reviews:
        resolved_id = _resolve_data_id_via_maps(base_params, result)
        if resolved_id:
            retry_param = _format_google_place_id(resolved_id)
            retry = {
                "engine": "google_maps_reviews",
                "api_key": base_params.get("api_key"),
                "hl": base_params.get("hl", "en"),
                **retry_param,
            }
            try:
                r2 = requests.get(SEARCH_ENDPOINT, params=retry, timeout=120)  # 2 minute timeout
                r2.raise_for_status()
                payload = r2.json()
                reviews = payload.get("reviews", []) or []
            except Exception:
                reviews = []
    
    out: List[Dict[str, Any]] = []
    for rv in reviews[:max_reviews]:
        out.append({
            "rating": rv.get("rating"),
            "date": rv.get("date"),
            "iso_date": rv.get("iso_date"),
            "snippet": (rv.get("extracted_snippet", {}) or {}).get("original") or rv.get("snippet"),
            "user": (rv.get("user", {}) or {}).get("name"),
            "source": rv.get("source"),
        })
    return out

def run_gm(user_prompt: str, ctx: Dict[str, Any], save_to_file: bool = False) -> Dict[str, Any]:
    params = generate_serp_params(user_prompt, ctx)
    # Inject an early simplification (idempotent) so retries start cleaner
    if params.get("location"):
        params["location"] = _simplify_location(params["location"])
    payload = fetch_local_results(params)
    results = normalize_results(payload)[:7] if payload else []
    for r in results:
        # Add distance to each result
        r["distance_km"] = _add_distance(ctx, r.get("latitude"), r.get("longitude"))
        
        # Fetch reviews for each result
        r["recent_reviews"] = fetch_reviews(params, r, max_reviews=3) or None  # was 5
        
        # Photos functionality has been removed
    
    out = {
        "context": ctx,
        "query": user_prompt,
        "count": len(results),
        "results": results,
    }
    
    # Only save to file if explicitly requested (for backward compatibility)
    if save_to_file:
        with open(DATA_DIR / "gm_results.json", "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        print(f"[Google] Saved {len(results)} -> {DATA_DIR / 'gm_results.json'} (loc={params.get('location')})")
    else:
        print(f"[Google] Found {len(results)} results (loc={params.get('location')})")
    
    return out

# ==================================================================
#                           ORCHESTRATOR
# ==================================================================
def main():
    """
    Main function that provides usage instructions.
    """
    print("PlacesFinder Search API")
    print("======================")
    print("This module is designed to be used as an API component.")
    print("Please use the Next.js frontend or call search_places_api() directly.")
    print()
    print("Example usage:")
    print("  from fsgm import search_places_api")
    print("  result = search_places_api('coffee shops', {'latitude': 28.6139, 'longitude': 77.2090})")
    print()

if __name__=="__main__":
    main()