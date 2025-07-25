#!/usr/bin/env python3
"""
Test registration API locally with enhanced debugging
"""
import requests
import json

def test_local_registration():
    """Test registration API locally"""
    
    base_url = "http://localhost:10000"
    
    # Test with minimal data
    test_data = {
        "email": "test@test.com",
        "password": "test123",
        "business_name": "Test Business",
        "phone": "+27821234571",
        "owner_name": "Test Owner"
    }
    
    print("🔍 LOCAL REGISTRATION TEST...")
    print(f"📡 URL: {base_url}/api/vendor/register")
    print(f"📝 Sending data:")
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
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_local_registration() 