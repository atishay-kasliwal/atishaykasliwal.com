# Canonical profile: architecture

One source of truth for the public professional profile, rendered four ways: the `/profile/` page, the `/api/profile.json` API, the homepage `Person` structured data, and the open source section of `llms.txt`. Nothing is copied by hand between them, and `npm test` fails when they disagree.

## Where the facts live

The canonical profile is a composition, not a new copy of the content:

| Facts | Source file | Notes |
| --- | --- | --- |
| Projects | `src/case-studies/data.js`, `src/projects.js` | The case studies and homepage cards, as before |
| Work and education | `src/experience.js`, `src/experience-pages.js` | `experience.js` now also exports `slug`, `role`, `place`, `start` and `end` |
| Open source | `src/profile/open-source-contributions.json` | Snapshot from the GitHub API; see below |
| Identity, skills, strengths, specializations | `src/profile/data.js` | The only facts that exist nowhere else |
| Known conflicts | `src/profile/review.js` | Internal; never published |

`src/profile/build.js` reads all of these and returns the canonical object (`buildProfile()`), plus `personJsonLd()` for structured data. It is pure and deterministic: no build timestamps, so the same sources always give byte-identical JSON. It throws on any evidence reference that does not resolve, so a typo cannot publish an unsupported claim.

## What is generated

`scripts/build-profile-page.mjs` runs from `vite.config.js` on every build and dev start, like the case-study and experience generators:

- `profile/index.html` → `/profile/` (git-ignored, like `projects/` and `experience/`)
- `public/api/profile.json` → `/api/profile.json`, minified, and `public/api/profile.schema.json` from `src/profile/profile.schema.json` (git-ignored)
- the block between `<!-- profile:open-source:start -->` and `<!-- profile:open-source:end -->` in `public/llms.txt`; the rest of `llms.txt` stays hand-written
- a sitemap entry for `/profile/`

The `canonical-person` plugin in `vite.config.js` replaces the homepage's `Person` node with `personJsonLd()` and sets the homepage `ProfilePage.dateModified` from `staticPageLastModified.homepage`. The Beyond the Resume page uses the same function. The `prerender-carousels` plugin now also prerenders the open source carousel, and writes each carousel's first caption and total count, so raw HTML no longer shows a stale `01 / 06` or an old merged count.

The profile is generated statically. `functions/api/profile.json.js` serves the built file and swaps in only the résumé reference (`profile.resume.version`) when a résumé has been published from `/admin/resume/`; if D1 is unreadable it serves the file unchanged. It sets `application/json`, a one-minute cache with background refresh, an ETag and `Access-Control-Allow-Origin: *` itself, since `_headers` does not apply to Functions. See [resume-admin.md](resume-admin.md). Unknown paths return the site's 404. The API is a convenience for tools and agents, not an applicant tracking system standard.

## Evidence and verification status

Every skill, strength, metric, project and contribution names its evidence. A skill reads as a chain: **skill → where it was used (project, role or contribution) → what was built → evidence ids**, and every evidence id resolves to an entry in the top-level `evidence` array with a URL.

`verificationStatus` is derived by `build.js` from the evidence; it is never written by hand:

| Status | Meaning | Used for |
| --- | --- | --- |
| `verified` | Checked against the primary public source when the data was generated | Pull requests (GitHub's own `merged` flag), public reviews, the merged-PR achievement |
| `publicly_verifiable` | Linked to a public artifact anyone can inspect (repository, merged PR, live product) | Skills and strengths with such evidence; project stats traced to a public repository file |
| `self_reported` | The candidate's own account, with no public artifact | Employer metrics, skills that rest only on employer work or the résumé, private or unlinked repositories |
| `needs_review` | Sources disagree | Not published as fact; see `review.js` |

Skills are never `verified`: a merged pull request proves the change landed, not a proficiency level. No proficiency levels or years-of-experience figures are generated.

### Professional strengths

`professionalStrengths` in `data.js` lists only strengths with evidence. The requested taxonomy entries that have none (presentations, conflict resolution, working with product managers and designers, and others) are listed in `UNSUPPORTED_STRENGTHS` and published nowhere. Two rules are enforced by tests: mentoring must rest on documented experience, never on code contributions, and a leadership strength resting only on personal projects must say it is not people leadership.

## Open source snapshot

`npm run profile:contributions` (`scripts/fetch-open-source-contributions.mjs`) asks GitHub's GraphQL API for every pull request by `atishay-kasliwal` in repositories he does not own, and every pull request by others he reviewed. `merged` means GitHub returned `merged: true`; anything else is `open` or `closed_unmerged`. The deploy workflow refreshes it before each build and keeps the committed file if GitHub is unavailable. The homepage cards (`src/open-source.js`) take their merged counts from the same file.

When new merged work arrives in a repository that `contributionSkills` in `data.js` does not know, the build still succeeds (so a deploy is never blocked) and `npm test` fails until the repository is mapped.

## Conflicts and manual review

`src/profile/review.js` records every disagreement found between the site, the résumé PDF, `llms.txt`, structured data and READMEs, with the values from each source:

- **resolved**: evidence settles it, and the profile uses the settled value (for example the Stony Brook end date, May 2026, confirmed by Atishay on 2026-11-19, which the older PDF still shows as Present).
- **needs_review**: evidence does not settle it. The profile publishes only what all sources agree on, or leaves it out, and `mustNotAppear` lists phrases the validator keeps out of the profile until someone decides.

The validator prints every open item as a manual-review warning on each run.

## Checks

| Command | Covers |
| --- | --- |
| `npm run validate:profile` (in `npm test`) | A: raw HTML of `/` and `/profile/`; C: the API against its schema and evidence; D: consistency of JSON, `/profile/`, Person JSON-LD, experience and project pages, `llms.txt`, homepage cards, review items and the résumé PDF (if `pdftotext` is installed); E: discovery from the homepage by links only |
| `npm run test:profile` (in `npm test`) | Unit tests for the builder, schema, status rules and strengths, plus tampered builds that the validator must reject |
| `npm run test:profile:browser` | B: `/` and `/profile/` in Chrome with JavaScript disabled at 1440 and 390 px, and the API's HTTP behaviour. Set `PROFILE_BASE_URL=https://atishaykasliwal.com` after a deploy to also check the production headers |
| `node scripts/extraction-report.mjs [dist]` | What a link-following, non-JavaScript agent can extract from a build; used for before/after comparisons |

## Changing the profile

- **A project, role or degree:** edit its existing data file. The profile, API and checks follow on the next build.
- **A skill:** add it to `skills` in `data.js` with at least one `{ ref, note }`. Refs are `project:<slug>`, `experience:<slug>`, `education:<slug>`, `contributions:<owner/repo>`, `reviews:github`, `repository:<id>` or `resume`. The note says what was built, in words already published.
- **A strength:** add it only with evidence; otherwise leave it in `UNSUPPORTED_STRENGTHS`.
- **A conflict:** add it to `review.js` with the values from each source, and `mustNotAppear` for any phrase that must stay out.
- **Anything in `data.js`:** bump `PROFILE_LAST_MODIFIED`.
- **A breaking change to the JSON:** raise the major `schemaVersion` and update `profile.schema.json`. Additive changes keep `1.x` (1.1 added `profile.resume.version`).
- **The résumé PDF:** publish it from `/admin/resume/` ([resume-admin.md](resume-admin.md)); no source change or rebuild is needed. Replacing `public/Atishay-Kasliwal-Resume.pdf` changes only the fallback served when nothing is published.
