# Cloudflare API Token Setup Guide

## Quick Setup Steps

### Step 1: Create API Token

**Option A: Use Template (Recommended)**
1. On the API tokens page, find **"Edit Cloudflare Workers"**
2. Click the blue **"Use template"** button
3. Review permissions (should include Pages:Edit)
4. Click **"Continue to summary"**
5. Click **"Create Token"**
6. **COPY THE TOKEN** immediately (you won't see it again!)

**Option B: Custom Token (More Secure)**
1. Click **"Get started"** next to "Custom token"
2. Token name: `GitHub Actions Deployment`
3. Set permissions:
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Account** → **Read** (optional)
4. Account resources: **Include** → **All accounts**
5. Click **"Continue to summary"**
6. Click **"Create Token"**
7. **COPY THE TOKEN** immediately

### Step 2: Add Token to GitHub

1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/settings/secrets/actions
2. Click **"New repository secret"**
3. Add `CLOUDFLARE_ACCOUNT_ID`:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: `a4e4f5c1214af712b0f5f48ef7c722ec`
4. Click **"Add secret"**
5. Click **"New repository secret"** again
6. Add `CLOUDFLARE_API_TOKEN`:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: [paste the token from Step 1]
7. Click **"Add secret"`

### Step 3: Test Deployment

1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/actions
2. Click **"Deploy to Cloudflare Pages"**
3. Click **"Run workflow"**
4. Select **"master"** branch
5. Click **"Run workflow"**

## Your Account ID
**Account ID:** `a4e4f5c1214af712b0f5f48ef7c722ec`
