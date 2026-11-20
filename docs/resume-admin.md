# Résumé admin and response inspector

Two private pages behind Cloudflare Access:

- `/admin/resume/`: upload, preview, validate, publish and restore the résumé PDF without a rebuild.
- `/admin/responses/`: see exactly what `/api/profile.json`, `/`, `/profile/` and the other public files return to browsers and crawlers, checked against the canonical profile.

The canonical profile (`src/profile/`, see [profile-architecture.md](profile-architecture.md)) stays the only source of professional facts. A PDF is checked against it and never changes it.

## How the résumé is served

The public URL stays `https://atishaykasliwal.com/Atishay-Kasliwal-Resume.pdf`. `/resume` still redirects to it, and the homepage and `/profile/` keep linking to it.

| State | `/Atishay-Kasliwal-Resume.pdf` | `/api/profile.json` → `profile.resume.version` |
| --- | --- | --- |
| Nothing published from the admin | `public/Atishay-Kasliwal-Resume.pdf` bundled with the deploy | `source: "bundled"`, hash of that file |
| A version published | That version, from the private R2 bucket | `source: "published"`, its id, sha256 and `publishedAt` |
| D1 or R2 unreadable | Bundled PDF (fallback; logged) | Built file unchanged |

`functions/Atishay-Kasliwal-Resume.pdf.js` serves the PDF, and `functions/api/profile.json.js` serves the built profile with the résumé reference swapped in (`src/resume-core/overlay.js`). Only `profile.resume`, the `document:resume` evidence date and `lastUpdated` change. Both send the site-wide security headers themselves, because `_headers` does not apply to Function responses.

Caching: Function responses are not cached at Cloudflare's edge. The PDF is sent with `Cache-Control: public, max-age=0, must-revalidate` and a content-hash `ETag`, so every visitor gets a new version on their next request and an unchanged one costs a 304. `/api/profile.json` keeps a 60-second browser cache (`stale-while-revalidate=300`) with an ETag. No purge step is needed.

## Storage

| What | Where |
| --- | --- |
| PDF bytes, every version | R2 bucket `portfolio-resumes` (binding `RESUMES`), key `versions/<sha256>.pdf`. Private: no custom domain, no r2.dev access. Not the public photography bucket. |
| Version metadata and reports | D1 `photography`, table `resume_versions` (`migrations/0005_resume_versions.sql`) |
| What is published | `resume_active`, one row |
| Audit log | `resume_audit`: upload, duplicate upload, rejected upload, publish, restore, re-check; actor email from the verified Access token; content hashes; previous version on every publish |

Versions are never deleted, so any earlier one can be restored.

## Validation

The site runs on the Workers **Free** plan, whose Functions get about 10 ms of CPU per request. Reading a PDF's text with pdf.js takes 10–120 ms, so the check is split:

**In the browser, before uploading** (`src/resume-core/report.js`: `pdf.js`, then `consistency.js`). The admin page loads pdf.js on the first upload, checks the file in full, and refuses it there if it fails. A passing file is uploaded together with the report (validation, extracted text, consistency).

**In the Function, on every upload** (`src/resume-core/screen.js`, about 1 ms). It never trusts the browser for safety. An upload is rejected (422, audited, nothing stored) unless the file:

- is 1 KB to 5 MB, named `.pdf`, and declared `application/pdf` (or unspecified)
- is not an executable, archive or script (magic bytes), and starts with a `%PDF-1.x`/`2.0` header with an end-of-file marker and cross-reference
- is not encrypted
- has no active content: JavaScript, launch actions, embedded files, rich media, XFA, form submission, remote go-to or automatic actions. Hex-escaped names and compressed object streams are scanned too.

The browser's report is then accepted only if it describes this exact file (same SHA-256 and size) and is well formed: passing validation, 1–6 pages, at least 300 characters of text, at most 600 kept lines. The Function recomputes the conflict counts from the findings, so the publish gate never relies on the browser's numbers. A missing or malformed report is refused (400). The browser additionally confirms, with pdf.js, that the PDF parses (`isEvalSupported: false`) and has no scripts or attachments; only the signed-in admin can upload, so the text and consistency it reports are trusted as the admin's own.

**At build time** `scripts/build-resume-report.mjs` checks the bundled PDF against the profile and writes `functions/_generated/bundled-resume.js`, so the dashboard shows its report without parsing a PDF per request. **Re-check** runs in the browser too, from the version's kept text, and sends only the new consistency report.

A request body over the limit is refused (413) before it is read.

## Consistency with the canonical profile

`src/resume-core/consistency.js` compares the extracted text with the built `/api/profile.json` and the review register (`src/profile/review.js`):

| Category | Checks |
| --- | --- |
| Experience | Each role's start and end month, "Present" on an ended role, title, internship only on the PDF, roles missing from either side |
| Education | Institution, degree, start and end dates; unconfirmed fields are info |
| Skills | Every skill the PDF lists must have evidence in the profile (aliases like Kafka → Apache Kafka are understood) |
| Accomplishments | Phrases a review item keeps out of the profile (for example "2,000+ users"); metrics with no counterpart anywhere in the profile |
| Contact | Name and email |

Findings are `conflict`, `unverified` or `info`, and link to the review item that already covers them. Publishing a version with conflicts requires ticking an acknowledgement; it still changes nothing in the profile. **Re-check** reruns a stored version against the profile as currently deployed.

The Stony Brook research role ended in **May 2026** (user-confirmed 2026-11-19, review item `stony-brook-research-end-date`). The bundled PDF still says "November 2024 – Present", and every upload that does is flagged as a conflict.

## Response inspector

