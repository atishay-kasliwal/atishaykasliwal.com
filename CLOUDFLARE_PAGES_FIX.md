# 🔧 Fix Cloudflare Pages 404 Errors

## Problem
Google is getting 404 errors when trying to crawl your pages (`/highlights`, `/art`, etc.) even though the `_redirects` file is correct.

## Root Cause
Cloudflare Pages might not be processing the `_redirects` file correctly, or there's a configuration issue in the Cloudflare dashboard.

## ✅ Solution: Configure in Cloudflare Dashboard

### Step 1: Check Cloudflare Pages Settings
1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **atishay-kasliwal-github-io**
3. Go to: **Settings** → **Functions** tab
4. Make sure **"Redirects"** are enabled

### Step 2: Verify _redirects File Format
The `_redirects` file should be:
```
/*    /index.html   200
```

This tells Cloudflare Pages to serve `index.html` for all routes (SPA routing).

### Step 3: Check Build Output
Make sure the `_redirects` file is in the `build/` directory after building.

### Step 4: Alternative: Use Cloudflare Pages Functions
If `_redirects` still doesn't work, we can use Cloudflare Pages Functions.

## 🚀 Quick Fix: Re-deploy with Correct Configuration

The `_redirects` file is already correct. The issue might be:
1. **Caching**: Cloudflare might be caching the old 404 responses
2. **Configuration**: Cloudflare Pages might need the redirects enabled in settings

### What to Do:
1. **Clear Cloudflare Cache**:
   - Go to Cloudflare Dashboard → Your Domain → Caching → Purge Everything
   
2. **Verify _redirects is Deployed**:
   - Check that `_redirects` file is in the build output
   - It should be at the root of the build directory

3. **Wait 5-10 minutes** after deployment for changes to propagate

4. **Test the URLs**:
   ```bash
   curl -I https://atishaykasliwal.com/highlights
   curl -I https://atishaykasliwal.com/art
   ```
   Should return `200` not `404`

## 📋 Verification Checklist

- [ ] `_redirects` file exists in `build/` directory
- [ ] `_redirects` file contains: `/*    /index.html   200`
- [ ] Cloudflare Pages project is configured correctly
- [ ] Cache is cleared in Cloudflare
- [ ] URLs return 200 (test with curl)

## 🔍 If Still Not Working

If `_redirects` still doesn't work, we can:
1. Use Cloudflare Pages Functions (serverless functions)
2. Create a `functions/_middleware.js` file
3. Or configure redirects in Cloudflare dashboard directly

Let me know if you need help with any of these steps!

