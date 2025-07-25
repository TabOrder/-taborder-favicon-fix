#!/bin/bash
set -e

echo "🚀 TabOrder Full-Stack Application Startup"
echo "📋 Environment Check:"

# Check if React build exists
if [ -d "frontend/build" ]; then
    echo "✅ React build directory found"
    ls -la frontend/build/
else
    echo "❌ React build directory not found - building now..."
    npm run build
fi

# Check Python environment
echo "🐍 Python environment:"
python --version
pip list | grep -E "(Flask|psycopg2|gunicorn)"

# Initialize database
echo "🗄️ Initializing database..."
python -c "from standalone_app_enhanced import init_database; init_database()"

# Start Flask application
echo "🌐 Starting Flask application..."
python app.py 