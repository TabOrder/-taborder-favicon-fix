#!/usr/bin/env python3
"""
Test script to check the health endpoint
"""
import requests
import json

def test_health_api():
    """Test the health API endpoint"""
    
    # Your Render URL
    base_url = "https://taborder.onrender.com"  # Note: using the correct URL from logs
    
    print("🧪 Testing Health API...")
    print(f"📡 URL: {base_url}/health")
    
    try:
        # Make the request
        response = requests.get(
            f"{base_url}/health",
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
    test_health_api() 