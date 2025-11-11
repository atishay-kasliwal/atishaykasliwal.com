#!/bin/bash

# Manual Deployment Script for Cloudflare Pages
# This script will help you deploy your site manually

set -e

echo "🚀 Starting manual deployment to Cloudflare Pages..."
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo "❌ Build directory not found. Building now..."
    npm run build
fi

echo "✅ Build directory found"
echo ""

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

echo "📦 Checking authentication..."
echo ""

# Try to deploy
echo "Attempting to deploy to Cloudflare Pages..."
echo "If you're not logged in, you'll need to:"
echo "1. Run: npx wrangler login"
echo "2. Then run this script again"
echo ""

npx wrangler pages deploy ./build --project-name=atishaykasliwal

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site should be live at: https://atishaykasliwal.com"
