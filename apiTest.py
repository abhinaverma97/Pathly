#!/usr/bin/env python3
"""
Quick API Test Script for PlacesFinder

A simplified test script for quick verification of API functionality.
Tests the most important endpoints with minimal setup.

Usage:
    python quick_test.py
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://localhost:5000"
TEST_LOCATION = {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timezone": "Asia/Kolkata",
    "captured_at": datetime.now().isoformat() + "Z"
}

def test_endpoint(method, endpoint, data=None, description=""):
    """Test a single endpoint"""
    url = f"{API_BASE}{endpoint}"
    print(f"\n🧪 Testing: {description}")
    print(f"   {method} {endpoint}")
    
    # Determine timeout based on endpoint
    timeout = 10  # Default for simple endpoints
    if endpoint in ["/api/search", "/api/search/simple"]:
        timeout = 120  # 2 minutes for search endpoints
    elif endpoint == "/api/rank":
        timeout = 60   # 1 minute for ranking
    
    try:
        print(f"   ⏱️  Timeout: {timeout}s")
        if method == "GET":
            response = requests.get(url, timeout=timeout)
        else:
            response = requests.post(url, json=data, timeout=timeout)
        
        result = response.json()
        
        if response.status_code == 200 and result.get("success"):
            print(f"   ✅ SUCCESS - {result.get('message', 'OK')}")
            return True, result
        else:
            print(f"   ❌ FAILED - {result.get('error', 'Unknown error')}")
            print(f"   📄 Response: {response.status_code} - {response.text[:200]}...")
            return False, result
            
    except requests.exceptions.Timeout as e:
        print(f"   ⏰ TIMEOUT - Request took longer than {timeout}s")
        print(f"   💡 This might be normal for search endpoints on first run")
        return False, None
    except requests.exceptions.ConnectionError as e:
        print(f"   🔌 CONNECTION ERROR - {str(e)}")
        return False, None
    except Exception as e:
        print(f"   ❌ ERROR - {str(e)}")
        return False, None

def main():
    print("🚀 PlacesFinder API Quick Test")
    print("=" * 40)
    
    # Check if server is running
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=5)
        if response.status_code != 200:
            print("❌ Server not responding. Make sure Flask server is running:")
            print("   python api_server.py")
            return
    except:
        print("❌ Cannot connect to server. Make sure Flask server is running:")
        print("   python api_server.py")
        return
    
    # Check environment variables by testing a simple search first
    print("\n🔍 Checking API configuration...")
    try:
        # Try a very simple request to see if APIs are configured
        simple_payload = {"query": "test", "location": TEST_LOCATION}
        response = requests.post(f"{API_BASE}/api/search/simple", json=simple_payload, timeout=10)
        
        if response.status_code == 500:
            result = response.json()
            if "API" in result.get("error", "").upper():
                print("⚠️  API configuration issue detected:")
                print("   Make sure your .env file contains:")
                print("   - GROQ_API_KEY")
                print("   - FOURSQUARE_API_KEY") 
                print("   - SERPAPI_KEY")
                print("   Continuing with extended timeouts...")
        
    except requests.exceptions.Timeout:
        print("⚠️  Initial API check timed out - this is normal for first run")
    except Exception as e:
        print(f"⚠️  API configuration check failed: {str(e)}")
    
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Health Check
    total_tests += 1
    success, _ = test_endpoint("GET", "/api/health", description="Health Check")
    if success:
        tests_passed += 1
    
    # Test 2: Save Location
    total_tests += 1
    success, _ = test_endpoint("POST", "/api/location/save", TEST_LOCATION, "Save Location")
    if success:
        tests_passed += 1
    
    # Test 3: Get Cached Location
    total_tests += 1
    success, _ = test_endpoint("GET", "/api/location/cache", description="Get Cached Location")
    if success:
        tests_passed += 1
    
    # Test 4: Simple Search
    total_tests += 1
    search_payload = {"query": "coffee shops", "location": TEST_LOCATION}
    success, search_result = test_endpoint("POST", "/api/search/simple", search_payload, "Simple Search")
    if success:
        tests_passed += 1
        # Show some results
        if search_result and search_result.get("data"):
            data = search_result["data"]
            fs_count = data.get("foursquare", {}).get("count", 0)
            gm_count = data.get("google", {}).get("count", 0)
            print(f"      📊 Found {fs_count} Foursquare + {gm_count} Google results")
    
    # Test 5: Full Search with Ranking
    total_tests += 1
    search_payload = {"query": "restaurants near me", "location": TEST_LOCATION}
    success, full_result = test_endpoint("POST", "/api/search", search_payload, "Full Search with AI Ranking")
    if success:
        tests_passed += 1
        # Show ranking results
        if full_result and full_result.get("data"):
            ranked_places = full_result["data"].get("ranked_results", {}).get("ranked_places", [])
            print(f"      🏆 Ranked {len(ranked_places)} places")
            if ranked_places:
                top_place = ranked_places[0]
                print(f"      🥇 Top result: {top_place.get('name', 'Unknown')}")
    
    # Test 6: Standalone Ranking (if we have search data)
    if search_result and search_result.get("data"):
        total_tests += 1
        success, _ = test_endpoint("POST", "/api/rank", search_result["data"], "Standalone Ranking")
        if success:
            tests_passed += 1
    
    # Summary
    print("\n" + "=" * 40)
    print(f"📈 Test Summary: {tests_passed}/{total_tests} passed ({tests_passed/total_tests*100:.0f}%)")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Your API is working correctly.")
    elif tests_passed > 0:
        print("⚠️  Some tests failed. Check the output above for details.")
    else:
        print("❌ All tests failed. Check your server configuration.")
    
    print("\n💡 To run more comprehensive tests, use:")
    print("   python test_api_endpoints.py --verbose")

if __name__ == "__main__":
    main()
