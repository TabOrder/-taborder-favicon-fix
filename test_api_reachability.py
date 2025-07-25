#!/usr/bin/env python3
"""
Test API reachability and basic functionality
"""
import requests
import json

def test_api_reachability():
    """Test if the API endpoints are reachable"""
    
    base_url = "https://taborder.onrender.com"
    
    print("🔍 API REACHABILITY TEST...")
    
    # Test 1: Health endpoint
    print("\n📝 Test 1: Health endpoint")
    try:
        response = requests.get(f"{base_url}/health", timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Test registration endpoint
    print("\n📝 Test 2: Test registration endpoint")
    try:
        response = requests.post(
            f"{base_url}/api/test-registration",
            json={"test": "data"},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Vendor registration endpoint (with minimal data)
    print("\n📝 Test 3: Vendor registration endpoint")
    try:
        test_data = {
            "email": "test@test.com",
            "password": "test123",
            "business_name": "Test Business",
            "phone": "+27821234571",
            "owner_name": "Test Owner"
        }
        
        response = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_api_reachability() 