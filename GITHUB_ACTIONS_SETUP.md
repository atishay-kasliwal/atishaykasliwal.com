# 🤖 GitHub Actions Deployment Setup

I've created a GitHub Actions workflow that will automatically deploy your site to Cloudflare Pages on every push to master!

## Setup Required (One Time)

### Step 1: Get Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click: **Create Token**
3. Click: **Get started** next to "Cloudflare Pages:Edit" template
4. Configure:
   - **Account Resources**: Select your account
   - **Zone Resources**: All zones (or select atishaykasliwal.com)
5. Click: **Continue to summary**
6. Click: **Create Token**
7. **Copy the token** (you won't see it again!)

### Step 2: Get Account ID

1. Go to: https://dash.cloudflare.com/
2. In the right sidebar, find your **Account ID**
3. Copy it

### Step 3: Add Secrets to GitHub

1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/settings/secrets/actions
2. Click: **New repository secret**
3. Add first secret:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: [paste your API token from Step 1]
   - Click: **Add secret**
4. Add second secret:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: [paste your Account ID from Step 2]
   - Click: **Add secret**

### Step 4: Enable GitHub Actions

1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/settings/actions
2. Make sure **Workflow permissions** are set to:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests
3. Save changes

## Create Pages Project in Cloudflare

You still need to create the Pages project once:

1. Go to: https://dash.cloudflare.com
2. Navigate to: Workers & Pages → Create Application → Pages
3. Click: **Create project**
4. Enter name: `atishaykasliwal`
5. Click: **Create project** (don't connect to Git - we're using Actions)

## Deploy!

Once secrets are added:

1. Push any change to master:
   ```bash
   git add .
   git commit -m "Trigger deployment"
   git push origin master
   ```

2. GitHub Actions will automatically:
   - Build your site
   - Deploy to Cloudflare Pages
   - Provide a `.pages.dev` URL

3. Add custom domain:
   - Go to Cloudflare Pages → atishaykasliwal → Custom domains
   - Add: `atishaykasliwal.com`

## Automated Forever!

After this setup:
- Every push to `master` = automatic deployment
- No manual steps needed
- Build logs visible in GitHub Actions tab
- Preview deployments on pull requests

## Troubleshooting

### "Workflow not running"
- Check Actions tab in GitHub to see errors
- Verify secrets are added correctly
- Ensure workflow file is in `.github/workflows/`

### "Deployment failed"
- Check GitHub Actions logs
- Verify API token has correct permissions
- Make sure Pages project exists in Cloudflare

### "API token invalid"
- Regenerate token in Cloudflare
- Update GitHub secret with new token

## Files Created

- `.github/workflows/deploy-cloudflare.yml` - GitHub Actions workflow
- `GITHUB_ACTIONS_SETUP.md` - This guide

## Alternative Methods

If GitHub Actions doesn't suit you:
- **CLI**: Use `deploy.sh` script (requires CLI auth)
- **Dashboard**: Manual setup via Cloudflare dashboard (see `QUICK_FIX.md`)

