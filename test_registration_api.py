#!/usr/bin/env python3
"""
Test script to directly test the registration API endpoint
"""
import requests
import json

def test_registration_api():
    """Test the vendor registration API endpoint"""
    
    # Your Render URL (replace with your actual URL)
    base_url = "https://taborder-favicon-fix.onrender.com"
    
    # Test data
    test_data = {
        "business_name": "Test Wholesalers",
        "owner_name": "Test Owner",
        "email": "test@wholesalers.co.za",
        "phone": "+27821234567",
        "password": "testpassword123",
        "address": "123 Test Street",
        "business_type": "Wholesale",
        "tax_number": "123456789"
    }
    
    print("🧪 Testing Registration API...")
    print(f"📡 URL: {base_url}/api/vendor/register")
    print(f"📝 Data: {json.dumps(test_data, indent=2)}")
    
    try:
        # Make the request
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
        print(f"📋 Response Headers: {dict(response.headers)}")
        print(f"📄 Response Text: {response.text}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print(f"✅ JSON Response: {json.dumps(json_data, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON Parse Error: {e}")
        else:
            print(f"❌ Request failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    test_registration_api() 