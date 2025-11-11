# Fix GitHub Actions Deployment

## Common Issues and Solutions

### Issue 1: Missing Secrets (Most Common)

The GitHub Actions workflow needs these secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

**Fix:**
1. Go to: https://github.com/atishay-kasliwal/atishay-kasliwal.github.io/settings/secrets/actions
2. Click "New repository secret"
3. Add `CLOUDFLARE_API_TOKEN`:
   - Get from: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with "Cloudflare Pages:Edit" permission
   - Copy the token and add it as secret
4. Add `CLOUDFLARE_ACCOUNT_ID`:
   - Get from Cloudflare dashboard (right sidebar)
   - Or run: `npx wrangler whoami` to see account ID
   - Add it as secret

### Issue 2: API Token Permissions

Make sure the token has these permissions:
- Account: Cloudflare Pages:Edit
- Account: Account:Read

### Issue 3: Wrong Project Name (Fixed)

✅ Already fixed - project name is now: `atishay-kasliwal-github-io`

## Quick Fix Steps

1. **Get Account ID:**
   ```bash
   npx wrangler whoami
   ```

2. **Create API Token:**
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with Pages:Edit permission

3. **Add Secrets to GitHub:**
   - Go to: Settings > Secrets and variables > Actions
   - Add both secrets

4. **Trigger Workflow:**
   - Go to: Actions > Deploy to Cloudflare Pages
   - Click "Run workflow"

## Alternative: Use Manual Deployment

Since manual deployment works, you can also:
```bash
./deploy-cloudflare-now.sh
```

Or:
```bash
npx wrangler pages deploy ./build --project-name=atishay-kasliwal-github-io
```
