#!/usr/bin/env python3
"""
Test that mimics exactly what the frontend does
"""
import requests
import json

def test_frontend_mimic():
    """Test that mimics the frontend registration call exactly"""
    
    base_url = "https://taborder.onrender.com"
    
    # Test data that matches frontend exactly
    test_data = {
        "business_name": "Test Wholesalers",
        "owner_name": "Test Owner", 
        "email": "test4@wholesalers.co.za",
        "phone": "+27821234570",
        "password": "testpassword123",
        "address": "123 Test Street",
        "business_type": "Wholesale",
        "tax_number": "123456789"
    }
    
    print("🔍 MIMIC: Testing like frontend does...")
    print(f"📡 URL: {base_url}/api/vendor/register")
    print(f"📝 Data (exactly like frontend):")
    for key, value in test_data.items():
        print(f"   {key}: '{value}'")
    
    try:
        # Mimic frontend exactly
        response = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data,
            headers={
                'Content-Type': 'application/json',
            },
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        # Check if response has content
        response_text = response.text
        print(f"📄 Response text: {response_text}")
        
        if response.status_code == 200 or response.status_code == 201:
            try:
                data = json.loads(response_text)
                print(f"✅ JSON Response: {json.dumps(data, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON Parse Error: {e}")
        else:
            print(f"❌ Request failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_frontend_mimic() 