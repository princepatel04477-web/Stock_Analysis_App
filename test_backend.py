#!/usr/bin/env python3
"""
Quick backend test script to verify all endpoints are working
"""

import requests
import json
import time

def test_endpoint(url, description):
    """Test an endpoint and return results"""
    print(f"\n🔍 Testing: {description}")
    print(f"URL: {url}")
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=30)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success ({response.status_code}) - {duration:.2f}s")
                # Print first few keys for verification
                if isinstance(data, dict):
                    keys = list(data.keys())[:3]
                    print(f"   Response keys: {keys}")
                elif isinstance(data, list) and len(data) > 0:
                    print(f"   Response: list with {len(data)} items")
                    if isinstance(data[0], str):
                        print(f"   First item: {data[0][:50]}...")
                else:
                    print(f"   Response: {str(data)[:100]}...")
                return True
            except json.JSONDecodeError:
                print(f"✅ Success ({response.status_code}) - Non-JSON response - {duration:.2f}s")
                print(f"   Response: {response.text[:100]}...")
                return True
        else:
            print(f"❌ Failed ({response.status_code}) - {duration:.2f}s")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"⏰ Timeout (>30s)")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    """Run all backend tests"""
    print("🚀 Backend API Testing Started")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8001"
    proxy_url = "http://localhost:3001"
    
    # Test endpoints
    tests = [
        (f"{base_url}/health", "Direct Health Check"),
        (f"{base_url}/api/health", "API Health Check"),
        (f"{proxy_url}/api/health", "Frontend Proxy Health Check"),
        (f"{base_url}/api/stocks?limit=3", "Get Stocks List (limited)"),
        (f"{base_url}/api/market/summary", "Market Summary"),
        (f"{base_url}/api/analyze/RELIANCE.NS", "Stock Analysis (RELIANCE.NS)"),
    ]
    
    results = []
    for url, description in tests:
        success = test_endpoint(url, description)
        results.append((description, success))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {description}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()