#!/bin/bash

echo "🚀 Starting TabOrder Frontend Build Process..."

# Navigate to frontend directory
cd frontend

echo "📁 Current directory: $(pwd)"
echo "📦 Installing dependencies..."

# Install dependencies
npm install

echo "🔨 Building React app..."
# Build the React app
npm run build

echo "✅ Build complete - checking files:"
ls -la build/

echo "📄 Index.html preview:"
head -n 3 build/index.html

echo "🎉 Build process completed successfully!" 