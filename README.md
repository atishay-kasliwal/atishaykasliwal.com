# atishaykasliwal.com

Source for [atishaykasliwal.com](https://atishaykasliwal.com/), the portfolio of Atishay Kasliwal: selected projects, experience, and photography.

Built with Vite, vanilla JavaScript, and CSS, and deployed on Cloudflare Pages. Every project, experience, and photography page is prerendered to static HTML at build time, so content and links are present without JavaScript. The complete professional profile is at [`/profile/`](https://atishaykasliwal.com/profile/) and, as JSON, at [`/api/profile.json`](https://atishaykasliwal.com/api/profile.json).

## Stack

- **Front end:** Vite, vanilla JavaScript, CSS, self-hosted Geist fonts
- **Hosting:** Cloudflare Pages, with Pages Functions for the photography API
- **Data:** Cloudflare D1 (photography library) and R2 (uploaded photographs)
- **Quality:** build-time SEO and structured-data validation, Lighthouse CI, and a weekly live crawl

## Getting started

Requires Node.js 22 or later.

```sh
npm install
npm run dev       # http://127.0.0.1:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Checks

| Command | What it does |
| --- | --- |
| `npm test` | Builds the site, validates metadata, canonicals, structured data, internal links, sitemap, robots and headers, validates the canonical profile against every page that shows it, then runs the unit tests |
| `npm run test:profile:browser` | Loads the homepage and `/profile/` in Chrome with JavaScript disabled, and checks `/api/profile.json` over HTTP |
| `npm run profile:contributions` | Refreshes the verified open source snapshot from GitHub |
| `npm run lhci` | Runs Lighthouse CI against the production build |
| `npm run seo:crawl:live` | Crawls the deployed site; reports are written to `artifacts/` |
| `npm run seo:sitemap:live` | Checks every sitemap URL on the deployed site |

## Project structure

```text
index.html          Homepage
src/                Front-end modules, styles, and page content data
src/profile/        The canonical professional profile behind /profile/ and /api/profile.json
scripts/            Page generators, image tooling, and validators
functions/          Cloudflare Pages Functions (photography, résumé and response-inspector admin, public résumé and profile API)
migrations/         D1 database migrations
public/             Static assets copied as-is into the build
tests/              Unit tests
docs/               Maintenance notes and design history
```

## Deployment

Pushes to `master` are built and deployed to Cloudflare Pages by [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml). Every push also runs the SEO and Lighthouse checks.

See [`docs/maintaining.md`](docs/maintaining.md) for where content lives and how to regenerate images, preview videos, and social cards.

See [`docs/profile-architecture.md`](docs/profile-architecture.md) for the canonical profile: `/profile/`, `/api/profile.json`, evidence and verification statuses, and the consistency checks.

See [`docs/resume-admin.md`](docs/resume-admin.md) for the résumé admin (`/admin/resume/`) and response inspector (`/admin/responses/`), including the one-time R2, D1 and Access setup.

See [`docs/github-feedback.md`](docs/github-feedback.md) for the GitHub feedback importer, protected admin API, and production rollout steps.
