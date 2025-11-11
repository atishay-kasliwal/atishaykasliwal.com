# Deploy to Cloudflare Pages

## Quick Deployment Guide

Since your domain (atishaykasliwal.com) is on Cloudflare, you need to deploy to Cloudflare Pages.

### Option 1: GitHub Actions (Automated - Recommended)

1. **Check if workflow ran automatically:**
   - Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/actions
   - Look for "Deploy to Cloudflare Pages" workflow
   - Check if it ran after your latest commit (68743ca)

2. **If workflow failed (missing secrets):**
   - Go to: Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Add: `CLOUDFLARE_API_TOKEN`
     - Get token from: https://dash.cloudflare.com/profile/api-tokens
     - Create token with "Cloudflare Pages:Edit" permissions
   - Add: `CLOUDFLARE_ACCOUNT_ID`
     - Get from Cloudflare dashboard (right sidebar)

3. **Manually trigger workflow:**
   - Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/actions
   - Click "Deploy to Cloudflare Pages"
   - Click "Run workflow"
   - Select "master" branch
   - Click "Run workflow"

### Option 2: Manual Deployment (Fast)

If you have Cloudflare access, run:

```bash
npx wrangler login
npx wrangler pages deploy ./build --project-name=atishaykasliwal
```

### Verify Deployment

After deployment:
1. Visit: https://atishaykasliwal.com
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Resize to mobile width (< 768px)
4. Look for hamburger menu (☰) in top right

## Build is Ready!

Your build folder contains all the mobile-friendly changes and is ready to deploy.
