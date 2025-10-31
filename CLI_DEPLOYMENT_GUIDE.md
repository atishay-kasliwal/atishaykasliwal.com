# 🚀 CLI Deployment Guide

I've set up Wrangler CLI, but you need to authenticate manually first.

## Quick CLI Deployment

### Step 1: Authenticate
```bash
npx wrangler login
```

This will:
1. Open a browser window
2. Ask you to log in to Cloudflare
3. Authorize the CLI

### Step 2: Deploy
Once authenticated, run:
```bash
./deploy.sh
```

Or manually:
```bash
npx wrangler pages deploy ./build --project-name=atishaykasliwal
```

### Step 3: Add Custom Domain
After deployment, go to Cloudflare dashboard:
1. Navigate to Workers & Pages → atishaykasliwal
2. Go to Custom domains
3. Add: `atishaykasliwal.com`

## Alternative: Use GitHub Actions

If CLI doesn't work, I can set up automatic deployment via GitHub Actions.

## Alternative: Manual Dashboard Deployment

The easiest way is still via the Cloudflare dashboard (5 minutes):
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → Create Application → Pages
3. Connect to Git → Select your repo
4. Configure and deploy

See `QUICK_FIX.md` for detailed dashboard instructions.

