"""
Location utility functions for Next.js integration.

Provides location caching, validation, and utility functions for the backend API.
Frontend handles geolocation capture directly via browser navigator.geolocation API.
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Save cache under `<repo_root>/data/location_context.json`
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
CACHE_FILE = DATA_DIR / "location_context.json"


def validate_coordinates(lat: float, lon: float) -> bool:
    """
    Validate latitude/longitude values are within valid ranges.
    
    Args:
        lat: Latitude value
        lon: Longitude value
    
    Returns:
        True if coordinates are valid, False otherwise
    """
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        return (-90 <= lat_f <= 90) and (-180 <= lon_f <= 180)
    except (ValueError, TypeError):
        return False


def save_location_cache(location_data: Dict[str, Any]) -> bool:
    """
    Save location data to cache file for Python backend consistency.
    
    Args:
        location_data: Location data from frontend
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        # Validate required fields
        if not location_data.get('latitude') or not location_data.get('longitude'):
            return False
            
        if not validate_coordinates(location_data['latitude'], location_data['longitude']):
            return False
            
        # Ensure data directory exists
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Save location data
        CACHE_FILE.write_text(
            json.dumps(location_data, ensure_ascii=False, indent=2), 
            encoding="utf-8"
        )
        return True
    except Exception:
        return False


def get_location_cache() -> Optional[Dict[str, Any]]:
    """
    Get cached location data if it exists.
    
    Returns:
        Location data dict if exists and valid, None otherwise
    """
    if CACHE_FILE.exists():
        try:
            location_data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            
            # Validate cached data
            if validate_coordinates(
                location_data.get('latitude'), 
                location_data.get('longitude')
            ):
                return location_data
        except Exception:
            pass
    return None


def clear_location_cache() -> bool:
    """
    Clear cached location data.
    
    Returns:
        True if cleared successfully, False otherwise
    """
    try:
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()
        return True
    except Exception:
        return False


def format_location_for_context(location_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format location data from frontend into context format expected by backend.
    
    Args:
        location_data: Raw location data from frontend
        
    Returns:
        Formatted context data
    """
    lat = location_data.get('latitude')
    lon = location_data.get('longitude')
    
    if not validate_coordinates(lat, lon):
        raise ValueError("Invalid coordinates provided")
    
    return {
        "latitude": float(lat),
        "longitude": float(lon),
        "ll": f"{lat},{lon}",
        "timezone": location_data.get('timezone', 'UTC'),
        "current_time": location_data.get('captured_at', ''),
        "text_location": location_data.get('text_location'),
        "source": "frontend_geolocation",
        "captured_at": location_data.get('captured_at'),
        "accuracy_m": location_data.get('accuracy_m')
    }


# Removed deprecated function: get_browser_location


def main():
    """
    Main function that provides usage instructions.
    """
    print("PlacesFinder Location Utilities")
    print("==============================")
    print("This module provides location management utilities for the API.")
    print("Please use the Next.js frontend or call these functions directly:")
    print("  - validate_coordinates(): Check if latitude/longitude values are valid")
    print("  - save_location_cache(): Save location data to cache")
    print("  - get_location_cache(): Get cached location data")
    print("  - clear_location_cache(): Clear cached location data")
    print("  - format_location_for_context(): Format location data for backend context")
    print()

if __name__ == "__main__":
    main()