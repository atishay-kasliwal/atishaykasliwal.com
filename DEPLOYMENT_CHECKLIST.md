# ✅ Deployment Checklist

Use this checklist to ensure your website is properly deployed.

## Pre-Deployment

- [x] Local build works (`npm run build`)
- [ ] Code pushed to GitHub (check current branch)
- [ ] All changes committed

## Cloudflare Configuration

### 1. Domain Setup
- [ ] Domain added to Cloudflare account
- [ ] Nameservers updated at Hostinger to point to Cloudflare
  - Nameserver 1: `jarred.ns.cloudflare.com`
  - Nameserver 2: `diana.ns.cloudflare.com`
- [ ] DNSSEC disabled in Hostinger
- [ ] Domain status shows "Active" in Cloudflare (not "Invalid nameservers" or "Pending")

### 2. Cloudflare Pages Project
- [ ] Pages project created in Cloudflare
- [ ] Connected to GitHub repository: `atishay-kasliwal/atishay-kasliwal.github.io`
- [ ] Build configuration set:
  - Framework: Create React App (or None)
  - Build command: `npm run build`
  - Output directory: `build`
  - Root directory: `/` (empty)
  - Production branch: `master`

### 3. Deployment
- [ ] First deployment completed successfully
- [ ] Can see deployment logs in Cloudflare dashboard
- [ ] Latest deployment shows "Success" status

### 4. Custom Domain
- [ ] Custom domain added in Cloudflare Pages: `atishaykasliwal.com`
- [ ] Domain activation completed
- [ ] SSL certificate provisioned (shows valid SSL in Cloudflare)

### 5. DNS Records
- [ ] DNS records verified in Cloudflare dashboard
- [ ] CNAME or A record points to Pages deployment
- [ ] Orange cloud (proxied) enabled for DNS records

## Post-Deployment Verification

- [ ] Website accessible at `https://atishaykasliwal.com`
- [ ] Homepage loads correctly
- [ ] SSL certificate valid (green padlock in browser)
- [ ] Routes work: `/`, `/art`, `/projects`
- [ ] All images and assets load
- [ ] No console errors in browser
- [ ] Mobile responsive check

## Troubleshooting Commands

### Check Current Status
```bash
# Check git status
git status

# Check build works locally
npm run build

# Test local build
serve -s build
```

### Deploy to Cloudflare Pages

**Option 1: Automatic (Recommended)**
- Push to master branch triggers automatic deployment
```bash
git add .
git commit -m "Deploy latest changes"
git push origin master
```

**Option 2: Manual**
- Go to Cloudflare Pages dashboard → Triggers → Deployments → Create deployment

### Common Issues

**"Invalid nameservers"**
- Update nameservers in Hostinger to Cloudflare ones
- Wait for DNS propagation (15 min - 24 hours)

**"Domain not verified"**
- Complete domain verification in Cloudflare Overview page
- May need to add TXT record to verify ownership

**"Build failed"**
- Check build logs in Cloudflare Pages
- Verify build command and output directory
- Test local build first: `npm run build`

**"Page not found" or "404"**
- Verify `_redirects` file is in build directory
- Check that React Router is configured correctly
- Ensure all routes have corresponding components

**SSL certificate issues**
- Wait 5-15 minutes for SSL provisioning
- Check SSL/TLS settings in Cloudflare
- Ensure domain is properly activated

## Quick Links

- Cloudflare Dashboard: https://dash.cloudflare.com
- GitHub Repository: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io
- Your Website: https://atishaykasliwal.com

## Current Status

Based on your files:
- ✅ Code configured for Cloudflare Pages
- ✅ Build works locally
- ✅ All deployment files present (`_redirects`, etc.)
- ⏳ **NEXT STEP**: Verify Cloudflare Pages project exists and is connected to GitHub
- ⏳ **NEXT STEP**: Ensure nameservers are updated and domain is Active

## Need Help?

If you're stuck, check these files:
- `DIAGNOSIS_REPORT.md` - Detailed diagnostic information
- `CLOUDFLARE_PROJECT_SETUP.md` - Step-by-step setup guide
- `CURRENT_STATUS.md` - Where you left off
- `DEPLOY_STEPS.md` - Deployment walkthrough

