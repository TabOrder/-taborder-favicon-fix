#!/usr/bin/env python3
"""
Simple test to trigger registration and see detailed logs
"""
import requests
import json

def test_simple_debug():
    """Simple test to see detailed debugging"""
    
    base_url = "https://taborder.onrender.com"
    
    # Minimal test data
    test_data = {
        "business_name": "Test Business",
        "owner_name": "Test Owner", 
        "email": "test5@test.com",
        "phone": "+27821234571",
        "password": "test123",
        "address": "Test Address",
        "business_type": "Test Type",
        "tax_number": "123456"
    }
    
    print("🔍 SIMPLE DEBUG: Testing registration...")
    print(f"📡 URL: {base_url}/api/vendor/register")
    
    try:
        response = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Status: {response.status_code}")
        print(f"📄 Response: {response.text}")
        
        # Also test with missing fields to see if validation works
        print("\n🔍 Testing with missing email...")
        test_data_no_email = test_data.copy()
        del test_data_no_email['email']
        
        response2 = requests.post(
            f"{base_url}/api/vendor/register",
            json=test_data_no_email,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Status (no email): {response2.status_code}")
        print(f"📄 Response (no email): {response2.text}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_simple_debug() 