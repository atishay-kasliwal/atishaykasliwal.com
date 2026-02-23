# Private Job Tracker Dashboard

React dashboard + Cloudflare Worker API + Neon Postgres migration from your existing workbook.

## Project structure

- `db/migrations/001_init.sql` - Postgres schema
- `db/migrations/002_app_user_template.sql` - least-privilege app user template
- `scripts/import_xlsx.py` - one-time importer from `Job Tracker by Resumary.com.xlsx`
- `apps/api` - Cloudflare Worker API
- `apps/web` - React dashboard
- `docs/deploy.md` - deployment and **hosting at atishaykasliwal.com/dashboard**

## Quick start (dashboard working with no token)

If you hit 401 and want the dashboard to work immediately:

1. **Open API (no auth):** From `apps/api` run `npx wrangler secret delete API_SHARED_TOKEN`, then `npx wrangler deploy`. The API will allow all requests.
2. **Web env:** In `apps/web/.env` set only `VITE_API_URL=https://job-tracker-api.katishay.workers.dev` (leave `VITE_API_TOKEN` empty).
3. **Run:** From repo root run `npm run dev:web`. Reload the dashboard.

You can add `API_SHARED_TOKEN` again later to lock the API.

---

## Full quick start

1. **Install dependencies:** `npm install` (from repo root).
2. **API secrets** (in `apps/api`):
   - `npx wrangler secret put NEON_DATABASE_URL` (required for DB)
   - `npx wrangler secret put API_SHARED_TOKEN` (optional; if unset, API is open and dashboard works without a token)
3. **Apply DB migration** (once, with Neon URL in env):
   - `pip3 install -r scripts/requirements.txt`
   - `export NEON_DATABASE_URL="postgresql://..."`
   - `python3 scripts/run_migration.py`
4. **Import Excel data** (once):
   - `python3 scripts/import_xlsx.py` (uses `NEON_DATABASE_URL`; writes `import_report.json`).
5. **Web app env:** Copy `apps/web/.env.example` to `apps/web/.env` and set `VITE_API_URL` (your Worker URL). Set `VITE_API_TOKEN` only if you set `API_SHARED_TOKEN` on the Worker (use the same value).
6. **Run locally:**
   - API: `npm run dev:api` (or deploy with `npx wrangler deploy` from `apps/api`).
   - Web: `npm run dev:web` — then open **http://localhost:5173/dashboard/** (app is built for the `/dashboard` path).

## Notes

- **Auth:** If `API_SHARED_TOKEN` is not set on the Worker, the API allows all requests (handy for local use). To lock it down, set the secret and use the same value as `VITE_API_TOKEN` in `apps/web/.env`. Cloudflare Access email header also grants access.
- Keep DB URL and API token out of git.
