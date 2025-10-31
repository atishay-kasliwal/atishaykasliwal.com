#!/bin/bash

# Cloudflare Pages Deployment Script
# This script will deploy your site to Cloudflare Pages

set -e

echo "🚀 Starting Cloudflare Pages deployment..."
echo ""

# Check if wrangler is installed
if ! command -v npx wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install wrangler@latest --save-dev
fi

# Build the project first
echo "📦 Building the project..."
npm run build

# Deploy to Cloudflare Pages
echo ""
echo "🌐 Deploying to Cloudflare Pages..."
echo ""
echo "NOTE: If this is your first deployment, you'll need to:"
echo "1. Run: npx wrangler pages deployment tail"
echo "2. Or log in to Cloudflare dashboard to complete setup"
echo ""

# Try to deploy using wrangler pages
echo "Attempting deployment via wrangler..."
echo "You may need to authenticate first with: npx wrangler login"
echo ""

# Check if user is logged in
if npx wrangler whoami &> /dev/null; then
    echo "✅ Logged in to Cloudflare"
    npx wrangler pages deploy ./build --project-name=atishaykasliwal
else
    echo "⚠️  Not logged in. Please run: npx wrangler login"
    echo ""
    echo "After logging in, run this script again or deploy manually:"
    echo "  npx wrangler pages deploy ./build --project-name=atishaykasliwal"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site should be live at: https://atishaykasliwal.pages.dev"
echo ""
echo "Next steps:"
echo "1. Add custom domain in Cloudflare dashboard: atishaykasliwal.com"
echo "2. Wait for SSL certificate provisioning (5-15 minutes)"
echo "3. Visit https://atishaykasliwal.com to verify"

