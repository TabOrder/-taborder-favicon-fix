#!/usr/bin/env python3
"""
Test to see exactly what data the API is receiving
"""
import requests
import json

def test_raw_data():
    """Test to see raw data reception"""
    
    base_url = "https://taborder.onrender.com"
    
    # Test with minimal data
    test_data = {
        "email": "test@test.com",
        "password": "test123",
        "business_name": "Test Business",
        "phone": "+27821234571",
        "owner_name": "Test Owner"
    }
    
    print("🔍 RAW DATA TEST: Testing with minimal required fields only...")
    print(f"📡 URL: {base_url}/api/vendor/register")
    print(f"📝 Sending only required fields:")
    for key, value in test_data.items():
        print(f"   {key}: '{value}'")
    
    try:
        response = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"\n📊 Status: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        # Test with completely empty data
        print("\n🔍 Testing with empty JSON...")
        response2 = requests.post(
            f"{base_url}/api/vendor/register",
            json={},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Status (empty): {response2.status_code}")
        print(f"📄 Response (empty): {response2.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_raw_data() 