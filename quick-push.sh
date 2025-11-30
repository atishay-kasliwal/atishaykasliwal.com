#!/bin/bash

# Quick Push Script - Run this to complete the deployment

echo "🚀 Pushing to GitHub..."
echo ""

# Try push with credential helper
git config credential.helper osxkeychain

# Attempt push
if git push origin master; then
    echo ""
    echo "✅ Successfully pushed!"
    echo ""
    echo "🔄 GitHub Actions is now building and deploying..."
    echo "📊 Check status: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/actions"
    echo "🌐 Site will be live at: https://atishaykasliwal.com"
else
    echo ""
    echo "⚠️  Authentication required"
    echo ""
    echo "You'll be prompted for:"
    echo "  - Username: atishay-kasliwal"
    echo "  - Password: Use a GitHub Personal Access Token (not your password)"
    echo ""
    echo "To create a token:"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Generate new token (classic)"
    echo "  3. Select 'repo' scope"
    echo "  4. Copy token and use as password"
    echo ""
    echo "Or run: git push origin master"
fi

