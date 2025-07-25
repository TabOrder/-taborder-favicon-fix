#!/usr/bin/env python3
"""
Simple Flask app entry point for Render
This forces Render to recognize this as a Python project
"""

import os
from standalone_app_enhanced import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False) 