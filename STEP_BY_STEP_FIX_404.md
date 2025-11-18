# 📋 Step-by-Step: Fix 404 Errors for /art and /highlights

## Problem
Google and users are getting 404 errors when accessing:
- `https://atishaykasliwal.com/art`
- `https://atishaykasliwal.com/highlights`

## Solution: Configure Redirects in Cloudflare Dashboard

Follow these steps **exactly**:

---

## Step 1: Log into Cloudflare Dashboard

1. Open your web browser
2. Go to: **https://dash.cloudflare.com**
3. Log in with your Cloudflare account (the one with email: katishay@gmail.com)

---

## Step 2: Navigate to Your Pages Project

1. In the left sidebar, click **"Workers & Pages"**
2. You should see a list of your projects
3. Click on **"atishay-kasliwal-github-io"** (your Pages project)

---

## Step 3: Go to Settings

1. Once you're in your project, look at the top menu/tabs
2. Click on **"Settings"** tab
3. Scroll down to find **"Redirects"** section

**Note**: If you don't see "Redirects" in Settings, look for:
- **"Custom domains"** → then look for redirects there
- OR **"Functions"** → then look for redirects
- OR it might be in a different location depending on your Cloudflare plan

---

## Step 4: Add Redirect Rule

1. In the **Redirects** section, click **"Add redirect"** or **"Create redirect"** button
2. Fill in the form:

   **Source URL Pattern:**
   ```
   /*
   ```
   (This means "all URLs")

   **Destination URL:**
   ```
   /index.html
   ```

   **Status Code:**
   - Select **"200"** (Rewrite) - This is important!
   - NOT 301 or 302 (those are redirects, we need a rewrite)

   **Preserve Query String:**
   - Check this box (if available)

3. Click **"Save"** or **"Add redirect"**

---

## Step 5: Verify the Redirect

1. After saving, you should see the redirect rule in the list
2. It should show: `/*` → `/index.html` with status `200`

---

## Step 6: Wait and Test

1. **Wait 2-3 minutes** for Cloudflare to process the changes
2. **Test the URLs** in your browser:
   - Go to: `https://atishaykasliwal.com/art`
   - Go to: `https://atishaykasliwal.com/highlights`
   - Both should load your site (not show 404)

---

## Step 7: Clear Cache (Optional but Recommended)

1. In Cloudflare Dashboard, go to your **domain** (not Pages project)
2. Click **"Caching"** in the left sidebar
3. Click **"Purge Everything"**
4. Click **"Purge Everything"** again to confirm
5. Wait 2-3 minutes

---

## Step 8: Test Again

1. Open a new incognito/private browser window
2. Test:
   - `https://atishaykasliwal.com/art`
   - `https://atishaykasliwal.com/highlights`
3. Both should work now!

---

## Step 9: Request Indexing in Google Search Console

1. Go to: **https://search.google.com/search-console**
2. Make sure you're in the correct property: `atishaykasliwal.com`
3. Click **"URL Inspection"** in the left sidebar
4. Enter: `https://atishaykasliwal.com/art`
5. Click **"Request Indexing"**
6. Wait for it to say "Indexing requested"
7. Repeat for: `https://atishaykasliwal.com/highlights`

---

## Troubleshooting

### If you can't find "Redirects" in Settings:

**Option A: Check Custom Domains**
1. Go to: Settings → Custom domains
2. Look for redirect options there

**Option B: Use Cloudflare Transform Rules**
1. Go to your **domain** (not Pages project)
2. Click **"Rules"** → **"Transform Rules"**
3. Create a new rule to rewrite URLs

**Option C: Contact Cloudflare Support**
- The redirects feature might be in a different location
- Or you might need to enable it first

### If redirects still don't work:

1. **Check the redirect rule** - Make sure status code is **200** (not 301/302)
2. **Wait longer** - Sometimes it takes 5-10 minutes
3. **Clear browser cache** - Try in incognito mode
4. **Check Cloudflare Pages logs**:
   - Go to: Workers & Pages → Your Project → Logs
   - Look for any errors

---

## What This Does

The redirect rule `/*` → `/index.html` with status `200` tells Cloudflare:
- "For any URL that doesn't match a real file, serve `/index.html` instead"
- This allows React Router to handle the routing client-side
- Status `200` means it's a rewrite (not a redirect), so the URL stays the same

---

## Success Indicators

✅ `/art` loads your site (not 404)
✅ `/highlights` loads your site (not 404)  
✅ Google Search Console can fetch the pages
✅ Pages return `200` status code (not 404)

---

**Need help?** If you get stuck at any step, let me know which step and what you see!