`/admin/responses/` fetches one of `/api/profile.json`, `/`, `/profile/`, `/api/profile.schema.json`, `/llms.txt`, `/robots.txt` or the résumé PDF, either:

- **from your browser, signed out** (`credentials: "omit"`, `cache: "no-store"`), or
- **as a simulated crawler** (`/api/admin/responses/fetch`): this site's server sends Chrome's, GPTBot's, ClaudeBot's, PerplexityBot's or Googlebot's User-Agent string, following redirects on this origin and showing each hop. Only those fixed paths on the site's own origin can be fetched. These are **not** requests from those providers. Real crawlers come from their own IP ranges and Cloudflare's bot detection identifies them, so bot rules (for example blocking AI crawlers) can answer them differently. The menu, the response summary and the API response (`simulated: true`) all say so.

It shows status, headers, content type, size, time to headers and total, `cf-cache-status`, and the SHA-256 of the body. JSON is shown as a collapsible tree or raw. HTML is shown raw, rendered in an empty sandbox (no scripts, as a non-JavaScript crawler sees it), or as extracted title, description, canonical link, robots, H1, JSON-LD, links and visible text. Copy and Download export the body.

Checks (`src/admin/responses/checks.js`), against `/api/admin/responses/context`, which returns the built profile and schema from the asset store, the review register and the expected résumé version:

- `/api/profile.json`: schema errors, missing fields, values that differ from the canonical profile, fields the canonical profile lacks, phrases a review item keeps out, and whether `profile.resume.version` names the published PDF. A published résumé is expected, not reported as drift.
- `/` and `/profile/`: title, description, canonical link, robots, Person JSON-LD against the profile, links to the résumé, `/profile/` and the API, and on `/profile/` every role's organisation and dates
- schema: equality with the deployed schema
- résumé PDF: content type and hash against the published (or bundled) version

## Security

- **Two layers.** Cloudflare Access protects `/admin/*` and `/api/admin/*`. Behind it, every admin page and API call verifies the Access JWT itself: `functions/admin/_middleware.js`, `functions/api/admin/_middleware.js`, and `adminRoute` in `functions/_lib/admin.js` on each handler. A misconfigured or bypassed Access application still cannot expose them.
- **JWT checks** (`src/photography-core/auth.js`, `functions/_lib/access.js`): RS256 only; the signature against the team's published keys (refetched once, at most every minute, when a token names an unknown key); audience `ACCESS_AUD`; issuer `https://ACCESS_TEAM_DOMAIN`; expiry; not-before (60 s skew); and the email in `ADMIN_EMAILS` (case-insensitive). The token is read only from the `Cf-Access-Jwt-Assertion` header Access sets, never from a cookie or the URL. A client can send that header, but cannot sign one. Malformed tokens are refused rather than raising errors. If `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` or `ADMIN_EMAILS` is unset, every request gets 503.
- **No static admin pages.** Pages matches Functions on the raw URL but serves assets from the decoded one, so a static `/admin/resume/index.html` could be fetched as `/%61dmin/resume/` past the middleware. The build therefore writes the admin HTML into `functions/_generated/admin-pages.js` (git-ignored) and removes it from `dist/`. `functions/admin/[[path]].js` serves it only after the middleware's check. The photography admin (`/photography/admin/`) and its SEO dashboard (`/photography/admin/seo/`, with `report.json`) follow the same rule: `scripts/build-seo-report.mjs` writes them into `functions/_generated/photography-seo.js`, and `functions/photography/admin/[[path]].js` verifies the Access JWT itself before serving them. The admin JavaScript and CSS bundles under `/assets/` are public, like every Vite bundle; they hold UI code only, no data or credentials.
- POST requests must carry this site's `Origin`. Publishing must be JSON naming the exact sha256, and conflicts must be acknowledged.
- Admin responses are `no-store` and `noindex`. Admin pages send a strict CSP and `frame-ancestors 'none'`. The private PDF preview can be framed only by this site.
- No credentials are in code or config; there is no public upload route, and there are no unpublished files in public storage.

## What the dashboard reports

The top card says what the public URL is serving right now, using the same rule as the public Function: the published version only if its file is in R2.

- **Bundled, nothing published:** a banner names the bundled version. The bundled PDF is checked against the canonical profile on every load. If it has conflicts, the banner reads "An outdated résumé is live" and lists them (today: Stony Brook "Present", among others).
- **Fallback:** a version is published but R2 is missing, unbound or unreadable. The banner reads "Fallback: the public URL is serving the bundled PDF, not the published version".
- **Live check:** the page fetches the public URL signed out, hashes the bytes, and confirms they match what should be live. It reports a stale deploy or cache otherwise.

## Production setup (once)

These change Cloudflare resources and are not run by the deploy workflow:

1. Create the private bucket: `npx wrangler r2 bucket create portfolio-resumes`. Do not attach a custom domain or enable r2.dev.
2. Apply the migration: `npx wrangler d1 migrations apply photography --remote`.
3. In Zero Trust → Access, add `atishaykasliwal.com/admin/*` and `atishaykasliwal.com/api/admin/*` to the existing application whose audience is `ACCESS_AUD` (same allow policy), so the AUD the Functions verify matches.
4. Deploy as usual. `wrangler.jsonc` binds `RESUMES`; the deploy fails if the bucket does not exist, so do step 1 first.

Everything runs on the Workers Free plan: PDF parsing happens in the browser and at build time, never in a Function (see Validation).

## Local checks

```sh
npm run test:resume          # validation, consistency, handlers, publish/restore, inspector checks
npm test                     # everything, including the build
npx wrangler d1 migrations apply photography --local
npx wrangler pages dev dist  # public routes against local D1/R2; admin routes need an Access JWT
```
