#!/bin/bash

# Automated Push and Deploy Script
# This script will push to GitHub and trigger automatic deployment via GitHub Actions

set -e

echo "🚀 Starting push and deployment process..."
echo ""

# Check git status
echo "📋 Checking git status..."
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
else
    echo "📝 Staging changes..."
    git add .
    
    echo "💾 Committing changes..."
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
fi

# Try to push
echo ""
echo "📤 Pushing to GitHub..."
echo ""

# Try different authentication methods
if git push origin master 2>/dev/null; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🔄 GitHub Actions will now automatically:"
    echo "   1. Build your React application"
    echo "   2. Deploy to Cloudflare Pages"
    echo ""
    echo "📊 Check deployment status at:"
    echo "   https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/actions"
    echo ""
    echo "🌐 Your site will be live at: https://atishaykasliwal.com"
else
    echo "⚠️  Git push requires authentication"
    echo ""
    echo "Please run one of the following:"
    echo ""
    echo "Option 1: Push manually"
    echo "  git push origin master"
    echo ""
    echo "Option 2: Use GitHub CLI (if installed)"
    echo "  gh auth login"
    echo "  git push origin master"
    echo ""
    echo "Option 3: Use SSH (if keys are set up)"
    echo "  git remote set-url origin git@github.com:atishay-kasliwal/atishay-kasliwal.github.io.git"
    echo "  git push origin master"
    echo ""
    echo "Once pushed, GitHub Actions will automatically build and deploy!"
    exit 1
fi

