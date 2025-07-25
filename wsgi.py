#!/usr/bin/env python3
"""
WSGI entry point for Render deployment
This file helps Render detect this as a Python Flask application
"""

from standalone_app_enhanced import app

if __name__ == "__main__":
    app.run() 