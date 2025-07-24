#!/bin/bash
set -e

echo "🚀 Starting TabOrder Frontend Build Process (Permission Fix)..."
cd frontend

echo "📁 Current directory: $(pwd)"
echo "📦 Installing dependencies..."
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
echo "🎉 Build process completed successfully!" 