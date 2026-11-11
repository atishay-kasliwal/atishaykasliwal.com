# Portfolio SEO Optimization Summary

Date: 2026-09-27

## Goal

Improve technical SEO, crawlability, project-level discoverability, structured data, sitemap accuracy, and performance while preserving the approved visual design, visible homepage copy, and interactions.

## Before

- The sitemap listed five URLs: the homepage, résumé, and four project pages. Seven of the eleven portfolio projects had no dedicated page.
- The sitemap generator assigned the current build date to every URL. Generated project schema also received the current date as `dateModified`.
- The SEO CLI sitemap health pass found all five listed URLs returning HTTP 200. Its full live crawl found the Cloudflare email-obfuscation endpoint returning 404, which generated both a client-error and broken-internal-link finding. It also reported missing HSTS on the five crawled pages.
- Homepage metadata and structured data were already strong: canonical, social cards, `WebSite`, `ProfilePage`, `Person`, and an 11-item `ItemList` were present.
- Lighthouse on the deployed site: desktop performance 99, accessibility 98, best practices 100, SEO 100; mobile performance 85, accessibility 100, best practices 100, SEO 100.
- Mobile LCP was 4.23 s. Lighthouse estimated 736 KiB of mobile image-delivery savings and 835 KiB on desktop.

## Achieved

- Added seven prerendered project pages using the existing case-study template: Insurance Platform, FedTalk, Developer Profile, Atriveo Reel, Kaggriculture, Bayesian Marketing Mix, and InsureRaft. Content is limited to facts already in the repository. The original four pages and their visible navigation order were preserved.
- The sitemap now lists the homepage, résumé, and all eleven project pages. Per-URL `lastmod` and project `dateModified` values use verified source dates rather than build time.
- Connected the homepage project list to project-page entities with stable `@id` values. Project pages connect their `WebPage` and project entity, use an appropriate project type, and have their own 1200×630 social preview.
- Added an HSTS rule for Cloudflare Pages without `includeSubDomains`. Converted “Selected work” to an H2; its computed typeface, weight, spacing, and box dimensions match the original div.
- Added responsive WebP variants for project cards, the profile portrait, the Bayesian chart, and Reel stills. Original assets remain available for higher-density displays.
- Added SEO build checks, a pinned `seo` crawler, Lighthouse CI assertions, a scheduled/manual live crawl workflow, and image-variant generation. The changed implementation is documented in `README.md`.

## After

- Build validation reports 12 indexable HTML pages, eleven connected project entities, and thirteen sitemap URLs including the résumé. It checks metadata, canonical URLs, schema references, sitemap dates and assets, internal destinations, project-page inlinks, image alt text/dimensions, responsive-image widths, robots rules, social assets, and the Cloudflare header configuration.
- The final SEO CLI crawl against the local production preview returned HTTP 200 for all twelve requested pages: twelve indexable, zero failed, 23 observed internal links, and zero invalid JSON-LD.
- Lighthouse CI passed for the homepage, an existing case study, and a new project page. The direct final Lighthouse results were:

| Metric | Desktop before | Desktop after* | Mobile before | Mobile after* |
| --- | ---: | ---: | ---: | ---: |
| Performance | 99 | 100 | 85 | 98 |
| Accessibility | 98 | 98 | 100 | 100 |
| Best practices | 100 | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 | 100 |
| LCP | 0.91 s | 0.58 s | 4.23 s | 2.36 s |
| CLS | 0.0051 | 0.0074 | 0.0071 | 0.0071 |

*The baseline was measured on the deployed host; the final run used the local production build. Treat score and timing changes as indicative, not a strict same-host comparison. The remaining image-delivery estimate fell to 51 KiB desktop and 72 KiB mobile.

- `npm test`, the final Lighthouse CI assertions, workspace diagnostics, `git diff --check`, and `npm audit` passed. The dependency audit reported zero vulnerabilities.

## Still Left

- **Deployment:** These changes are in the working tree, not live. Deploy before expecting the new routes or HSTS header on the production domain, then rerun `npm run seo:sitemap:live` and `npm run seo:crawl:live` against production.
- **Homepage project links:** Resolved on 2026-10-01; see the follow-up below.
- **Cloudflare email protection:** The baseline crawler follows Cloudflare's transformed email link to `/cdn-cgi/l/email-protection` and receives a 404. The local preview cannot confirm a Cloudflare setting change; review Email Address Obfuscation in Cloudflare or decide whether its behavior should change.
- **Local-crawl caveat:** Vite preview returns success for two nonexistent-path probes, so the local SEO crawl reports a `soft_404`. The deployed Cloudflare site returned actual 404 responses with `noindex` when checked; confirm that again after deployment.
- **External search evidence:** Search Console is needed to confirm indexing, impressions, queries, clicks, and CTR. CrUX or real-user monitoring is needed for field Core Web Vitals; backlink and ranking visibility also need external data.
- **Lighthouse CI toolchain:** The workflow invokes `@lhci/cli@0.15.1` through `npx` rather than adding it to the app lockfile. Installing it as a project dependency surfaced ten development-toolchain advisories; the application dependency audit is clean.

