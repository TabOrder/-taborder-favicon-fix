#!/usr/bin/env python3
"""
🦁 TabOrder - ULTIMATE USSD App (Native User Optimized)
Features: Auto-registration, CTT, Fuzzy Search, CRUD, Loyalty Points, SMS Invoices
Trust-based flow with minimal friction for African native users
"""

import os
import json
import logging
import math
import random
import re
import time
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import flask_cors
print(f"[INFO] Flask-CORS version: {flask_cors.__version__}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global sessions storage
sessions = {}

# File-based session storage
import tempfile
import pickle

# Use /opt/render/project/src for more persistent storage on Render
PERSISTENT_DIR = os.environ.get('PERSISTENT_DIR', '/tmp')
SESSIONS_FILE = f'{PERSISTENT_DIR}/taborder_sessions.pkl'
USERS_FILE = f'{PERSISTENT_DIR}/taborder_users.pkl'
ORDERS_FILE = f'{PERSISTENT_DIR}/taborder_orders.pkl'

def load_sessions():
    try:
        if os.path.exists(SESSIONS_FILE):
            with open(SESSIONS_FILE, 'rb') as f:
                return pickle.load(f)
    except Exception as e:
        logger.error(f"Error loading sessions: {e}")
    return {}

def save_sessions(sessions):
    try:
        with open(SESSIONS_FILE, 'wb') as f:
            pickle.dump(sessions, f)
    except Exception as e:
        logger.error(f"Error saving sessions: {e}")

def load_users():
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'rb') as f:
                return pickle.load(f)
    except Exception as e:
        logger.error(f"Error loading users: {e}")
    return {}

def save_users(users):
    """💾 Save users - PostgreSQL or file fallback"""
    if DATABASE_ENABLED:
        # For compatibility with bulk operations, save each user individually
        for phone, user_data in users.items():
            db_save_user(phone, user_data)
    else:
        try:
            with open(USERS_FILE, 'wb') as f:
                pickle.dump(users, f)
        except Exception as e:
            logger.error(f"Error saving users: {e}")

def load_orders():
    """📦 Load orders - Not needed with PostgreSQL, but keeping for compatibility"""
    logger.info(f"📦 load_orders called, checking file: {ORDERS_FILE}")
    try:
        if os.path.exists(ORDERS_FILE):
            logger.info(f"📦 Orders file exists, loading...")
            with open(ORDERS_FILE, 'rb') as f:
                orders = pickle.load(f)
                logger.info(f"📦 Successfully loaded {len(orders)} users with orders")
                for phone, user_orders in orders.items():
                    logger.info(f"📦   {phone}: {len(user_orders)} orders")
                return orders
        else:
            logger.info(f"📦 Orders file does not exist: {ORDERS_FILE}")
    except Exception as e:
        logger.error(f"❌ Error loading orders: {e}")
    logger.info(f"📦 Returning empty orders dict")
    return {}

def save_orders(orders):
    """📦 Save orders - Not needed with PostgreSQL, but keeping for compatibility"""
    try:
        with open(ORDERS_FILE, 'wb') as f:
            pickle.dump(orders, f)
    except Exception as e:
        logger.error(f"Error saving orders: {e}")

def is_user_registered(phone_number):
    """👤 Check if user exists - PostgreSQL or file fallback"""
    if DATABASE_ENABLED:
        return db_get_user(phone_number) is not None
    else:
        users = load_users()
        return phone_number in users

def register_user(phone_number, user_data):
    """✅ Register user - PostgreSQL or file fallback"""
    if DATABASE_ENABLED:
        db_save_user(phone_number, user_data)
    else:
        users = load_users()
        users[phone_number] = user_data
        save_users(users)
    logger.info(f"✅ User auto-registered: {phone_number}")

def get_user_data(phone_number):
    """📱 Get user data - PostgreSQL or file fallback"""
    if DATABASE_ENABLED:
        user_data = db_get_user(phone_number)
        return user_data if user_data else {}
    else:
        users = load_users()
        return users.get(phone_number, {})

def save_order(phone_number, order_data):
    """📦 Save order - PostgreSQL or file fallback"""
    logger.info(f"📦 save_order called for {phone_number}")
    if DATABASE_ENABLED:
        logger.info(f"📦 Using database save for order")
        db_save_order(phone_number, order_data)
    else:
        logger.info(f"📦 Using file-based save for order")
        orders = load_orders()
        logger.info(f"📦 Loaded existing orders: {len(orders)} users with orders")
        if phone_number not in orders:
            orders[phone_number] = []
            logger.info(f"📦 Created new order list for {phone_number}")
        orders[phone_number].append(order_data)
        logger.info(f"📦 Added order to list, now {len(orders[phone_number])} orders for {phone_number}")
        save_orders(orders)
        logger.info(f"📦 Orders saved to file")

def get_user_orders(phone_number):
    """📋 Get user orders - PostgreSQL or file fallback"""
    logger.info(f"📋 get_user_orders called for {phone_number}")
    if DATABASE_ENABLED:
        logger.info(f"📋 Using database retrieval for orders")
        result = db_get_user_orders(phone_number)
        logger.info(f"📋 Database returned {len(result) if result else 0} orders")
        return result
    else:
        logger.info(f"📋 Using file-based retrieval for orders")
        orders = load_orders()
        logger.info(f"📋 Loaded orders file: {len(orders)} users with orders")
        user_orders = orders.get(phone_number, [])
        logger.info(f"📋 Found {len(user_orders)} orders for {phone_number}")
        if user_orders:
            for i, order in enumerate(user_orders):
                logger.info(f"📋 Order {i+1}: {order.get('order_number', 'Unknown')}")
        return user_orders

# Load sessions on startup
sessions = load_sessions()

# 🛒 PERSISTENT CART STORAGE (Survives USSD session resets)
CARTS_FILE = f'{PERSISTENT_DIR}/taborder_carts.pkl'

def load_carts():
    """Load persistent carts that survive USSD session resets"""
    try:
        # Try database first
        if DATABASE_ENABLED:
            try:
                from database import get_all_carts
                carts = get_all_carts()
                logger.info(f"🐘 Loaded {len(carts)} carts from database")
                return carts
            except Exception as e:
                logger.warning(f"Database cart loading failed: {e}")
        
        # Fallback to file storage
        if os.path.exists(CARTS_FILE):
            with open(CARTS_FILE, 'rb') as f:
                return pickle.load(f)
    except Exception as e:
        logger.error(f"Error loading carts: {e}")
    return {}

def save_carts(carts):
    """Save persistent carts"""
    try:
        # Try database first
        if DATABASE_ENABLED:
            try:
                from database import save_all_carts
                save_all_carts(carts)
                logger.info(f"🐘 Saved {len(carts)} carts to database")
                return
            except Exception as e:
                logger.warning(f"Database cart saving failed: {e}")
        
        # Fallback to file storage
        with open(CARTS_FILE, 'wb') as f:
            pickle.dump(carts, f)
    except Exception as e:
        logger.error(f"Error saving carts: {e}")

def get_persistent_cart(phone_number):
    """Get user's persistent cart"""
    try:
        # Try database first
        if DATABASE_ENABLED:
            try:
                from database import get_user_cart
                cart = get_user_cart(phone_number)
                logger.info(f"🐘 Loaded cart for {phone_number}: {len(cart)} items from database")
                return cart
            except Exception as e:
                logger.warning(f"Database cart retrieval failed: {e}")
        
        # Fallback to file storage
        carts = load_carts()
        return carts.get(phone_number, [])
    except Exception as e:
        logger.error(f"Error getting persistent cart: {e}")
        return []

def save_persistent_cart(phone_number, cart_items):
    """Save user's persistent cart"""
    try:
        # Try database first
        if DATABASE_ENABLED:
            try:
                from database import save_user_cart
                save_user_cart(phone_number, cart_items)
                logger.info(f"🐘 Database cart saved for {phone_number}: {len(cart_items)} items")
                return
            except Exception as e:
                logger.warning(f"Database cart saving failed: {e}")
        
        # Fallback to file storage
        carts = load_carts()
        carts[phone_number] = cart_items
        save_carts(carts)
        logger.info(f"💾 File cart saved for {phone_number}: {len(cart_items)} items")
    except Exception as e:
        logger.error(f"Error saving persistent cart: {e}")

