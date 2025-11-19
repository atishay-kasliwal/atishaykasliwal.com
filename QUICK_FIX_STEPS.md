# 🚀 Quick Fix: Update Cloudflare Pages Build Settings

## Step-by-Step Instructions

### 1. Click on Your Project
- In the Cloudflare dashboard, click on **"atishay-kasliwal-github-io"**

### 2. Go to Settings
- Click **"Settings"** in the left sidebar
- Scroll down to **"Builds & deployments"** section

### 3. Update Build Configuration

Find the **"Build configuration"** section and update:

#### Build command:
```
npm run build
```

#### Build output directory:
```
out
```
⚠️ **CRITICAL:** Must be `out` (not `build` or anything else)

#### Root directory:
```
/
```
(Leave empty or set to `/`)

#### Node.js version:
```
18
```
(or latest available)

### 4. Save Changes
- Click **"Save"** button at the bottom

### 5. Redeploy
- Go to **"Deployments"** tab
- Find the latest deployment
- Click **"Retry deployment"** (or wait for next auto-deploy)

## ✅ What This Fixes

- ✅ Highlights page will deploy correctly
- ✅ All routes will work (`/`, `/art`, `/highlights`)
- ✅ No more 404 errors

## 🔍 Verify After Deployment

After deployment completes, test:
- `https://atishaykasliwal.com/highlights/` → Should work ✅
- `https://atishaykasliwal.com/art/` → Should work ✅
- `https://atishaykasliwal.com/` → Should work ✅

## 📝 Current Status

Your build is working correctly locally - all files are in `out/` directory:
- ✅ `out/index.html` exists
- ✅ `out/art/index.html` exists  
- ✅ `out/highlights/index.html` exists

The issue is just that Cloudflare needs to know to look in the `out/` directory!

