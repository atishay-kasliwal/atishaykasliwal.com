# Setup GitHub Actions for Cloudflare Pages

## Your Cloudflare Account ID
**Account ID:** `a4e4f5c1214af712b0f5f48ef7c722ec`

## Quick Setup Guide

### Step 1: Create Cloudflare API Token

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Click **"Edit Cloudflare Workers"** template (or create custom token)
4. Ensure it has **"Cloudflare Pages:Edit"** permission
5. Click **"Continue to summary"** then **"Create Token"**
6. **COPY THE TOKEN** - you'll need it next!

### Step 2: Add Secrets to GitHub

1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/settings/secrets/actions
2. Click **"New repository secret"**
3. Add first secret:
   - **Name:** `CLOUDFLARE_ACCOUNT_ID`
   - **Value:** `a4e4f5c1214af712b0f5f48ef7c722ec`
   - Click **"Add secret"**
4. Add second secret:
   - **Name:** `CLOUDFLARE_API_TOKEN`
   - **Value:** [paste the token from Step 1]
   - Click **"Add secret"**

### Step 3: Test Deployment

1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/actions
2. Click **"Deploy to Cloudflare Pages"** workflow
3. Click **"Run workflow"** button
4. Select **"master"** branch
5. Click **"Run workflow"**
6. Wait 2-5 minutes for deployment

## Alternative: Manual Deployment

If you prefer, you can always deploy manually:
```bash
npx wrangler pages deploy ./build --project-name=atishay-kasliwal-github-io
```

## Troubleshooting

- **If workflow fails:** Check the Actions logs for error messages
- **If token doesn't work:** Make sure it has "Pages:Edit" permission
- **If account ID is wrong:** Run `npx wrangler whoami` to verify
