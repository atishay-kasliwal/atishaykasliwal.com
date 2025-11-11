#!/bin/bash

# Quick Cloudflare Pages Deployment Script

echo "🚀 Deploying to Cloudflare Pages..."
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Building project..."
    npm run build
fi

echo "✅ Build ready"
echo ""
echo "🔐 Authenticating with Cloudflare..."
echo "   (This will open your browser)"
echo ""

# Deploy to Cloudflare Pages
npx wrangler pages deploy ./build --project-name=atishaykasliwal

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site should be live at: https://atishaykasliwal.com"
echo "📱 Check for hamburger menu (☰) on mobile view"
