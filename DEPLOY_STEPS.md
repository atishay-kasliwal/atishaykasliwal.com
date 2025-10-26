# 🎯 Deploy to Cloudflare Pages - Action Steps

## Step 1: Commit and Push Changes

Run these commands in your terminal:

```bash
git add .
git commit -m "Configure for Cloudflare Pages"
git push origin master
```

## Step 2: Go to Cloudflare Dashboard

1. Open https://dash.cloudflare.com in your browser
2. Log in (or create a free account if needed)

## Step 3: Create a New Pages Project

1. Click **Workers & Pages** in the sidebar
2. Click **Create Application**
3. Click **Pages** tab
4. Click **Connect to Git**

## Step 4: Connect GitHub Repository

1. Select **GitHub**
2. Click **Authorize Cloudflare** (if not already connected)
3. Select repository: **atishay-kasliwal/atishay-kasliwal.github.io**
4. Click **Begin setup**

## Step 5: Configure Build Settings

In the configuration form, enter:

- **Project name**: `atishaykasliwal` (or any name you want)
- **Production branch**: `master`
- **Framework preset**: Leave as **None** or select **Create React App**
- **Build command**: `npm run build`
- **Build output directory**: `build`
- **Root directory**: Leave empty `/`

Then click **Save and Deploy**

## Step 6: Add Custom Domain

After deployment completes:

1. Click on your project
2. Go to **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `atishaykasliwal.com`
5. Click **Add domain**

Cloudflare will automatically configure DNS if your domain is already on Cloudflare.

If your domain is NOT on Cloudflare:
- You'll need to update DNS records
- Add a CNAME record pointing to your Cloudflare Pages URL (you'll see it in the dashboard)

## Step 7: Wait and Verify

- Cloudflare will provision SSL automatically (takes ~5 minutes)
- Your site will be live at `atishaykasliwal.com`

## ✅ Done!

Your site will now auto-deploy on every push to master branch!

## 🆘 Having Issues?

If you need help with DNS setup or have issues, check:
- `cloudflare-pages-setup.md` for troubleshooting
- Cloudflare Pages documentation: https://developers.cloudflare.com/pages/

