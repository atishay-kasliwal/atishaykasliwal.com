# 🚨 FIX: Highlights Page Not Deploying

## The Problem
Cloudflare Pages is not deploying the highlights page because the build settings are incorrect.

## ✅ Solution: Update Cloudflare Pages Settings

### Step 1: Go to Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com
2. Select your account
3. Go to **Pages** → Your project (atishaykasliwal.github.io)

### Step 2: Update Build Settings
1. Click **Settings** (left sidebar)
2. Click **Builds & deployments**
3. Scroll to **Build configuration**

### Step 3: Update These Settings

**Build command:**
```
npm run build
```

**Build output directory:**
```
out
```
⚠️ **IMPORTANT:** Must be `out` (not `build` or anything else)

**Root directory:**
```
/
```
(Leave empty or set to `/`)

**Node.js version:**
```
18
```
(or latest available - 18, 19, or 20)

### Step 4: Save and Redeploy
1. Click **Save** at the bottom
2. Go to **Deployments** tab
3. Click **Retry deployment** on the latest deployment
4. OR push a new commit to trigger a new build

## ✅ Verify After Deployment

After the deployment completes, test:
- `https://atishaykasliwal.com/` → Should work ✅
- `https://atishaykasliwal.com/art/` → Should work ✅
- `https://atishaykasliwal.com/highlights/` → Should work ✅

## 🔍 Check Build Logs

If it still doesn't work:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the **Build logs**
4. Look for errors or warnings

## 📝 What Should Happen

Cloudflare should:
1. Run `npm install`
2. Run `npm run build`
3. Find files in `out/` directory
4. Deploy all files including `out/highlights/index.html`

## ⚠️ Common Mistakes

❌ **Wrong output directory:**
- `build/` (React default) - WRONG
- `out/` (Next.js static export) - CORRECT

❌ **Wrong build command:**
- `react-scripts build` - WRONG
- `npm run build` - CORRECT

✅ **Correct settings:**
- Build command: `npm run build`
- Output directory: `out`
- Root directory: `/` (or empty)