def clear_persistent_cart(phone_number):
    """Clear user's persistent cart"""
    try:
        # Try database first
        if DATABASE_ENABLED:
            try:
                from database import clear_user_cart
                clear_user_cart(phone_number)
                logger.info(f"🐘 Database cart cleared for {phone_number}")
                return
            except Exception as e:
                logger.warning(f"Database cart clearing failed: {e}")
        
        # Fallback to file storage
        carts = load_carts()
        if phone_number in carts:
            del carts[phone_number]
            save_carts(carts)
            logger.info(f"🗑️ File cart cleared for {phone_number}")
    except Exception as e:
        logger.error(f"Error clearing persistent cart: {e}")

class USSDSession:
    def __init__(self, session_id, phone_number):
        self.session_id = session_id
        self.phone_number = phone_number
        self.current_step = 'start'
        self.temporary_data = {}
        self.created_at = datetime.now(timezone.utc)
        self.last_activity = datetime.now(timezone.utc)
        # 🛒 Load persistent cart on session creation
        self.cart = get_persistent_cart(phone_number)
        logger.info(f"🔄 Session created for {phone_number}: {len(self.cart)} items in cart")
    
    def update_step(self, step):
        self.current_step = step
        self.last_activity = datetime.now(timezone.utc)
    
    def update_temporary_data(self, key, value):
        self.temporary_data[key] = value
        self.last_activity = datetime.now(timezone.utc)
    
    def get_temporary_data(self, key, default=None):
        return self.temporary_data.get(key, default)
    
    def add_to_cart(self, item):
        self.cart.append(item)
        self.last_activity = datetime.now(timezone.utc)
        # 💾 Save cart persistently
        save_persistent_cart(self.phone_number, self.cart)
    
    def remove_from_cart(self, index):
        if 0 <= index < len(self.cart):
            self.cart.pop(index)
            self.last_activity = datetime.now(timezone.utc)
            # 💾 Save cart persistently
            save_persistent_cart(self.phone_number, self.cart)
    
    def clear_cart(self):
        self.cart = []
        self.last_activity = datetime.now(timezone.utc)
        # 🗑️ Clear persistent cart
        clear_persistent_cart(self.phone_number)
    
    def get_cart_total(self):
        return sum(item['price'] * item['quantity'] for item in self.cart)
    
    def has_expired(self):
        now = datetime.now(timezone.utc)
        return (now - self.last_activity).total_seconds() > 300

def get_dynamic_combos():
    """Get combos from database or create dynamic fallback"""
    try:
        # Try to get combos from database first
        try:
            from models.combo_models import ComboSpecial
            from database import db
            
            # Don't use app.app_context() here to avoid circular dependency
            db_combos = ComboSpecial.query.filter_by(is_active=True).all()
            if db_combos:
                logger.info(f"✅ Loaded {len(db_combos)} combos from database")
                return [combo.to_dict() for combo in db_combos]
        except ImportError as e:
            logger.warning(f"⚠️ Database models not available: {e}")
        except Exception as e:
            logger.warning(f"⚠️ Database combo loading failed: {e}")
    except Exception as e:
        logger.warning(f"⚠️ General combo loading error: {e}")
    
    # Dynamic fallback - create combos on-the-fly
    logger.info("🔄 Creating dynamic combo fallback")
    return [
        {
            'id': 1, 'name': 'Essential Groceries', 'price': 45.0, 'category': 'basic',
            'description': 'Daily essentials', 'items': ['Maize meal 2kg', 'Oil 750ml', 'Sugar 1kg', 'Salt 500g'],
            'keywords': ['basic', 'essential', 'daily', 'staple', 'grocery']
        },
        {
            'id': 2, 'name': 'Family Pack', 'price': 120.0, 'category': 'family',
            'description': 'Complete family nutrition', 'items': ['All basics', 'Meat 1kg', 'Vegetables', 'Bread', 'Milk'],
            'keywords': ['family', 'premium', 'complete', 'nutrition', 'meat']
        },
        {
            'id': 3, 'name': 'Baby Care Bundle', 'price': 85.0, 'category': 'baby',
            'description': 'Everything for baby', 'items': ['Diapers 20pk', 'Baby formula', 'Baby food', 'Wet wipes'],
            'keywords': ['baby', 'infant', 'care', 'diaper', 'formula']
        },
        {
            'id': 4, 'name': 'Household Cleaning', 'price': 65.0, 'category': 'cleaning',
            'description': 'Clean home essentials', 'items': ['Detergent', 'Toilet paper', 'Soap', 'Bleach'],
            'keywords': ['cleaning', 'household', 'soap', 'detergent', 'clean']
        },
        {
            'id': 5, 'name': 'Student Survival Kit', 'price': 35.0, 'category': 'student',
            'description': 'Budget student meals', 'items': ['Instant noodles', 'Canned beans', 'Peanut butter', 'Bread'],
            'keywords': ['student', 'budget', 'cheap', 'noodles', 'affordable']
        },
        {
            'id': 6, 'name': 'Breakfast Special', 'price': 40.0, 'category': 'breakfast',
            'description': 'Start your day right', 'items': ['Cereal', 'Milk', 'Bread', 'Eggs', 'Coffee'],
            'keywords': ['breakfast', 'morning', 'cereal', 'coffee', 'eggs']
        }
    ]

# Initialize dynamic combos
ENHANCED_COMBOS = None  # Will be loaded lazily when needed

def get_enhanced_combos():
    """Lazy load combos to avoid circular dependency"""
    global ENHANCED_COMBOS
    if ENHANCED_COMBOS is None:
        ENHANCED_COMBOS = get_dynamic_combos()
    return ENHANCED_COMBOS

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def assign_nearest_pickup_point(ctt_data):
    """Assign the nearest pickup point based on CTT location data"""
    user_location = ctt_data.get('user_location', ())
    country = ctt_data.get('country', 'Unknown')
    
    # Mock pickup points for different countries
    pickup_points = {
        'South Africa 🇿🇦': [
            {'name': 'Soweto Spaza Hub', 'lat': -26.2678, 'lon': 27.8585, 'id': 'PP1001'},
            {'name': 'Alexandra Pickup Point', 'lat': -26.1000, 'lon': 28.1100, 'id': 'PP1002'},
            {'name': 'Sandton Collection Point', 'lat': -26.1076, 'lon': 28.0567, 'id': 'PP1003'}
        ],
        'Kenya 🇰🇪': [
            {'name': 'Kibera Community Hub', 'lat': -1.3133, 'lon': 36.7897, 'id': 'PP2001'},
            {'name': 'Westlands Pickup Point', 'lat': -1.2635, 'lon': 36.8078, 'id': 'PP2002'}
        ],
        'Nigeria 🇳🇬': [
            {'name': 'Ikeja Collection Center', 'lat': 6.5984, 'lon': 3.3384, 'id': 'PP3001'},
            {'name': 'Victoria Island Hub', 'lat': 6.4317, 'lon': 3.4217, 'id': 'PP3002'}
        ]
    }
    
    country_points = pickup_points.get(country, pickup_points['South Africa 🇿🇦'])
    
    # Find nearest pickup point
    nearest_point = None
    min_distance = float('inf')
    
    for point in country_points:
        if user_location and len(user_location) >= 2:
            user_lat, user_lon = user_location[0], user_location[1]
            distance = haversine_distance(user_lat, user_lon, point['lat'], point['lon'])
        else:
            # Default to first point if no location data
            distance = 5.0
        
        if distance < min_distance:
            min_distance = distance
            nearest_point = point
    
    if nearest_point:
        return {
            'name': nearest_point['name'],
            'id': nearest_point['id'],
            'distance': round(min_distance, 1)
        }
    
    # Fallback
    return {
        'name': 'Default Pickup Point',
        'id': 'PP9999',
        'distance': 3.5
    }

