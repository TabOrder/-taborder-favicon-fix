#!/usr/bin/env python3
"""
Test to check JSON parsing issues
"""
import requests
import json

def test_json_parsing():
    """Test JSON parsing issues"""
    
    base_url = "https://taborder.onrender.com"
    
    # Test with different content types
    test_data = {
        "email": "test@test.com",
        "password": "test123",
        "business_name": "Test Business",
        "phone": "+27821234571",
        "owner_name": "Test Owner"
    }
    
    print("🔍 JSON PARSING TEST...")
    
    # Test 1: Normal JSON
    print("📝 Test 1: Normal JSON")
    try:
        response1 = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        print(f"   Status: {response1.status_code}")
        print(f"   Response: {response1.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Form data
    print("\n📝 Test 2: Form data")
    try:
        response2 = requests.post(
            f"{base_url}/api/vendor/register",
            data=test_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30
        )
        print(f"   Status: {response2.status_code}")
        print(f"   Response: {response2.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Raw JSON string
    print("\n📝 Test 3: Raw JSON string")
    try:
        response3 = requests.post(
            f"{base_url}/api/vendor/register",
            data=json.dumps(test_data),
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        print(f"   Status: {response3.status_code}")
        print(f"   Response: {response3.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_json_parsing() 