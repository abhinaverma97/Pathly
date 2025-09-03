#!/usr/bin/env python3
"""
PlacesFinder API Diagnostic Tool

Helps diagnose issues with the API by checking:
1. Server connectivity
2. Environment variables
3. External API connectivity
4. Individual component status

Usage:
    python diagnose_api.py
"""

import requests
import json
import os
from datetime import datetime

API_BASE = "http://localhost:5000"

def check_server_status():
    """Check if the server is running and responsive"""
    print("🔍 Checking server status...")
    
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Server is running - {data.get('message', 'OK')}")
            return True
        else:
            print(f"   ❌ Server returned status code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to server")
        print("   💡 Make sure Flask server is running: python api_server.py")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def check_environment_config():
    """Check backend environment configuration"""
    print("\n🔧 Checking environment configuration...")
    
    # Try to get some indication of backend config by testing endpoints
    test_location = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timezone": "Asia/Kolkata",
        "captured_at": datetime.now().isoformat() + "Z"
    }
    
    # Test location save (should work without external APIs)
    try:
        response = requests.post(f"{API_BASE}/api/location/save", json=test_location, timeout=10)
        if response.status_code == 200:
            print("   ✅ Location services working")
        else:
            print(f"   ⚠️  Location save issue: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Location save error: {str(e)}")
    
    # Test if we can get cached location
    try:
        response = requests.get(f"{API_BASE}/api/location/cache", timeout=10)
        if response.status_code == 200:
            print("   ✅ Location cache working")
        else:
            print(f"   ⚠️  Location cache issue: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Location cache error: {str(e)}")

def test_search_components():
    """Test individual search components with minimal queries"""
    print("\n🔍 Testing search components...")
    
    test_location = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "timezone": "Asia/Kolkata",
        "captured_at": datetime.now().isoformat() + "Z"
    }
    
    # Test simple search with short timeout first
    print("   Testing simple search (10s timeout)...")
    try:
        payload = {"query": "coffee", "location": test_location}
        response = requests.post(f"{API_BASE}/api/search/simple", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print("   ✅ Simple search working quickly")
                search_data = data.get("data", {})
                fs_count = search_data.get("foursquare", {}).get("count", 0)
                gm_count = search_data.get("google", {}).get("count", 0)
                print(f"      📊 Found {fs_count} Foursquare + {gm_count} Google results")
                return True
            else:
                print(f"   ❌ Simple search API error: {data.get('error')}")
                return False
        else:
            print(f"   ❌ Simple search HTTP error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"      Error details: {error_data.get('error', 'No details')}")
            except:
                print(f"      Raw response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print("   ⏰ Simple search timed out (10s) - trying with longer timeout...")
        
        # Try with longer timeout
        try:
            response = requests.post(f"{API_BASE}/api/search/simple", json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print("   ✅ Simple search working with longer timeout")
                    search_data = data.get("data", {})
                    fs_count = search_data.get("foursquare", {}).get("count", 0)
                    gm_count = search_data.get("google", {}).get("count", 0)
                    print(f"      📊 Found {fs_count} Foursquare + {gm_count} Google results")
                    print("      💡 Consider optimizing API calls for better performance")
                    return True
                else:
                    print(f"   ❌ Simple search failed: {data.get('error')}")
                    return False
            else:
                print(f"   ❌ Simple search failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Simple search failed completely: {str(e)}")
            return False
            
    except Exception as e:
        print(f"   ❌ Simple search error: {str(e)}")
        return False

def test_ai_ranking():
    """Test AI ranking functionality"""
    print("\n🤖 Testing AI ranking...")
    
    # Create minimal test data for ranking
    test_data = {
        "query": "coffee",
        "context": {
            "latitude": 28.6139,
            "longitude": 77.2090,
            "ll": "28.6139,77.2090",
            "timezone": "Asia/Kolkata"
        },
        "foursquare": {
            "count": 1,
            "results": [{
                "fsq_place_id": "test123",
                "name": "Test Coffee Shop",
                "latitude": 28.614,
                "longitude": 77.209,
                "address": "Test Address",
                "distance_km": 0.1
            }]
        },
        "google": {
            "count": 1,
            "results": [{
                "google_place_id": "test456", 
                "name": "Test Cafe",
                "latitude": 28.615,
                "longitude": 77.210,
                "address": "Test Address 2",
                "rating": 4.5,
                "distance_km": 0.2
            }]
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/api/rank", json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                ranked_data = data.get("data", {})
                ranked_places = ranked_data.get("ranked_places", [])
                print(f"   ✅ AI ranking working - {len(ranked_places)} places ranked")
                return True
            else:
                print(f"   ❌ AI ranking failed: {data.get('error')}")
                return False
        else:
            print(f"   ❌ AI ranking HTTP error: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ⏰ AI ranking timed out (30s)")
        print("   💡 This could indicate issues with Groq API or network")
        return False
    except Exception as e:
        print(f"   ❌ AI ranking error: {str(e)}")
        return False

def provide_recommendations(server_ok, search_ok, ranking_ok):
    """Provide troubleshooting recommendations"""
    print("\n" + "=" * 50)
    print("💡 RECOMMENDATIONS")
    print("=" * 50)
    
    if not server_ok:
        print("🚨 CRITICAL: Server not running")
        print("   1. Start the backend server: python api_server.py")
        print("   2. Check for port conflicts (port 5000)")
        print("   3. Verify Python dependencies are installed")
        return
    
    if not search_ok:
        print("🚨 CRITICAL: Search functionality broken")
        print("   1. Check .env file contains required API keys:")
        print("      - GROQ_API_KEY")
        print("      - FOURSQUARE_API_KEY")
        print("      - SERPAPI_KEY")
        print("   2. Verify API keys are valid and have quota remaining")
        print("   3. Check internet connectivity")
        print("   4. Look at server logs for detailed error messages")
        return
    
    if not ranking_ok:
        print("⚠️  WARNING: AI ranking issues")
        print("   1. Check GROQ_API_KEY in .env file")
        print("   2. Verify Groq API quota and connectivity")
        print("   3. Simple search still works, so basic functionality is OK")
    else:
        print("✅ ALL SYSTEMS WORKING")
        print("   The API is functioning correctly!")
        print("   If you're experiencing timeouts:")
        print("   1. This is normal on first run (API warm-up)")
        print("   2. Subsequent requests should be faster")
        print("   3. Consider implementing caching for better performance")

def main():
    print("🩺 PlacesFinder API Diagnostic Tool")
    print("=" * 50)
    
    server_ok = check_server_status()
    
    if server_ok:
        check_environment_config()
        search_ok = test_search_components()
        ranking_ok = test_ai_ranking() if search_ok else False
    else:
        search_ok = False
        ranking_ok = False
    
    provide_recommendations(server_ok, search_ok, ranking_ok)
    
    print(f"\n📋 SUMMARY:")
    print(f"   Server: {'✅' if server_ok else '❌'}")
    print(f"   Search: {'✅' if search_ok else '❌'}")
    print(f"   AI Ranking: {'✅' if ranking_ok else '❌'}")

if __name__ == "__main__":
    main()