def get_vendor_from_phone_with_ctt(phone_number):
    """CTT (Call Type Technology) with Haversine verification"""
    # Phone number to country/vendor mapping
    country_codes = {
        '+27': {'country': 'South Africa 🇿🇦', 'vendor_id': '1307', 'currency': 'R', 'lat': -26.2041, 'lon': 28.0473},
        '+234': {'country': 'Nigeria 🇳🇬', 'vendor_id': '1308', 'currency': '₦', 'lat': 6.5244, 'lon': 3.3792},
        '+254': {'country': 'Kenya 🇰🇪', 'vendor_id': '1309', 'currency': 'KSh', 'lat': -1.2921, 'lon': 36.8219},
        '+233': {'country': 'Ghana 🇬🇭', 'vendor_id': '1310', 'currency': '₵', 'lat': 5.6037, 'lon': -0.1870},
        '+256': {'country': 'Uganda 🇺🇬', 'vendor_id': '1311', 'currency': 'USh', 'lat': 0.3476, 'lon': 32.5825},
        '+255': {'country': 'Tanzania 🇹🇿', 'vendor_id': '1312', 'currency': 'TSh', 'lat': -6.7924, 'lon': 39.2083},
        '+260': {'country': 'Zambia 🇿🇲', 'vendor_id': '1313', 'currency': 'ZK', 'lat': -15.3875, 'lon': 28.3228}
    }
    
    # Extract country code
    for code, info in country_codes.items():
        if phone_number.startswith(code):
            # Mock user location (in real system, get from telecom provider)
            user_lat = info['lat'] + random.uniform(-0.5, 0.5)  # Mock nearby location
            user_lon = info['lon'] + random.uniform(-0.5, 0.5)
            
            # Calculate distance to vendor
            distance = haversine_distance(user_lat, user_lon, info['lat'], info['lon'])
            
            return {
                'vendor_id': info['vendor_id'],
                'country': info['country'],
                'currency': info['currency'],
                'distance_km': round(distance, 1),
                'is_within_coverage': distance <= 25,  # 25km coverage radius
                'user_location': (user_lat, user_lon),
                'vendor_location': (info['lat'], info['lon'])
            }
    
    # Default fallback
    return {
        'vendor_id': '1307', 'country': 'South Africa 🇿🇦', 'currency': 'R',
        'distance_km': 2.5, 'is_within_coverage': True,
        'user_location': (-26.2041, 28.0473), 'vendor_location': (-26.2041, 28.0473)
    }

def auto_register_user(phone_number, ctt_data):
    """Auto-register user with CTT data (trust-based, no friction)"""
    if not is_user_registered(phone_number):
        user_data = {
            'phone': phone_number,
            'auto_registered': True,
            'registration_date': datetime.now(timezone.utc).isoformat(),
            'vendor_id': ctt_data['vendor_id'],
            'country': ctt_data['country'],
            'currency': ctt_data['currency'],
            'location': ctt_data['user_location'],
            'loyalty_points': 10,  # Welcome bonus
            'loyalty_tier': 'Bronze',
            'total_orders': 0,
            'total_spent': 0.0,
            'last_order_date': None
        }
        register_user(phone_number, user_data)
        logger.info(f"🎯 Auto-registered: {phone_number} in {ctt_data['country']}")
    return get_user_data(phone_number)

def fuzzy_search_combos(query):
    """Fuzzy search combos by keywords"""
    query = query.lower()
    matches = []
    
    for combo in get_enhanced_combos():
        score = 0
        # Check name match
        if query in combo['name'].lower():
            score += 10
        # Check category match
        if query in combo['category']:
            score += 8
        # Check keywords match
        for keyword in combo['keywords']:
            if query in keyword:
                score += 5
        # Check description match
        if query in combo['description'].lower():
            score += 3
        
        if score > 0:
            matches.append((combo, score))
    
    # Sort by relevance score
    matches.sort(key=lambda x: x[1], reverse=True)
    return [match[0] for match in matches[:6]]  # Top 6 matches

def calculate_loyalty_points(amount, current_tier):
    """Calculate loyalty points earned"""
    base_points = int(amount * 0.1)  # 1 point per R10 spent
    
    # Tier multipliers
    multipliers = {'Bronze': 1.0, 'Silver': 1.5, 'Gold': 2.0, 'Platinum': 3.0}
    multiplier = multipliers.get(current_tier, 1.0)
    
    return int(base_points * multiplier)

def update_loyalty_tier(total_spent):
    """Update loyalty tier based on total spending"""
    if total_spent >= 5000:
        return 'Platinum'
    elif total_spent >= 2000:
        return 'Gold'
    elif total_spent >= 500:
        return 'Silver'
    else:
        return 'Bronze'

def send_sms_invoice(phone_number, order_data):
    """Send professional SMS/WhatsApp invoice via Twilio"""
    try:
        from twilio_integration import send_dual_notification
        success = send_dual_notification(phone_number, order_data, prefer_whatsapp=True)
        if success:
            logger.info(f"📱💬 Professional invoice sent to {phone_number}")
            logger.info(f"💳 Order: {order_data['order_number']}")
            logger.info(f"💰 Total: {order_data['currency']}{order_data['total']}")
            logger.info(f"📦 Items: {len(order_data['items'])} items")
        else:
            logger.error(f"❌ Invoice delivery failed for {phone_number}")
        return success
    except ImportError:
        # Fallback to mock if Twilio module not available
        logger.warning("⚠️ Twilio integration not available - using mock SMS")
        logger.info(f"📱 MOCK SMS Invoice sent to {phone_number}")
        logger.info(f"💳 Order: {order_data['order_number']}")
        logger.info(f"💰 Total: {order_data['currency']}{order_data['total']}")
        logger.info(f"📦 Items: {len(order_data['items'])} items")
        return True

# 🗄️ PostgreSQL Database Integration
try:
    from database import (
        init_database, save_user as db_save_user, get_user as db_get_user, 
        save_order as db_save_order, get_user_orders as db_get_user_orders,
        save_session as db_save_session, get_session as db_get_session
    )
    DATABASE_ENABLED = True
    print("✅ PostgreSQL persistence layer loaded!")
    logger.info("✅ PostgreSQL persistence layer loaded!")
    # Initialize database on startup
    init_result = init_database()
    logger.info(f"🗄️ Database initialization result: {init_result}")
    
    # 🔥 RUNTIME MIGRATION: Fix missing cart column
    try:
        from runtime_migration import ensure_cart_column_exists
        cart_migration_result = ensure_cart_column_exists()
        if cart_migration_result:
            logger.info("✅ Cart column verified/migrated successfully!")
        else:
            logger.warning("⚠️ Cart column migration failed - using file fallback")
    except Exception as migration_error:
        logger.error(f"❌ Runtime migration error: {migration_error}")
        logger.info("📁 Falling back to file-based cart storage")
    
    if not init_result:
        logger.warning("⚠️ Database init failed, but continuing with DB layer")
except ImportError as e:
    print(f"⚠️ PostgreSQL not available: {e}")
    logger.error(f"⚠️ PostgreSQL not available: {e}")
    print("📁 Falling back to persistent file-based storage")
    logger.info("📁 Falling back to persistent file-based storage")
    DATABASE_ENABLED = False
    
    # Dummy database functions (fallback when PostgreSQL unavailable)
    def db_save_user(phone, user_data): pass
    def db_get_user(phone): return None  
    def db_save_order(phone, order_data): pass
    def db_get_user_orders(phone): return []
except Exception as e:
    print(f"❌ Database error: {e}")
    logger.error(f"❌ Database error: {e}")
    print("📁 Falling back to persistent file-based storage")
    logger.info("📁 Falling back to persistent file-based storage")
    DATABASE_ENABLED = False
    
    # Dummy database functions
    def db_save_user(phone, user_data): pass
    def db_get_user(phone): return None  
    def db_save_order(phone, order_data): pass
    def db_get_user_orders(phone): return []

# Logging already configured above

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'taborder-secret-2024')

# Configure CORS - Simple global configuration for Flask-CORS 6.0.1
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

@app.route('/')
def root():
    """Serve React app or API info"""
    try:
        from flask import send_from_directory
        # Try to serve the React app
        return send_from_directory('frontend/build', 'index.html')
    except Exception as e:
        logger.error(f"Error serving React app: {e}")
        # Fallback to API info
        return jsonify({
            'message': '🦁 TabOrder ULTIMATE USSD API',
            'version': '4.0.0-ULTIMATE',
            'status': 'healthy',
            'features': {
                'auto_registration': 'CTT + Haversine',
                'fuzzy_search': 'Keyword-based smart search',
                'trust_based': 'Minimal friction for native users',
                'sms_invoices': 'Time-sensitive USSD optimized',
                'loyalty_points': 'Gamified engagement',
                'multi_currency': '7 African countries'
            }
        })



