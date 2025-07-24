#!/usr/bin/env python3
"""
🗄️ Database Setup Script for TabOrder
Initializes PostgreSQL database tables and provides testing utilities
"""

import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import database functions from the main app
from standalone_app_enhanced import (
    DATABASE_ENABLED, 
    init_database, 
    get_db_connection, 
    save_single_vendor,
    load_vendors
)

def test_database_connection():
    """🔗 Test database connection"""
    if not DATABASE_ENABLED:
        print("❌ Database not enabled. Set DATABASE_URL environment variable.")
        return False
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()
                print(f"✅ Database connected: {version[0]}")
                return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def create_test_vendor():
    """🧪 Create a test vendor"""
    if not DATABASE_ENABLED:
        print("❌ Database not enabled")
        return False
    
    test_vendor = {
        'vendor_id': f"TEST_VENDOR_{int(datetime.now().timestamp())}",
        'email': 'test@taborder.com',
        'password': 'testpassword123',
        'name': 'Test Vendor',
        'owner_name': 'John Test',
        'phone': '+27123456789',
        'business_name': 'Test Business',
        'address': '123 Test Street, Johannesburg',
        'business_type': 'Restaurant',
        'tax_number': 'TAX123456',
        'location': 'Johannesburg, South Africa',
        'status': 'active'
    }
    
    try:
        success = save_single_vendor(test_vendor)
        if success:
            print("✅ Test vendor created successfully")
            return True
        else:
            print("⚠️ Test vendor already exists or creation failed")
            return False
    except Exception as e:
        print(f"❌ Error creating test vendor: {e}")
        return False

def list_all_vendors():
    """📋 List all vendors in database"""
    if not DATABASE_ENABLED:
        print("❌ Database not enabled")
        return
    
    try:
        vendors = load_vendors()
        if vendors:
            print(f"📋 Found {len(vendors)} vendors:")
            for vendor_id, vendor_data in vendors.items():
                print(f"  - {vendor_data.get('business_name', 'Unknown')} ({vendor_data.get('email', 'No email')})")
        else:
            print("📋 No vendors found in database")
    except Exception as e:
        print(f"❌ Error listing vendors: {e}")

def main():
    """🏃‍♂️ Main setup function"""
    print("🗄️ TabOrder Database Setup")
    print("=" * 40)
    
    # Test connection
    if test_database_connection():
        # Initialize tables
        print("\n🗄️ Initializing database tables...")
        init_database()
        
        # Create test vendor
        print("\n🧪 Creating test vendor...")
        create_test_vendor()
        
        # List vendors
        print("\n📋 Current vendors:")
        list_all_vendors()
        
        print("\n✅ Database setup complete!")
    else:
        print("\n❌ Database setup failed. Please check your DATABASE_URL configuration.")

if __name__ == "__main__":
    main() 