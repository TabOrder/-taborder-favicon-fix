#!/bin/bash

echo "🚀 Starting TabOrder Frontend Build Process (Alternative Method)..."

# Navigate to frontend directory
cd frontend

echo "📁 Current directory: $(pwd)"
echo "📦 Installing dependencies..."

# Install dependencies
npm install

echo "🔧 Setting up build environment..."
# Create a local .npmrc to avoid permission issues
echo "unsafe-perm=true" > .npmrc

echo "🔨 Building React app using npx..."
# Use npx to run react-scripts directly
npx react-scripts build

echo "✅ Build complete - checking files:"
ls -la build/

echo "📄 Index.html preview:"
head -n 3 build/index.html

echo "🎉 Build process completed successfully!" 