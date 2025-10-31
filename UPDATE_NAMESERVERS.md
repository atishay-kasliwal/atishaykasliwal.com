# Update Nameservers in Hostinger

## What You Need to Do:

1. **Go to Hostinger DNS Management**
   - You should already be on the page showing your current nameservers

2. **Find Nameservers Section**
   - Look for a section titled "Nameservers" or "DNS Nameservers"

3. **Replace Current Nameservers** with Cloudflare's:
   ```
   jarred.ns.cloudflare.com
   diana.ns.cloudflare.com
   ```

4. **Save Changes**

## Important Notes:

- ✅ Don't worry about existing DNS records - Cloudflare will manage them
- ✅ The old A record pointing to `84.32.84.32` will be ignored once nameservers are changed
- ⚠️ **DNSSEC**: Check if Hostinger has DNSSEC enabled and DISABLE it
  - Look for "DNSSEC" or "DNS Security" settings in Hostinger
  - It must be OFF for Cloudflare to work

## After Updating Nameservers:

1. Go back to Cloudflare Dashboard
2. The domain status should change from "Invalid nameservers" to "Active"
3. Wait 15 minutes to 24 hours for DNS propagation
4. Your site will be live!

## Need Help Finding Nameservers in Hostinger?

- Try looking in: Domain settings → Advanced settings → DNS
- Or: Websites → DNS Management
- The exact location varies by Hostinger version

