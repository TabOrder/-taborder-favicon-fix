#!/usr/bin/env python3
"""
Main Flask application entry point for Render deployment
This ensures Flask runs and serves both API endpoints and React frontend
"""
import os
import sys
from standalone_app_enhanced import app, init_database, logger

# Initialize database on startup
if __name__ == '__main__':
    logger.info("🚀 Starting TabOrder Flask application...")
    
    # Initialize database
    try:
        init_database()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
    
    # Get port from environment
    port = int(os.environ.get('PORT', 10000))
    
    logger.info(f"🌐 Starting Flask app on port {port}")
    logger.info("📁 React build directory: frontend/build")
    logger.info("🔗 API endpoints available at /api/*")
    
    # Start the Flask application
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False  # Set to False for production
    ) 