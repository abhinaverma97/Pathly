"""
Flask API server for Next.js frontend integration.

Provides REST API endpoints for place search and ranking functionality.
Acts as a bridge between Next.js frontend and Python backend services.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import datetime
from pathlib import Path

# Add src directory to Python path
sys.path.append(str(Path(__file__).resolve().parent / "src"))

try:
    from fsgm import search_places_api
    from ranking import rank_places_api
    from userLocation import save_location_cache, validate_coordinates, get_location_cache
    from errors import api_error_response, api_success_response
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure all required packages are installed: pip install -r requirements.txt")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify(api_success_response({
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat()
    }, "Places API server is running"))


@app.route('/api/location/cache', methods=['GET'])
def get_location():
    """Get cached location data."""
    try:
        cached_location = get_location_cache()
        if cached_location:
            return jsonify(api_success_response(cached_location))
        else:
            return jsonify(api_error_response("No cached location found", 404, "LOCATION_NOT_FOUND"))
    except Exception as e:
        return jsonify(api_error_response(f"Failed to retrieve location cache: {str(e)}", 500))


@app.route('/api/location/save', methods=['POST'])
def save_location():
    """Save location data to cache."""
    try:
        data = request.json
        if not data:
            return jsonify(api_error_response("No location data provided", 400, "MISSING_DATA"))
        
        lat = data.get('latitude')
        lon = data.get('longitude')
        
        if not lat or not lon:
            return jsonify(api_error_response("Latitude and longitude are required", 400, "MISSING_COORDINATES"))
        
        if not validate_coordinates(lat, lon):
            return jsonify(api_error_response("Invalid coordinates provided", 400, "INVALID_COORDINATES"))
        
        # Save location cache
        if save_location_cache(data):
            return jsonify(api_success_response({}, "Location saved successfully"))
        else:
            return jsonify(api_error_response("Failed to save location", 500, "SAVE_FAILED"))
    
    except Exception as e:
        return jsonify(api_error_response(f"Unexpected error: {str(e)}", 500))


@app.route('/api/search', methods=['POST'])
def api_search():
    """
    Main search endpoint that combines Foursquare + Google search with AI ranking.
    """
    try:
        data = request.json
        if not data:
            return jsonify(api_error_response("No request data provided", 400, "MISSING_DATA"))
        
        query = data.get('query')
        location = data.get('location')
        
        # Validate inputs
        if not query or not query.strip():
            return jsonify(api_error_response("Search query is required", 400, "MISSING_QUERY"))
        
        if not location:
            return jsonify(api_error_response("Location data is required", 400, "MISSING_LOCATION"))
        
        lat = location.get('latitude')
        lon = location.get('longitude')
        
        if not validate_coordinates(lat, lon):
            return jsonify(api_error_response("Valid location coordinates are required", 400, "INVALID_COORDINATES"))
        
        # Save location cache for consistency
        save_location_cache(location)
        
        # Step 1: Search places using both APIs
        search_results = search_places_api(query.strip(), location)
        
        if not search_results.get('success'):
            return jsonify(api_error_response(
                f"Search failed: {search_results.get('error')}", 
                500, 
                "SEARCH_ERROR",
                {"stage": "search"}
            ))
        
        # Step 2: Rank results using AI
        ranking_results = rank_places_api(search_results['data'])
        
        if not ranking_results.get('success'):
            return jsonify(api_error_response(
                f"Ranking failed: {ranking_results.get('error')}",
                500,
                "RANKING_ERROR",
                {
                    "stage": "ranking",
                    # Don't include full search data as it could be very large
                    "search_summary": {
                        "query": query.strip(),
                        "foursquare_count": search_results['data']['foursquare']['count'],
                        "google_count": search_results['data']['google']['count']
                    }
                }
            ))
        
        # Step 3: Return successful result
        response_data = {
            "query": query.strip(),
            "location": location,
            "search_results": search_results['data'],
            "ranked_results": ranking_results['data']
        }
        
        meta_data = {
            "foursquare_count": search_results['data']['foursquare']['count'],
            "google_count": search_results['data']['google']['count'],
            "total_ranked": len(ranking_results['data'].get('ranked_places', []))
        }
        
        return jsonify(api_success_response(response_data, meta=meta_data))
    
    except Exception as e:
        return jsonify(api_error_response(
            f"Unexpected error: {str(e)}", 
            500, 
            "SERVER_ERROR", 
            {"stage": "server"}
        ))


@app.route('/api/search/simple', methods=['POST'])
def api_search_simple():
    """
    Simple search endpoint that returns only raw search results (no AI ranking).
    Useful for testing or when ranking is not needed.
    """
    try:
        data = request.json
        query = data.get('query')
        location = data.get('location')
        
        if not query:
            return jsonify(api_error_response("Query required", 400, "MISSING_QUERY"))
        
        if not location or not validate_coordinates(location.get('latitude'), location.get('longitude')):
            return jsonify(api_error_response("Valid location required", 400, "INVALID_LOCATION"))
        
        # Search places only
        search_results = search_places_api(query, location)
        
        # Return the data directly without modifying the structure
        return jsonify(search_results)
    
    except Exception as e:
        return jsonify(api_error_response(str(e), 500, "SERVER_ERROR"))


@app.route('/api/rank', methods=['POST'])
def api_rank():
    """
    Standalone ranking endpoint for pre-existing search results.
    """
    try:
        data = request.json
        
        if not data:
            return jsonify(api_error_response("Search results data required", 400, "MISSING_DATA"))
        
        # Rank the provided results
        ranking_results = rank_places_api(data)
        
        if not ranking_results.get("success"):
            return jsonify(api_error_response(
                ranking_results.get("error", "Ranking failed"), 
                500, 
                "RANKING_ERROR"
            ))
        
        return jsonify(api_success_response(ranking_results["data"], "Ranking completed successfully"))
    
    except Exception as e:
        return jsonify(api_error_response(str(e), 500, "SERVER_ERROR"))


@app.errorhandler(404)
def not_found(error):
    return jsonify(api_error_response(
        "Endpoint not found", 
        404, 
        "NOT_FOUND",
        {
            "available_endpoints": [
                "/api/health",
                "/api/location/cache",
                "/api/location/save", 
                "/api/search",
                "/api/search/simple",
                "/api/rank"
            ]
        }
    )), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify(api_error_response(
        "Internal server error", 
        500, 
        "SERVER_ERROR"
    )), 500


if __name__ == '__main__':
    print("Starting Places API Server...")
    print("Available endpoints:")
    print("  GET  /api/health - Health check")
    print("  GET  /api/location/cache - Get cached location")
    print("  POST /api/location/save - Save location to cache")
    print("  POST /api/search - Full search with ranking")
    print("  POST /api/search/simple - Search only (no ranking)")
    print("  POST /api/rank - Rank existing results")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
