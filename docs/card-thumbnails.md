# Card thumbnails

Admin (admin.atishaykasliwal.com → Thumbnails) can replace the picture on any carousel card: the 14
projects, the 11 open source projects, and the 6 volunteer and event cards. Reset puts the built-in
image back. Nothing is rebuilt or redeployed; the homepage shows a change within about 30 seconds.

## Cards

Every card has an id, `<section>:<slug>`: `project:atriveo-tracker`, `open-source:keycloak`,
`volunteer:aws-summit-nyc`. Open source and volunteer cards use their `slug`; projects use their
name, lowercased with dashes (`src/card-thumbnails.js`). Renaming a project changes its id, and a
thumbnail chosen for the old id is ignored until it is chosen again.

`scripts/build-card-catalog.mjs` (part of `npm run build`) lists every card with its built-in image
in `functions/_generated/card-catalog.js`. Kaggriculture, Atriveo Reel and Bayesian Marketing Mix
are drawn in HTML and have no built-in image; a thumbnail replaces the drawing.

## Storage

| What | Where |
| --- | --- |
| Images | Public bucket `photography-photos` (binding `PHOTOS`, served at photos.atishaykasliwal.com): `cards/<sha>-1080.webp` and `cards/<sha>-640.webp`, named by content and cached as immutable. Never overwritten or deleted, so earlier thumbnails stay available. |
| Which card uses which | D1 `photography`, table `card_thumbnails` (`migrations/0007_card_thumbnails.sql`). No row means the built-in image. |
| History | `card_thumbnail_audit`: every replace and reset, the image it replaced, who and when. |

## Admin API

All three take the dashboard's Access service token (see resume-admin.md) and refuse writes
without this site's `Origin`.

| Route | |
| --- | --- |
| `GET /api/admin/thumbnails` | `{ cards: [{ id, section, name, builtIn, thumbnail }] }` |
| `POST /api/admin/thumbnails/<section>/<slug>` | Multipart `full` (1080×664 WebP, ≤ 2 MB) and `small` (640×394 WebP, ≤ 1 MB). Admin crops and encodes both in the browser. The Function reads the bytes, never the declared type: anything else is refused and nothing is stored. |
| `DELETE /api/admin/thumbnails/<section>/<slug>` | Back to the built-in image. |

## On the homepage

The cards are prerendered into `index.html`. `functions/index.js` serves `/`:

- With no thumbnails chosen (or D1 unreadable), it passes the static page through untouched.
- Otherwise it swaps the images in with HTMLRewriter: an image card keeps its own `<img>` (so the
  first card's `fetchpriority="high"` stays) with a new `src` and `srcset`; an HTML card's drawing is
  replaced by a lazy `<img>`. It also inlines the choices as `<script type="application/json"
  id="card-thumbnails">`, which `src/card-thumbnails.js` reads so the preview window and any
  re-rendered track agree. Open source and volunteer previews show the new picture too; a project's
  preview keeps its real screenshot or recording.
- Only URLs of the form `https://photos.atishaykasliwal.com/cards/<24 hex>-(1080|640).webp`, for
  cards that exist, are ever written into the page, on the server and again in the browser.
- The choices are read from D1 at most every 30 seconds per isolate. The response has no `ETag` and
  conditional requests are fetched in full, so a browser never keeps a copy from before a change.

## Production setup (once)

1. `npx wrangler d1 migrations apply photography --remote` (adds `card_thumbnails`).
2. Deploy the site.
3. In Admin, allow `/api/admin/thumbnails` in the site proxy and deploy Admin (portfolio-intelligence).

The service token and Access application need no change: `/api/admin/*` is already covered.

## Local checks

```sh
npm run test:thumbnails
npm run build && npx wrangler d1 migrations apply photography --local
npx wrangler pages dev dist   # the homepage Function runs here
```
