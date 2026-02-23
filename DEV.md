# Local development

Run these from the **repo root** (`atishay-kasliwal.github.io-1`), not from `UI interface/apps/api`.

## Main site (atishaykasliwal.com)

```bash
npm start
```

Opens at **http://localhost:3000**. The dashboard iframe loads from `public/dashboard/` (last build).

## Dashboard app (UI) only

From repo root:
```bash
npm run dev:dashboard
```

Or from `UI interface` folder: `npm run dev:web`

Opens at **http://localhost:5173/dashboard/** with hot reload. Use this when changing dashboard code (e.g. `UI interface/apps/web/src`).

## Main site + live dashboard in the iframe

1. In one terminal: `npm run dev:dashboard` (keep it running).
2. Temporarily move the built dashboard so the dev server proxies to Vite:
   ```bash
   mv public/dashboard public/dashboard.bak
   ```
3. In another terminal: `npm start`. Open **http://localhost:3000** and go to Dashboard. The iframe will load the app from port 5173 with hot reload.
4. When done, restore: `mv public/dashboard.bak public/dashboard`

## After changing the dashboard

To see dashboard changes inside the main site without the proxy setup, rebuild and copy:

```bash
cd "UI interface/apps/web" && npm run build
cd ../.. && rm -rf public/dashboard && cp -R "UI interface/apps/web/dist/dashboard" public/dashboard && node scripts/copy-dashboard-routes.cjs
```

Then refresh **http://localhost:3000/dashboard**.
