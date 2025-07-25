#!/usr/bin/env python3
"""
Debug test to see exactly what data the API is receiving
"""
import requests
import json

def test_registration_debug():
    """Debug the registration API to see what's happening"""
    
    base_url = "https://taborder.onrender.com"
    
    # Test data with explicit values
    test_data = {
        "business_name": "Test Wholesalers",
        "owner_name": "Test Owner", 
        "email": "test3@wholesalers.co.za",
        "phone": "+27821234569",
        "password": "testpassword123",
        "address": "123 Test Street",
        "business_type": "Wholesale",
        "tax_number": "123456789"
    }
    
    print("🔍 DEBUG: Testing Registration API...")
    print(f"📡 URL: {base_url}/api/vendor/register")
    print(f"📝 Data being sent:")
    for key, value in test_data.items():
        print(f"   {key}: '{value}' (length: {len(str(value))})")
    
    try:
        response = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📄 Response Text: {response.text}")
        
        if response.status_code == 400:
            print("❌ 400 Error - Validation failed")
            print("🔍 This means one of the required fields is empty or invalid")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_registration_debug() 