# Cloudflare Pages Setup Guide

Your site is now configured for Cloudflare Pages deployment. Follow these steps to deploy:

## 1. Connect Your Repository to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
3. Select **GitHub** and authorize Cloudflare to access your repository
4. Select your repository: `atishay-kasliwal/atishay-kasliwal.github.io`

## 2. Configure Build Settings

Configure your build settings in Cloudflare Pages:

- **Framework preset**: Create React App
- **Build command**: `npm run build`
- **Build output directory**: `build`
- **Root directory**: `/` (leave empty)

## 3. Custom Domain Setup

1. In your Cloudflare Pages dashboard, go to **Custom domains**
2. Add custom domain: `atishaykasliwal.com`
3. Add subdomain: `www.atishaykasliwal.com` (optional)
4. Cloudflare will automatically detect your DNS and update it

## 4. DNS Configuration (if not using Cloudflare DNS)

If your domain is managed elsewhere, add these DNS records:

```
Type: CNAME
Name: @ (or atishaykasliwal.com)
Target: your-project.pages.dev
Proxy: Enabled (Orange Cloud)
```

For www subdomain:
```
Type: CNAME
Name: www
Target: your-project.pages.dev
Proxy: Enabled (Orange Cloud)
```

## 5. Deploy

Your site will automatically deploy on every push to the `master` branch. You can also manually trigger deployments from the Cloudflare dashboard.

## Benefits of Cloudflare Pages

✅ **Fast global CDN**: Content delivered from 200+ locations worldwide
✅ **Automatic HTTPS**: SSL certificates provisioned automatically
✅ **Free SSL**: Unlimited bandwidth and requests (free tier)
✅ **Git Integration**: Automatic deployments on every push
✅ **Preview Deployments**: Preview every pull request
✅ **Better Performance**: Built on Cloudflare's edge network
✅ **Security**: DDoS protection and Web Application Firewall included

## 6. Remove GitHub Pages Dependency

Run this command to remove the gh-pages package:
```bash
npm uninstall gh-pages
```

## Current Configuration

- Build output directory: `build/`
- SPA routing: Configured via `_redirects` file
- 404 fallback: Automatically created from index.html
- Custom domain: atishaykasliwal.com (to be configured in Cloudflare dashboard)

## Troubleshooting

If your site doesn't load:
1. Verify build command is `npm run build`
2. Check that output directory is `build`
3. Ensure `_redirects` file is in the `build` directory
4. Check DNS records are pointing to Cloudflare Pages