## Main Files

- `src/case-studies/data.js` and `scripts/build-case-studies.mjs`: project content, page generation, structured data, and sitemap dates.
- `index.html` and `src/style.css`: connected homepage project schema and visually matched H2 semantics.
- `public/_headers`, `public/sitemap.xml`, and `scripts/render_og.py`: HSTS, generated sitemap, and project social cards.
- `scripts/validate-seo.mjs`, `scripts/generate-responsive-thumbnails.mjs`, `.lighthouserc.json`, and `.github/workflows/`: regression checks and automation.

## Project Discoverability and 404 Follow-up

- The eleven project cards are generated as `<button>` elements, not anchors. Their click handlers open a non-modal project preview; the active card is dynamically keyboard-focusable, and pointer dragging, hover previews, carousel movement, and keyboard navigation all operate on that card. Replacing a card with an anchor or nesting a link inside it changes native roles, activation keys, modifier/middle-click behavior, and drag-click handling. A zero-behavior-change guarantee is not credible, so no card markup or homepage link was changed. An HTML overlay link would also be an artificial/hidden link and is excluded.
- Static project graph from the built HTML: each project has one unique incoming project-page link, supplied by the previous project in its existing project navigation cycle. Each page also has two anchors back to `/` (top navigation and footer). The homepage has zero ordinary HTML anchors to project pages. No project page is orphaned within the project-page subgraph, but every project has weak discovery outside it because entry to that graph still relies on sitemap/structured data. Resolving this needs approval for a homepage UI change.
- Live Cloudflare probes returned HTTP 404 for `/this-page-does-not-exist`, `/projects/not-a-real-project`, and `/random-test-404`. The Cloudflare Pages emulator also returns HTTP 404 for each and serves the custom root `404.html`; that page is `noindex`, has no canonical, and links to `/`. Unknown routes are excluded from the sitemap.
- The email protection path itself returns 404, and the homepage response contains Cloudflare's `email-decode.min.js` plus hash-encoded email links. In a normal browser session, those links decode to the existing `mailto:katishay@gmail.com`. This is a Cloudflare obfuscation/crawler artifact, not a broken visible contact link; email protection was left enabled.
- The HSTS rule is present in `public/_headers` and is applied by the Cloudflare Pages emulator (`max-age=31536000`). The current public production response checked during this follow-up did not yet show HSTS, so the rule still needs deployment before production header verification. No subdomain or preload directive was added.
- The new desktop/mobile 404 design is a short `404 / Not found`, “Page not found.” and “Back home” link, using the existing Geist fonts, near-black background, muted technical label, violet accent, and hairline link. Screenshots were captured at 1440×900 and 375×812. The mobile layout has no horizontal or vertical overflow; the home anchor is keyboard focusable.
- After the 404 change, `npm test`, the Cloudflare Pages emulator checks, Lighthouse CI, `npm audit`, and `git diff --check` passed. Existing homepage/project UI and behavior were not changed.

## Homepage Links and Performance Follow-up (2026-10-01)

- **Baseline:** the SEO crawler, started from the homepage, reached 2 pages (home and Photography). The work and experience carousels were rendered by JavaScript into empty tracks, so the 11 project and 6 experience pages had no HTML link from the homepage, and the original and supplemental project pages formed two separate "Next" cycles. Lighthouse (mobile, median of 3) on the homepage: performance 86, accessibility 96, LCP 2.43 s, TBT 409 ms. The LCP image was a JavaScript-inserted carousel card.
- **Change:** the build prerenders both carousels with the same markup the browser uses (`src/carousel-cards.js`). Cards with a page are `<a href>` links; JavaScript keeps the preview on plain click, Enter and Space, and lets modified clicks open the page. The first active card's image has `fetchpriority="high"` and the other card images load lazily. Card images now carry their intrinsic dimensions. The homepage renders pixel-identically at 1440×900 and 390×844.
- **After:** the crawler reaches all 19 indexable pages, each one click from the homepage. Homepage Lighthouse: performance 99, accessibility 100, LCP 2.12 s, TBT 25 ms.
- **Experience pages:** lead photos were up to 714 KB. A 720px variant per photo, chosen through `srcset`, brought the Stony Brook research page from performance 89 / LCP 3.68 s to 98 / 2.27 s.
- **Contrast:** the case-study and experience footer text now uses the existing muted grey (#848480, about 5:1) instead of #747470 (4.02:1). The violet arrow glyphs (#8554ff, 4.23:1) are unchanged because they are the brand accent.
- **Regression checks:** `npm test` now fails if the homepage loses its HTML link to any project or experience page. Lighthouse CI covers five pages, including a supplemental project and an experience page, with thresholds raised to performance 0.85, accessibility 0.95, best practices 0.95, SEO 1.0, an LCP warning above 4 s, and a TBT warning above 300 ms.
