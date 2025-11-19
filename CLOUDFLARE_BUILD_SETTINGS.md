# 🔧 Cloudflare Pages Build Settings

## ⚠️ CRITICAL: Update Your Cloudflare Pages Settings

Your Next.js build outputs to the `out/` directory, but Cloudflare might not be configured correctly.

## ✅ Correct Build Settings

Go to: **Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments**

### Build Configuration:

1. **Build command:**
   ```
   npm run build
   ```

2. **Build output directory:**
   ```
   out
   ```

3. **Root directory:**
   ```
   /
   ```
   (Leave empty or set to `/`)

4. **Node.js version:**
   ```
   18.x
   ```
   (or latest available)

## 🔍 Verify Build Output

After deployment, check that these files exist:
- `out/index.html` ✅
- `out/art/index.html` ✅
- `out/highlights/index.html` ✅
- `out/highlights/[uuid]/index.html` ✅

## 🚨 Common Issues

### Issue 1: Wrong Output Directory
- ❌ Wrong: `build/` (React default)
- ✅ Correct: `out/` (Next.js static export)

### Issue 2: Wrong Build Command
- ❌ Wrong: `npm run build:react` or `react-scripts build`
- ✅ Correct: `npm run build` (Next.js)

### Issue 3: Not Installing Dependencies
Make sure Cloudflare runs:
```
npm install
```
before the build command.

## 📝 Full Build Process

Cloudflare should run:
```bash
npm install
npm run build
```

Then serve from the `out/` directory.

## 🔄 After Updating Settings

1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest deployment
3. OR push a new commit to trigger a new build

## ✅ Verification

After deployment, test:
- `https://atishaykasliwal.com/` → Should work
- `https://atishaykasliwal.com/art/` → Should work
- `https://atishaykasliwal.com/highlights/` → Should work
- `https://atishaykasliwal.com/highlights/[uuid]/` → Should work

All should return **200 OK** (not 404).

