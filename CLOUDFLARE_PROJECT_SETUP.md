# 🚀 Deploy Your Project to Cloudflare Pages

## Step 1: Go to Cloudflare Pages

1. Open: https://dash.cloudflare.com
2. Click **Workers & Pages** in the left sidebar
3. Click **Create Application** button (top right)
4. Click the **Pages** tab
5. Click **Connect to Git** button

## Step 2: Connect Your GitHub Account

1. You'll see a list of git providers
2. Click **GitHub** (or select it if prompted)
3. Click **Authorize Cloudflare** button
4. You might be redirected to GitHub to authorize access
5. Click "Authorize" on GitHub if prompted

## Step 3: Select Your Repository

1. You'll see a list of your GitHub repositories
2. Find and select: **`atishay-kasliwal/atishay-kasliwal.github.io`**
3. Click on it (or click "Begin setup")

## Step 4: Configure Build Settings

Fill in these exact settings:

### Project Name
- **Name**: `atishaykasliwal` (or any name you want)

### Build Configuration
- **Production branch**: `master`

### Build Settings
- **Framework preset**: Choose **"Create React App"** from the dropdown
  - OR manually enter:
  - **Build command**: `npm run build`
  - **Build output directory**: `build`
  - **Root directory**: Leave empty `/`

### Environment Variables
- Leave empty for now (none needed)

## Step 5: Save and Deploy

1. Click **Save and Deploy** button
2. Wait 2-3 minutes for the first build
3. You'll see build logs in real-time
4. When it says "Success" you're done!

## Step 6: Add Your Custom Domain

After the first deployment completes:

1. Click on your project name in the Cloudflare Pages dashboard
2. Go to **Custom domains** tab
3. Click **Set up a custom domain** button
4. Enter: `atishaykasliwal.com`
5. Click **Continue**
6. Cloudflare will detect your domain (it's already in your Cloudflare account)
7. Click **Activate domain**

## Step 7: Wait for Everything to Complete

- ✅ Build completes (2-3 minutes)
- ✅ Domain activates (automatic, immediate since nameservers are already configured)
- ✅ SSL certificate provisions (5-15 minutes)
- 🌐 Your site goes live!

## What Happens After This?

- **Automatic deployments**: Every time you push to `master` branch, site auto-deploys
- **Preview deployments**: Every pull request gets a preview URL
- **Fast CDN**: Your site delivered from 200+ locations worldwide
- **Free SSL**: Automatic HTTPS

## Troubleshooting

If build fails:
- Check the build logs in Cloudflare dashboard
- Verify build command is `npm run build`
- Verify output directory is `build`
- Make sure your code is pushed to GitHub

Let me know when you're ready to start!