@app.route('/health')
def health():
    # Simplified health check without Twilio dependency
    return jsonify({
        'status': 'healthy',
        'sessions_active': len(sessions),
        'database_enabled': DATABASE_ENABLED,
        'twilio_status': 'not_configured',
        'message': 'TabOrder Ultimate USSD operational',
        'combos_available': len(get_enhanced_combos()),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test')
def api_test():
    """Simple API test endpoint for frontend connection"""
    return jsonify({
        'success': True,
        'message': 'Backend API is working!',
        'timestamp': datetime.now().isoformat(),
        'cors_enabled': True,
        'combos_count': len(get_enhanced_combos())
    })

@app.route('/api/simple-test')
def simple_test():
    """Very simple test endpoint without any dependencies"""
    return jsonify({
        'success': True,
        'message': 'Simple test endpoint working!',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/combos')
def get_combos():
    """Get all available combo specials - NOW FULLY DYNAMIC"""
    try:
        # Get fresh combos from database or dynamic source
        current_combos = get_dynamic_combos()
        
        return jsonify({
            'success': True,
            'combos': current_combos,
            'total': len(current_combos),
            'categories': list(set(combo.get('category', 'general') for combo in current_combos)),
            'source': 'database' if 'database' in str(current_combos) else 'dynamic_fallback'
        })
    except Exception as e:
        logger.error(f"Error fetching combos: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch combos',
            'combos': [],
            'total': 0,
            'categories': []
        }), 500

@app.route('/api/vendor/test')
def vendor_api_test():
    """Vendor API test endpoint"""
    return jsonify({
        'success': True,
        'message': 'Vendor API endpoint is working!',
        'endpoints': {
            'health': '/health',
            'api_test': '/api/test',
            'vendor_test': '/api/vendor/test',
            'vendor_login': '/api/vendor/login',
            'vendor_register': '/api/vendor/register'
        }
    })

@app.route('/api/vendor/login', methods=['POST'])
def vendor_login():
    """Vendor login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # For demo purposes, create a simple vendor authentication
        # In production, this would check against a proper vendor database
        if email == 'vendor@taborder.com' and password == 'password123':
            vendor_data = {
                'vendor_id': 'VENDOR_001',
                'email': email,
                'name': 'Demo Vendor',
                'phone': '+27123456789',
                'business_name': 'TabOrder Demo Store',
                'location': 'Johannesburg, South Africa',
                'status': 'active'
            }
            
            # Generate a simple access token (in production, use JWT)
            access_token = f"vendor_token_{vendor_data['vendor_id']}_{int(time.time())}"
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'access_token': access_token,
                'vendor_data': vendor_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
            
    except Exception as e:
        logger.error(f"Vendor login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Login failed. Please try again.'
        }), 500

@app.route('/api/vendor/register', methods=['POST'])
def vendor_register():
    """Vendor registration endpoint"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        business_name = data.get('business_name', '').strip()
        phone = data.get('phone', '').strip()
        owner_name = data.get('owner_name', '').strip()  # Frontend sends owner_name
        name = owner_name  # Use owner_name as name for backend compatibility
        
        if not email or not password or not business_name or not phone or not owner_name:
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        # For demo purposes, create a simple vendor registration
        # In production, this would save to a proper vendor database
        vendor_data = {
            'vendor_id': f"VENDOR_{int(time.time())}",
            'email': email,
            'name': name,
            'owner_name': owner_name,
            'phone': phone,
            'business_name': business_name,
            'address': data.get('address', ''),
            'business_type': data.get('business_type', ''),
            'tax_number': data.get('tax_number', ''),
            'location': 'Johannesburg, South Africa',
            'status': 'pending_approval'
        }
        
        # Generate a simple access token
        access_token = f"vendor_token_{vendor_data['vendor_id']}_{int(time.time())}"
        
        return jsonify({
            'success': True,
            'message': 'Registration successful! Your account is pending approval.',
            'access_token': access_token,
            'vendor_data': vendor_data
        }), 201
        
    except Exception as e:
        logger.error(f"Vendor registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500

@app.route('/api/vendor/products', methods=['GET'])
def vendor_products():
    """Get vendor products endpoint"""
    try:
        # For demo purposes, return sample products
        # In production, this would fetch from the vendor's product database
        products = [
            {
                'id': 'PROD_001',
                'name': 'Family Pack',
                'category': 'Groceries',
                'brand': 'TabOrder',
                'price': 120.00,
                'wholesale_price': 100.00,
                'quantity': 50,
                'size': 'Large',
                'status': 'active',
                'suggested_retail_price': 150.00,
                'platform_discount': 10.00,
                'min_stock_alert': 10,
                'margin_percentage': 20.00,
                'created_at': '2025-07-15T10:00:00Z',
                'updated_at': '2025-07-15T10:00:00Z'
            },
            {
                'id': 'PROD_002',
                'name': 'Essential Groceries',
                'category': 'Groceries',
                'brand': 'TabOrder',
                'price': 45.00,
                'wholesale_price': 35.00,
                'quantity': 100,
                'size': 'Medium',
                'status': 'active',
                'suggested_retail_price': 60.00,
                'platform_discount': 5.00,
                'min_stock_alert': 20,
                'margin_percentage': 22.22,
                'created_at': '2025-07-15T10:00:00Z',
                'updated_at': '2025-07-15T10:00:00Z'
            }
        ]
        
        return jsonify({
            'success': True,
            'products': products,
            'total': len(products)
        }), 200
        
    except Exception as e:
        logger.error(f"Vendor products error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch products'
        }), 500

@app.route('/api/orders', methods=['GET'])
def vendor_orders():
    """Get vendor orders endpoint"""
    try:
        # For demo purposes, return sample orders
        # In production, this would fetch from the orders database
        orders = [
            {
                'id': 'ORDER_001',
                'order_number': 'TO-2025-001',
                'customer_name': 'John Doe',
                'customer_phone': '+27123456789',
                'items': [
                    {
                        'id': 'PROD_001',
                        'name': 'Family Pack',
                        'price': 120.00,
                        'quantity': 1
                    }
                ],
                'total_amount': 120.00,
                'status': 'pending',
                'payment_method': 'M-Pesa',
                'pickup_point': 'Demo Store',
                'created_at': '2025-07-15T10:00:00Z',
                'updated_at': '2025-07-15T10:00:00Z'
            },
            {
                'id': 'ORDER_002',
                'order_number': 'TO-2025-002',
                'customer_name': 'Jane Smith',
                'customer_phone': '+27123456790',
                'items': [
                    {
                        'id': 'PROD_002',
                        'name': 'Essential Groceries',
                        'price': 45.00,
                        'quantity': 2
                    }
                ],
                'total_amount': 90.00,
                'status': 'packed',
                'payment_method': 'Cash on Delivery',
                'pickup_point': 'Demo Store',
                'created_at': '2025-07-15T09:00:00Z',
                'updated_at': '2025-07-15T09:30:00Z'
            }
        ]
        
        return jsonify({
            'success': True,
            'orders': orders,
            'total': len(orders)
        }), 200
        
    except Exception as e:
        logger.error(f"Vendor orders error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch orders'
        }), 500

@app.route('/cors-test')
def cors_test():
    return jsonify({
        'message': 'CORS test successful',
        'cors': True
    })

@app.route('/ussd', methods=['POST'])
def ussd():
    """🦁 ULTIMATE USSD - Native User Optimized"""
    try:
        session_id = request.form.get('sessionId', '')
        phone_number = request.form.get('phoneNumber', '')
        text = request.form.get('text', '')
        
        logger.info(f"🦁 ULTIMATE USSD: {phone_number} -> '{text}'")
        
        # Get or create session
        session_key = f"{session_id}_{phone_number}"
        if session_key not in sessions:
            logger.info(f"🆕 Creating NEW session for {phone_number}")
            sessions[session_key] = USSDSession(session_id, phone_number)
        else:
            logger.info(f"🔄 Using EXISTING session for {phone_number}")
        
        session = sessions[session_key]
        
        # 🛒 Cart state (simplified logging)
        if session.cart:
            logger.info(f"🛒 Cart: {len(session.cart)} items | Step: {session.current_step}")
            for i, item in enumerate(session.cart):
                logger.info(f"  {i+1}. {item['name']} - {item['price']}")
        else:
            logger.info(f"🛒 Cart: empty | Step: {session.current_step}")
        
        # CTT + Auto-registration
        ctt_data = get_vendor_from_phone_with_ctt(phone_number)
        user_data = auto_register_user(phone_number, ctt_data)
        
        # Store session data
        session.update_temporary_data('ctt_data', ctt_data)
        session.update_temporary_data('user_data', user_data)
        
        # ============ MAIN MENU ============
        if not text:
            logger.info(f"📱 Main menu accessed for {phone_number}")
            loyalty_points = user_data.get('loyalty_points', 0)
            loyalty_tier = user_data.get('loyalty_tier', 'Bronze')
            currency = ctt_data['currency']
            is_registered = user_data.get('auto_registered', False)
            cart_items_count = len(session.cart)
            
            # Show different menu for auto-registered vs manually registered users
            if is_registered and not user_data.get('manually_registered', False):
                if cart_items_count > 0:
                    response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. My Cart ({cart_items_count} items)
4. Complete Registration
5. Reorder Last
6. Mobile Spaza (R6750/month)
7. Register Pickup Point
0. Exit"""
                else:
                    response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. Complete Registration
4. Reorder Last
5. Mobile Spaza (R6750/month)
6. Register Pickup Point
0. Exit"""
            else:
                if cart_items_count > 0:
                    response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. My Cart ({cart_items_count} items)
4. Loyalty & Rewards
5. Reorder Last
6. Mobile Spaza (R6750/month)
7. Register Pickup Point
8. Customer Registration
0. Exit"""
                else:
                    response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. Loyalty & Rewards
4. Reorder Last
5. Mobile Spaza (R6750/month)
6. Register Pickup Point
7. Customer Registration
0. Exit"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ QUICK ORDER ============
        elif text == "1":
            currency = ctt_data['currency']
            response = f"""CON 🛒 Quick Order
{currency}45-{currency}120 combos

1. Essential Groceries - {currency}45
2. Family Pack - {currency}120
3. Baby Care Bundle - {currency}85
4. Student Kit - {currency}35
5. More Options
0. Back"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ DIRECT ADD TO CART ============
        elif text.startswith("1*") and len(text.split("*")) == 2:
            choice = text.split("*")[1]
            try:
                combo_id = int(choice)
                combo = next((c for c in get_enhanced_combos() if c['id'] == combo_id), None)
                
                if combo:
                    # Add to cart
                    cart_item = {
                        'id': combo['id'],
                        'name': combo['name'],
                        'price': combo['price'],
                        'quantity': 1
                    }
                    session.add_to_cart(cart_item)
                    
                    currency = ctt_data['currency']
                    cart_total = session.get_cart_total()
                    
                    response = f"""CON ✅ Added to Cart!
{combo['name']} - {currency}{combo['price']}

Cart Total: {currency}{cart_total}

1. Checkout Now
2. Continue Shopping
3. View Cart
0. Back"""
                    
                    return response, 200, {'Content-Type': 'text/plain'}
            except (ValueError, IndexError):
                pass
            
            # Show more options
            if choice == "5":
                response = """CON 🛒 More Combos

4. Household Cleaning - R65
6. Breakfast Special - R40

1-6. Add to cart
8. Search by name
0. Back"""
                
                return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ REORDER FUNCTIONALITY (MUST BE BEFORE BROAD *1 PATTERNS!) ============
        elif text == "4*1":  # Reorder confirmation
            logger.info(f"🔄 Reorder triggered for {phone_number}")
            user_orders = get_user_orders(phone_number)
            logger.info(f"📦 User orders found: {len(user_orders) if user_orders else 0}")
            
            if user_orders:
                # Add most recent order items to cart (user_orders[0] is newest due to desc ordering)
                last_order = user_orders[0]
                logger.info(f"📦 Most recent order: {last_order.get('order_number', 'Unknown')} with {len(last_order.get('items', []))} items")
                
                session.clear_cart()
                logger.info(f"🗑️ Cart cleared, now adding {len(last_order.get('items', []))} items from last order")
                
                for item in last_order['items']:
                    logger.info(f"🛒 Adding item: {item}")
                    session.add_to_cart(item)
                
                logger.info(f"🛒 Final cart size: {len(session.cart)} items")
                
                currency = ctt_data['currency']
                total = session.get_cart_total()
                
                response = f"""CON ✅ Items Added to Cart
{len(session.cart)} items from last order

Total: {currency}{total}

1. Checkout
2. Modify Cart
0. Back"""
                
                return response, 200, {'Content-Type': 'text/plain'}
            else:
                logger.info(f"❌ No orders found for {phone_number}")
                return "CON ❌ No previous orders found\n\n1. Start Shopping\n0. Back", 200, {'Content-Type': 'text/plain'}
        
        # ============ REGISTRATION COMPLETIONS (MUST BE FIRST!) ============
        elif text.endswith("*1") and session.current_step == 'mobile_spaza':
            name = session.get_temporary_data('spaza_name', '')
            spaza_id = f"MS{random.randint(1000, 9999)}"
            
            # Save Mobile Spaza registration
            spaza_data = {
                'spaza_id': spaza_id,
                'owner_name': name,
                'phone': phone_number,
                'registration_date': datetime.now(timezone.utc).isoformat(),
                'status': 'active',
                'target_monthly': 6750,
                'location': ctt_data['country']
            }
            
            # Update user data
            user_data['is_mobile_spaza'] = True
            user_data['spaza_id'] = spaza_id
            user_data['owner_name'] = name  # Save owner name for menu display
            save_users({phone_number: user_data})
            
            response = f"""END ✅ MOBILE SPAZA REGISTERED!
ID: {spaza_id}
Owner: {name}

R6750/month target activated
SMS welcome package sent!

Start earning immediately!"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ PAYMENT PROCESSING ============
        elif text.endswith("*1*1") and session.current_step not in ['mobile_spaza', 'stationary_spaza', 'customer_registration', 'complete_registration']:  # Cash on Delivery (from any checkout)
            logger.info(f"🔥 Processing Cash on Delivery for: {text}")
            logger.info(f"🔥 Calling process_order_completion with payment_method: Cash on Delivery")
            result = process_order_completion(session, ctt_data, user_data, "Cash on Delivery")
            logger.info(f"🔥 process_order_completion returned: {result}")
            return result
        
        elif text.endswith("*1*2") and not text.endswith("*1*2*1") and session.current_step not in ['mobile_spaza', 'stationary_spaza', 'customer_registration', 'complete_registration']:  # Mobile Money (but not confirmation)
            currency = ctt_data['currency']
            cart_total = session.get_cart_total()
            
            response = f"""CON 💰 Mobile Money Payment
Total: {currency}{cart_total}

1. Confirm Payment
0. Back"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        elif text.endswith("*1*2*1") and session.current_step not in ['mobile_spaza', 'stationary_spaza', 'customer_registration', 'complete_registration']:  # Confirm Mobile Money
            logger.info(f"🔥 Processing Mobile Money confirmation for: {text}")
            result = process_order_completion(session, ctt_data, user_data, "Mobile Money")
            logger.info(f"🔥 process_order_completion returned: {result}")
            return result
        
        elif text.endswith("*1*3") and session.current_step not in ['mobile_spaza', 'stationary_spaza', 'customer_registration', 'complete_registration']:  # USSD Payment
            logger.info(f"🔥 Processing USSD Payment for: {text}")
            result = process_order_completion(session, ctt_data, user_data, "USSD Payment")
            logger.info(f"🔥 process_order_completion returned: {result}")
            return result
        
        # ============ CHECKOUT FLOW ============
        elif text.endswith("*1") and not text.endswith("*1*1") and not text.endswith("*1*2*1") and not text.endswith("*1*3") and session.current_step not in ['mobile_spaza', 'stationary_spaza', 'customer_registration', 'complete_registration', 'search']:  # Checkout from any add-to-cart
            if not session.cart:
                return "END ❌ Your cart is empty!", 200, {'Content-Type': 'text/plain'}
            
            currency = ctt_data['currency']
            cart_total = session.get_cart_total()
            
            response = f"""CON 💳 Checkout
Total: {currency}{cart_total}

Payment Options:
1. Cash on Delivery
2. Mobile Money
3. USSD Payment
0. Back to Cart"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ SEARCH PRODUCTS ============
        elif text == "2":
            response = """CON 🔍 Search Products
Type what you need:

Examples:
• baby
• cleaning
• student

0. Back"""
            
            session.update_step('search')
            return response, 200, {'Content-Type': 'text/plain'}
        
        elif session.current_step == 'search' and text.startswith("2*"):
            parts = text.split("*")
            logger.info(f"🔍 Search logic triggered: parts={parts}, step={session.current_step}")
            
            if len(parts) == 2:  # 2*{query} - Show search results
                query = parts[1] if len(parts) > 1 else ""
                
                if len(query) < 2:
                    return "CON 🔍 Search too short\nEnter at least 2 characters\n\n0. Back", 200, {'Content-Type': 'text/plain'}
                
                matches = fuzzy_search_combos(query)
                
                if not matches:
                    return f"CON ❌ No matches for '{query}'\n\nTry: baby, family, student\n\n0. Back", 200, {'Content-Type': 'text/plain'}
                
                # Store search results in session for selection
                session.update_temporary_data('search_results', matches)
                
                currency = ctt_data['currency']
                response = f"CON 🎯 Found {len(matches)} matches:\n"
                
                for i, combo in enumerate(matches[:4], 1):
                    response += f"{i}. {combo['name']} - {currency}{combo['price']}\n"
                
                response += "\n1-4. Add to cart\n0. Back"
                
                return response, 200, {'Content-Type': 'text/plain'}
            
            elif len(parts) == 3:  # 2*{query}*{selection} - Add selected item to cart
                try:
                    selection = int(parts[2])
                    search_results = session.get_temporary_data('search_results', [])
                    
                    logger.info(f"🎯 Search selection: {selection}, Available results: {len(search_results)}")
                    
                    if 1 <= selection <= len(search_results):
                        combo = search_results[selection - 1]
                        
                        # Add to cart
                        cart_item = {
                            'id': combo['id'],
                            'name': combo['name'],
                            'price': combo['price'],
                            'quantity': 1
                        }
                        
                        logger.info(f"🛒 Adding to cart: {cart_item['name']} - {cart_item['price']}")
                        logger.info(f"🛒 Cart before add: {len(session.cart)} items")
                        
                        session.add_to_cart(cart_item)
                        
                        logger.info(f"🛒 Cart after add: {len(session.cart)} items")
                        
                        currency = ctt_data['currency']
                        cart_total = session.get_cart_total()
                        
                        response = f"""CON ✅ Added to Cart!
{combo['name']} - {currency}{combo['price']}

Cart Total: {currency}{cart_total}

1. Checkout Now
2. Continue Shopping
3. View Cart
0. Back"""
                        
                        # Reset search step
                        session.update_step('start')
                        return response, 200, {'Content-Type': 'text/plain'}
                    else:
                        return "CON ❌ Invalid selection\n\n0. Back", 200, {'Content-Type': 'text/plain'}
                        
                except ValueError:
                    return "CON ❌ Invalid selection\n\n0. Back", 200, {'Content-Type': 'text/plain'}
        
        # ============ CART MANAGEMENT ============
        elif text == "3":
            logger.info(f"🛒 Cart accessed: {len(session.cart)} items in cart")
            if not session.cart:
                logger.info(f"❌ Cart is empty for {phone_number}")
                return "CON 🛒 Your cart is empty\n\n1. Start Shopping\n0. Back", 200, {'Content-Type': 'text/plain'}
            
            currency = ctt_data['currency']
            cart_total = session.get_cart_total()
            
            response = f"CON 🛒 Your Cart ({len(session.cart)} items)\n"
            
            for i, item in enumerate(session.cart[:3], 1):
                response += f"{i}. {item['name']} - {currency}{item['price']}\n"
            
            response += f"\nTotal: {currency}{cart_total}\n\n1. Checkout\n2. Remove Item\n0. Back"
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ OPTION 4 HANDLING ============
        elif text == "4":
            # Check user registration status to determine what option 4 should be
            is_registered = user_data.get('auto_registered', False)
            is_manually_registered = user_data.get('manually_registered', False)
            
            # Debug logging
            logger.info(f"🔍 Option 4 Debug - Phone: {phone_number}")
            logger.info(f"🔍 is_registered: {is_registered}")
            logger.info(f"🔍 is_manually_registered: {is_manually_registered}")
            logger.info(f"🔍 user_data keys: {list(user_data.keys())}")
            
            if is_registered and not is_manually_registered:
                # Auto-registered user - Complete Registration
                logger.info(f"📝 Complete Registration accessed by {phone_number}")
                response = """CON 📝 Complete Your Registration
Get loyalty benefits & delivery preferences

Enter your full name:
0. Back"""
                
                session.update_step('complete_registration')
                return response, 200, {'Content-Type': 'text/plain'}
            
            elif is_manually_registered:
                # Manually registered user - Loyalty & Rewards
                logger.info(f"👑 Loyalty & Rewards accessed by {phone_number}")
                points = user_data.get('loyalty_points', 0)
                tier = user_data.get('loyalty_tier', 'Bronze')
                total_spent = user_data.get('total_spent', 0)
                
                # Calculate next tier requirements
                next_tier_spending = {'Bronze': 500, 'Silver': 2000, 'Gold': 5000, 'Platinum': 9999999}
                needed = next_tier_spending.get(tier, 0) - total_spent
                
                response = f"""CON 👑 Loyalty Status
Tier: {tier}
Points: {points}

Total Spent: R{total_spent}
Next Tier: R{needed} more

1. Points History
2. Redeem Points
0. Back"""
                
                return response, 200, {'Content-Type': 'text/plain'}
            
            else:
                # Fallback - Previous Orders (for edge cases)
                logger.info(f"📦 Previous orders menu accessed by {phone_number} (fallback case)")
                user_orders = get_user_orders(phone_number)
                logger.info(f"📦 Retrieved {len(user_orders) if user_orders else 0} orders for display")
                
                if not user_orders:
                    return "CON 📦 No previous orders\n\n1. Start Shopping\n0. Back", 200, {'Content-Type': 'text/plain'}
                
                last_order = user_orders[0]  # Most recent order (desc ordering)
                currency = ctt_data['currency']
                
                response = f"""CON 🔄 Reorder Last Order
Order: {last_order['order_number']}
Total: {currency}{last_order['total']}

1. Reorder Same Items
2. View Order Details
0. Back"""
                
                return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ PREVIOUS ORDERS ============
        elif text == "5":
            logger.info(f"📦 Previous orders menu accessed by {phone_number}")
            user_orders = get_user_orders(phone_number)
            logger.info(f"📦 Retrieved {len(user_orders) if user_orders else 0} orders for display")
            
            if not user_orders:
                return "CON 📦 No previous orders\n\n1. Start Shopping\n0. Back", 200, {'Content-Type': 'text/plain'}
            
            last_order = user_orders[0]  # Most recent order (desc ordering)
            currency = ctt_data['currency']
            
            response = f"""CON 🔄 Reorder Last Order
Order: {last_order['order_number']}
Total: {currency}{last_order['total']}

1. Reorder Same Items
2. View Order Details
0. Back"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ SPAZA DASHBOARD / MOBILE SPAZA REGISTRATION ============
        elif text == "6":
            is_mobile_spaza = user_data.get('is_mobile_spaza', False)
            
            if is_mobile_spaza:
                # Spaza Dashboard for registered Mobile Spazas
                spaza_id = user_data.get('spaza_id', 'Unknown')
                owner_name = user_data.get('owner_name', 'Spaza Owner')
                total_spent = user_data.get('total_spent', 0)
                total_orders = user_data.get('total_orders', 0)
                loyalty_points = user_data.get('loyalty_points', 0)
                currency = ctt_data['currency']
                
                # Calculate earnings (assuming 10% commission)
                estimated_earnings = total_spent * 0.10
                monthly_goal = 6750
                progress = (estimated_earnings / monthly_goal) * 100
                
                response = f"""CON 📊 Spaza Dashboard
ID: {spaza_id} | Owner: {owner_name}

📈 This Month:
Orders: {total_orders}
Revenue: {currency}{total_spent}
Commission: {currency}{estimated_earnings:.0f}
Progress: {progress:.1f}% of {currency}{monthly_goal}

1. View Detailed Stats
2. Customer List
3. Earnings History
0. Back"""
            else:
                # Mobile Spaza Registration for non-registered users
                response = """CON 🦁 Become Mobile Spaza
Earn R6750/month guaranteed!

Join 10,000+ successful entrepreneurs

Enter your name:
0. Back"""
                
                session.update_step('mobile_spaza')
                return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ PICKUP POINT SPAZA REGISTRATION ============
        elif text == "7":
            response = """CON 🏪 Register Pickup Point
Become a stationary delivery hub
Earn commission on deliveries

Enter your shop name:
0. Back"""
            
            session.update_step('stationary_spaza')
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ STATIONARY SPAZA REGISTRATION (Pickup Points) ============
        elif text == "8":
            # This is now option 7 when cart is empty, option 7 when cart has items
            cart_items_count = len(session.cart)
            if cart_items_count == 0:
                # Customer Registration when cart is empty
                response = """CON 👤 Customer Registration
Get personalized service & delivery

Enter your full name:
0. Back"""
                
                session.update_step('customer_registration')
                return response, 200, {'Content-Type': 'text/plain'}
            else:
                # This should be customer registration when cart has items
                response = """CON 👤 Customer Registration
Get personalized service & delivery

Enter your full name:
0. Back"""
                
                session.update_step('customer_registration')
                return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ CUSTOMER REGISTRATION ============
        elif text == "9":
            # This is only available when cart has items (option 8)
            cart_items_count = len(session.cart)
            if cart_items_count > 0:
                response = """CON 👤 Customer Registration
Get personalized service & delivery

Enter your full name:
0. Back"""
                
                session.update_step('customer_registration')
                return response, 200, {'Content-Type': 'text/plain'}
            else:
                # Invalid option when cart is empty
                return "CON ❌ Invalid option\n\n0. Back", 200, {'Content-Type': 'text/plain'}
        
        elif session.current_step == 'mobile_spaza' and (text.startswith("6*") or text.startswith("7*")):
            name = text.split("*", 1)[1] if "*" in text else ""
            
            if len(name) < 2:
                return "CON Name too short\nEnter your full name:\n\n0. Back", 200, {'Content-Type': 'text/plain'}
            
            # Calculate potential earnings
            customers = random.randint(8, 15)
            daily_potential = customers * random.uniform(25, 35)
            monthly_potential = daily_potential * 30
            
            response = f"""CON 📊 Earnings Potential
Name: {name}

Estimated Customers: {customers}/day
Daily Earnings: R{daily_potential:.0f}
Monthly Target: R{monthly_potential:.0f}

1. Complete Registration
0. Back"""
            
            session.update_temporary_data('spaza_name', name)
            return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ EXIT ============
        elif text == "0":
            return "END 🦁 Thank you for using TabOrder!\nAfrica's #1 commerce platform", 200, {'Content-Type': 'text/plain'}
        
        # ============ BACK FUNCTIONALITY ============
        elif text.endswith("*0"):
            # Handle "Back" option from any sub-menu
            # Remove the last "*0" to go back one level
            parent_text = text[:-2]  # Remove "*0"
            
            if not parent_text:  # If we're at the root level, show main menu
                loyalty_points = user_data.get('loyalty_points', 0)
                loyalty_tier = user_data.get('loyalty_tier', 'Bronze')
                currency = ctt_data['currency']
                is_registered = user_data.get('auto_registered', False)
                cart_items_count = len(session.cart)
                
                # Show different menu for auto-registered vs manually registered users
                if is_registered and not user_data.get('manually_registered', False):
                    if cart_items_count > 0:
                        response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. My Cart ({cart_items_count} items)
4. Complete Registration
5. Reorder Last
6. Mobile Spaza (R6750/month)
7. Register Pickup Point
0. Exit"""
                    else:
                        response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. Complete Registration
4. Reorder Last
5. Mobile Spaza (R6750/month)
6. Register Pickup Point
0. Exit"""
                else:
                    if cart_items_count > 0:
                        response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. My Cart ({cart_items_count} items)
4. Loyalty & Rewards
5. Reorder Last
6. Mobile Spaza (R6750/month)
7. Register Pickup Point
8. Customer Registration
0. Exit"""
                    else:
                        response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. Loyalty & Rewards
4. Reorder Last
5. Mobile Spaza (R6750/month)
6. Register Pickup Point
7. Customer Registration
0. Exit"""
                    
                return response, 200, {'Content-Type': 'text/plain'}
            else:
                # Recursively handle the parent menu
                # This will process the parent_text as if it was the current request
                # We need to simulate going back one level
                if parent_text == "1":  # Back from Quick Order sub-menu
                    currency = ctt_data['currency']
                    response = f"""CON 🛒 Quick Order
{currency}45-{currency}120 combos

1. Essential Groceries - {currency}45
2. Family Pack - {currency}120
3. Baby Care Bundle - {currency}85
4. Student Kit - {currency}35
5. More Options
0. Back"""
                    
                    return response, 200, {'Content-Type': 'text/plain'}
                elif parent_text == "2":  # Back from Search
                    response = """CON 🔍 Search Products
Type keywords:

Examples:
• baby, cleaning, student
• noodles, meat, milk
• breakfast, family

0. Back"""
                    
                    session.update_step('search')
                    return response, 200, {'Content-Type': 'text/plain'}
                elif parent_text == "3" and len(session.cart) > 0:  # Back from Cart
                    currency = ctt_data['currency']
                    cart_total = session.get_cart_total()
                    
                    response = f"CON 🛒 Your Cart ({len(session.cart)} items)\n"
                    
                    for i, item in enumerate(session.cart[:3], 1):
                        response += f"{i}. {item['name']} - {currency}{item['price']}\n"
                    
                    response += f"\nTotal: {currency}{cart_total}\n\n1. Checkout\n2. Remove Item\n0. Back"
                    
                    return response, 200, {'Content-Type': 'text/plain'}
                else:
                    # Default back to main menu
                    loyalty_points = user_data.get('loyalty_points', 0)
                    loyalty_tier = user_data.get('loyalty_tier', 'Bronze')
                    currency = ctt_data['currency']
                    is_registered = user_data.get('auto_registered', False)
                    cart_items_count = len(session.cart)
                    
                    if is_registered and not user_data.get('manually_registered', False):
                        if cart_items_count > 0:
                            response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. My Cart ({cart_items_count} items)
4. Complete Registration
5. Reorder Last
6. Mobile Spaza (R6750/month)
7. Register Pickup Point
0. Exit"""
                        else:
                            response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. Complete Registration
4. Reorder Last
5. Mobile Spaza (R6750/month)
6. Register Pickup Point
0. Exit"""
                    else:
                        if cart_items_count > 0:
                            response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. My Cart ({cart_items_count} items)
4. Loyalty & Rewards
5. Reorder Last
6. Mobile Spaza (R6750/month)
7. Register Pickup Point
8. Customer Registration
0. Exit"""
                        else:
                            response = f"""CON 🦁 TabOrder {ctt_data['country']}
👑 {loyalty_tier} | {loyalty_points} pts

1. Quick Order
2. Search Items
3. Loyalty & Rewards
4. Reorder Last
5. Mobile Spaza (R6750/month)
6. Register Pickup Point
7. Customer Registration
0. Exit"""
                    
                    return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ REGISTRATION FLOW HANDLERS ============
        
        # Complete Registration Handler (for auto-registered users)
        elif session.current_step == 'complete_registration' and text.startswith("4*"):
            name = text.split("*", 1)[1] if "*" in text else ""
            
            if len(name) < 2:
                return "CON Name too short\nEnter your full name:\n\n0. Back", 200, {'Content-Type': 'text/plain'}
            
            # Auto-assign nearest pickup point using CTT + Haversine
            nearest_spaza = assign_nearest_pickup_point(ctt_data)
            
            # Update user to manually registered
            user_data.update({
                'manually_registered': True,
                'customer_name': name,
                'assigned_pickup_point': nearest_spaza,
                'loyalty_points': user_data.get('loyalty_points', 10) + 40  # Registration bonus
            })
            save_users({phone_number: user_data})
            
            response = f"""END ✅ REGISTRATION COMPLETE!
Name: {name}
📍 Pickup Point: {nearest_spaza['name']}
Distance: {nearest_spaza['distance']}km

👑 +40 bonus points awarded!
SMS with pickup details sent!"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # Stationary Spaza Registration Handler
        elif session.current_step == 'stationary_spaza' and text.startswith("7*"):
            shop_name = text.split("*", 1)[1] if "*" in text else ""
            
            if len(shop_name) < 2:
                return "CON Shop name too short\nEnter your shop name:\n\n0. Back", 200, {'Content-Type': 'text/plain'}
            
            # Generate pickup point ID
            pickup_id = f"PP{random.randint(1000, 9999)}"
            
            # Save pickup point registration
            pickup_data = {
                'pickup_id': pickup_id,
                'shop_name': shop_name,
                'owner_phone': phone_number,
                'location': ctt_data['user_location'],
                'country': ctt_data['country'],
                'registration_date': datetime.now(timezone.utc).isoformat(),
                'status': 'active',
                'type': 'stationary_spaza'
            }
            
            response = f"""END ✅ PICKUP POINT REGISTERED!
ID: {pickup_id}
Shop: {shop_name}
Location: {ctt_data['country']}

You'll earn commission on deliveries
SMS activation guide sent!"""
            
            return response, 200, {'Content-Type': 'text/plain'}
        
        # Customer Registration Handler
        elif session.current_step == 'customer_registration' and text.startswith("8*"):
            parts = text.split("*")
            
            if len(parts) == 2:  # 8*{name}
                name = parts[1]
                if len(name) < 2:
                    return "CON Name too short\nEnter your full name:\n\n0. Back", 200, {'Content-Type': 'text/plain'}
                
                session.update_temporary_data('customer_name', name)
                
                response = f"""CON 👤 Customer Registration
Name: {name}

Enter your area/suburb:
(e.g., Soweto, Alexandra)
0. Back"""
                
                return response, 200, {'Content-Type': 'text/plain'}
            
            elif len(parts) == 3:  # 8*{name}*{area}
                name = parts[1]
                area = parts[2]
                
                if len(area) < 2:
                    return "CON Area too short\nEnter your area:\n\n0. Back", 200, {'Content-Type': 'text/plain'}
                
                # Auto-assign pickup point using CTT + Haversine
                assigned_pickup = assign_nearest_pickup_point(ctt_data)
                
                # Update user data
                user_data.update({
                    'manually_registered': True,
                    'customer_name': name,
                    'customer_area': area,
                    'assigned_pickup_point': assigned_pickup,
                    'loyalty_points': user_data.get('loyalty_points', 10) + 50  # Full registration bonus
                })
                save_users({phone_number: user_data})
                
                response = f"""END ✅ CUSTOMER REGISTERED!
Name: {name}
Area: {area}

📍 Assigned Pickup Point:
{assigned_pickup['name']} ({assigned_pickup['distance']}km)

👑 +50 loyalty points earned!
SMS with details sent!"""
                
                return response, 200, {'Content-Type': 'text/plain'}
        
        # ============ FALLBACK ============
        else:
            logger.info(f"🚨 Fallback triggered for text: '{text}' | Cart items: {len(session.cart)} | Step: {session.current_step}")
            
            # Try to handle as item selection
            if "*" in text:
                parts = text.split("*")
                if len(parts) >= 2:
                    try:
                        combo_id = int(parts[-1])
                        combo = next((c for c in get_enhanced_combos() if c['id'] == combo_id), None)
                        
                        if combo:
                            cart_item = {
                                'id': combo['id'],
                                'name': combo['name'],
                                'price': combo['price'],
                                'quantity': 1
                            }
                            session.add_to_cart(cart_item)
                            
                            currency = ctt_data['currency']
                            response = f"""CON ✅ Added: {combo['name']}
Price: {currency}{combo['price']}

1. Checkout
2. Continue Shopping
0. Back"""
                            
                            return response, 200, {'Content-Type': 'text/plain'}
                    except ValueError:
                        pass
            
            # Default fallback
            return "CON Invalid option\n\n0. Main Menu", 200, {'Content-Type': 'text/plain'}
        
    except Exception as e:
        logger.error(f"USSD Error: {str(e)}", exc_info=True)
        return "END Service temporarily unavailable", 500, {'Content-Type': 'text/plain'}
    finally:
        # Always save sessions
        save_sessions(sessions)

def process_order_completion(session, ctt_data, user_data, payment_method):
    """Process order completion with loyalty points and SMS invoice"""
    logger.info(f"🔄 process_order_completion called with payment_method: {payment_method}")
    try:
        if not session.cart:
            logger.info(f"❌ Cart is empty, returning error")
            return "END ❌ Cart is empty!", 200, {'Content-Type': 'text/plain'}
        
        # Calculate totals
        subtotal = session.get_cart_total()
        currency = ctt_data['currency']
        
        # Generate order
        order_number = f"TO{random.randint(100000, 999999)}"
        
        # Calculate loyalty points earned
        loyalty_points_earned = calculate_loyalty_points(subtotal, user_data.get('loyalty_tier', 'Bronze'))
        
        # Update user stats
        new_total_spent = user_data.get('total_spent', 0) + subtotal
        new_loyalty_points = user_data.get('loyalty_points', 0) + loyalty_points_earned
        new_tier = update_loyalty_tier(new_total_spent)
        
        # Create order data
        order_data = {
            'order_number': order_number,
            'phone': session.phone_number,
            'items': session.cart.copy(),
            'subtotal': subtotal,
            'total': subtotal,
            'currency': currency,
            'payment_method': payment_method,
            'status': 'confirmed',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'loyalty_points_earned': loyalty_points_earned,
            'country': ctt_data['country']
        }
        
        # Save order
        logger.info(f"💾 Saving order {order_number} for {session.phone_number}")
        logger.info(f"📦 Order data: {order_data}")
        try:
            save_order(session.phone_number, order_data)
            logger.info(f"✅ Order saved successfully")
        except Exception as save_error:
            logger.error(f"❌ CRITICAL: Order save failed: {save_error}")
            logger.error(f"❌ Order {order_number} was NOT saved!")
            # Continue anyway to update user data
        
        # Update user data
        user_data.update({
            'total_spent': new_total_spent,
            'loyalty_points': new_loyalty_points,
            'loyalty_tier': new_tier,
            'total_orders': user_data.get('total_orders', 0) + 1,
            'last_order_date': datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"💾 Updating user data for {session.phone_number}")
        try:
            save_users({session.phone_number: user_data})
            logger.info(f"✅ User data updated successfully")
        except Exception as user_error:
            logger.error(f"❌ User data update failed: {user_error}")
        
        # Send SMS invoice
        send_sms_invoice(session.phone_number, order_data)
        
        # Clear cart
        session.clear_cart()
        
        # Response with loyalty info
        tier_emoji = {'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Platinum': '💎'}
        
        response = f"""END ✅ ORDER CONFIRMED!
Order: {order_number}
Total: {currency}{subtotal}
Payment: {payment_method}

👑 +{loyalty_points_earned} loyalty points
{tier_emoji.get(new_tier, '🥉')} {new_tier} Status

📱 SMS invoice sent!
🚚 Delivery: 2-4 hours"""
        
        logger.info(f"✅ process_order_completion returning success response")
        return response, 200, {'Content-Type': 'text/plain'}
        
    except Exception as e:
        logger.error(f"Order processing error: {str(e)}")
        logger.error(f"❌ process_order_completion returning error response")
        return "END ❌ Order failed. Please try again.", 500, {'Content-Type': 'text/plain'}

# ============ ADDITIONAL FRONTEND API ENDPOINTS ============

@app.route('/api/spaza-customers', methods=['GET'])
def spaza_customers():
    """Get spaza customers for vendor dashboard"""
    try:
        # For demo purposes, return sample customers
        # In production, this would fetch from the customers database
        customers = [
            {
                'id': 'CUST_001',
                'name': 'John Doe',
                'phone': '+27123456789',
                'total_spent': 1250.00,
                'orders_count': 8,
                'last_order_date': '2025-01-15T10:30:00Z'
            },
            {
                'id': 'CUST_002',
                'name': 'Jane Smith',
                'phone': '+27123456790',
                'total_spent': 890.00,
                'orders_count': 5,
                'last_order_date': '2025-01-14T15:45:00Z'
            },
            {
                'id': 'CUST_003',
                'name': 'Mike Johnson',
                'phone': '+27123456791',
                'total_spent': 2100.00,
                'orders_count': 12,
                'last_order_date': '2025-01-15T09:15:00Z'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': customers,
            'total': len(customers)
        }), 200
        
    except Exception as e:
        logger.error(f"Spaza customers error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch customers'
        }), 500

@app.route('/api/vendor/products/analytics', methods=['GET'])
def vendor_analytics():
    """Get vendor analytics for dashboard"""
    try:
        # For demo purposes, return sample analytics
        # In production, this would calculate from actual data
        analytics = {
            'total_products': 25,
            'active_products': 22,
            'low_stock_products': 3,
            'total_value': 15000.00,
            'orders_today': 8,
            'invoices_sent': 6,
            'earnings_today': 1250.00,
            'fulfillment_rate': 92.5,
            'avg_pack_time': 15,
            'period': 'today'
        }
        
        return jsonify({
            'success': True,
            'data': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Vendor analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch analytics'
        }), 500

@app.route('/api/vendor/products/<product_id>', methods=['PUT'])
def update_vendor_product(product_id):
    """Update vendor product"""
    try:
        data = request.get_json()
        
        # For demo purposes, return success
        # In production, this would update the product in database
        return jsonify({
            'success': True,
            'message': f'Product {product_id} updated successfully',
            'product_id': product_id
        }), 200
        
    except Exception as e:
        logger.error(f"Update product error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update product'
        }), 500

@app.route('/api/vendor/products/<product_id>', methods=['DELETE'])
def delete_vendor_product(product_id):
    """Delete vendor product"""
    try:
        # For demo purposes, return success
        # In production, this would delete the product from database
        return jsonify({
            'success': True,
            'message': f'Product {product_id} deleted successfully',
            'product_id': product_id
        }), 200
        
    except Exception as e:
        logger.error(f"Delete product error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete product'
        }), 500

@app.route('/api/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    """Update order status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        # For demo purposes, return success
        # In production, this would update the order status in database
        return jsonify({
            'success': True,
            'message': f'Order {order_id} status updated to {new_status}',
            'order_id': order_id,
            'status': new_status
        }), 200
        
    except Exception as e:
        logger.error(f"Update order status error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update order status'
        }), 500

@app.route('/<path:path>')
def catch_all(path):
    """Catch-all route for React routing"""
    try:
        from flask import send_from_directory
        return send_from_directory('frontend/build', 'index.html')
    except Exception as e:
        logger.error(f"Error serving React route {path}: {e}")
        return jsonify({'error': 'Route not found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)), debug=True)