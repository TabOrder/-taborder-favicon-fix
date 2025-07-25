#!/bin/bash
set -e

echo "🐍 PYTHON PROJECT DETECTED - TabOrder Flask + React Build Process"
echo "📋 Python Configuration Files:"
ls -la *.py *.txt requirements.txt .python-version pyproject.toml setup.py 2>/dev/null || echo "Some files may not exist"

echo "🔧 Installing Python dependencies..."
pip install -r requirements.txt

echo "🐍 Python environment ready. Now building React frontend..."
cd frontend

echo "📦 Installing Node.js dependencies for frontend only..."
npm install

echo "🔧 Setting up build environment..."
echo "unsafe-perm=true" > .npmrc
echo "legacy-peer-deps=true" >> .npmrc

echo "🔧 Fixing permissions on node_modules..."
chmod -R 755 node_modules/.bin/
chmod +x node_modules/.bin/react-scripts

echo "🔨 Building React app using npx..."
npx --no-install react-scripts build

echo "✅ Build complete - checking files:"
ls -la build/
echo "📄 Index.html preview:"
head -n 3 build/index.html

echo "🐍 Returning to Python project root..."
cd ..

echo "🔧 Ensuring React build files are accessible to Flask..."
if [ -d "frontend/build" ]; then
    echo "✅ React build directory exists"
    ls -la frontend/build/
else
    echo "❌ React build directory not found!"
    exit 1
fi

echo "🎉 Python + React build process completed successfully!"
echo "🚀 Flask app will start with: python app.py"
echo "📁 React files will be served from: frontend/build/" 