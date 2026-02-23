# Database migrations

Migrations are in `db/migrations/` and run in filename order.

**Run migrations** (from repo root, with your Neon DB URL):

```bash
NEON_DATABASE_URL='postgresql://user:pass@host/db?sslmode=require' npm run migrate --prefix apps/api
```

Or from `apps/api`:

```bash
cd apps/api
NEON_DATABASE_URL='postgresql://...' npm run migrate
```

Use the same `NEON_DATABASE_URL` you use for the API (e.g. from Neon dashboard or Wrangler secrets). After running, the **Referred by** column will exist and the Referrals list will show and save referred-by names.
