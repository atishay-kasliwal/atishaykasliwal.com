# GitHub feedback backend

Imports collaboration feedback into the existing `photography` D1 database and exposes an admin API for filtering, sentiment corrections, and CSV export. This implementation supplies the backend; it does not add a dashboard page.

## Import

Use Node.js 22 or later and a GitHub token with access to the source repositories, supplied through `GITHUB_TOKEN` or `gh auth login`.

```sh
# Validate the CSV and generate SQL without changing D1
npm run github:feedback:import -- /path/to/github_collaboration_feedback.csv --dry-run

# Apply local migrations and import into local D1
npm run github:feedback:import -- /path/to/github_collaboration_feedback.csv
```

The importer reads `collection_notes.json` beside the CSV if present; override it with `--notes /path/to/notes.json`. Account types, avatars, and repository visibility are cached in `.wrangler/github-feedback/github-cache.json`. Use `--refresh-github` to refresh those lookups.

Generated SQL and the cache stay in the git-ignored `.wrangler/` directory. Feedback may include private repositories. Do not commit the CSV, SQL, or exported data.

Re-imports match entries by URL, refresh content and automated suggestions, and retain existing manual labels when the input supplies automated labels. An input carrying manual labels replaces current labels. Imports are additive; omitting a previously imported entry does not delete it.

## Admin API

Every route requires a valid Cloudflare Access JWT and an email in `ADMIN_EMAILS`. Responses use `Cache-Control: no-store`. The existing `DB`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `ADMIN_EMAILS` bindings are reused.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/github-feedback/admin/entries` | Filtered counts and paginated entries |
| GET | `/api/github-feedback/admin/entries/:id` | Entry with sentiment edit history |
| PATCH | `/api/github-feedback/admin/entries/:id` | Correct or reset sentiment |
| GET | `/api/github-feedback/admin/facets` | Overall/received totals, repositories, authors, types, dates, last import |
| GET | `/api/github-feedback/admin/export` | All matching entries as CSV, ignoring pagination |

List and export accept `q`, `repository`, `owner`, `author`, `sentiment`, `attribution`, `type`, `visibility`, `from`, `to`, `own`, `descriptions`, and `source`. Multi-select filters accept repeated or comma-separated values. Dates are inclusive UTC days. `own` and `descriptions` accept `include`, `exclude`, or `only`. `source` accepts `auto` or `manual`. Pagination uses `limit` (1–500, default 50) and `offset`; `sort` is `newest` or `oldest`.

For example, `?own=exclude&descriptions=exclude&attribution=Human&sentiment=Negative` returns negative human feedback received from others, excluding thread descriptions. Counts describe matching entries, not unique reviewers. Bots are attributed to Organization independently of sentiment.

Send a correction as JSON:

```json
{"sentiment":"Positive","reason":"Explicit thanks for the fix."}
```

Or restore the automated suggestion with `{"reset":true}`. Corrections require a reason of 3–500 characters. The API records the editor from the verified Access token and retains edit history. Export includes current and suggested labels, reasons, attribution, and avatars and can be re-imported.

Clients must render feedback and titles as text, never raw HTML. CSV export guards spreadsheet formulas; the importer removes those guards on re-import.

## Production rollout

Before importing production data, configure Cloudflare Access to cover `/api/github-feedback/admin/*` using the configured audience and allowed email policy. Then apply the migration and import explicitly to the remote database:

```sh
npx wrangler d1 migrations apply photography --remote
npm run github:feedback:import -- /path/to/github_collaboration_feedback.csv --remote
```

Deploy the Pages Functions with the normal site deployment workflow. Local imports do not change production. The remote importer requires migrations to have been applied first.

## Comment-style display summaries

`0004_github_feedback_summaries.sql` adds a separate table for short editorial paraphrases. Source bodies, authors, URLs, attribution, sentiment labels, and edit history remain intact. List and detail responses include `summary: { text, kind: "paraphrase", omitReason, styleVersion, generatedAt }`, or `null` when there is no current summary. A source-body change automatically hides its previous summary until an updated one is imported. Unchanged source imports retain summaries.

The November 19 dataset has a local editorial export at `.wrangler/github-feedback/comment-summaries.json`, with a readable review copy at `.wrangler/github-feedback/comment-summaries.md`. All 1,351 entries are accounted for, including empty reviews and workflow-only items marked with `omitReason`. Short, already natural comments may retain their original wording. Longer comments have concise, constructive paraphrases that preserve objections and test limitations. These files include private data and remain git-ignored.

The JSON records retain `sourceBody` for exact freshness checks. They also identify author type, visibility, own entries, descriptions, and `publicCandidate`. That candidate flag selects public, written human feedback from other authors, excluding descriptions and omission markers. It does not select by sentiment. Bots and your own updates remain available in the complete dataset with their original identities.

```sh
# Validate and generate SQL
npm run github:feedback:summaries -- .wrangler/github-feedback/comment-summaries.json --dry-run

# Apply migrations and save the summaries locally
npm run github:feedback:summaries -- .wrangler/github-feedback/comment-summaries.json --local
```

To import remotely, apply migration 0004 first and use `--remote` explicitly. The command never generates or rewrites comments itself; it validates and loads the supplied editorial JSON. To edit a summary, change its `summary` text in that private JSON and import it again. `omitReason` must be `null` for displayable feedback and a short machine-readable reason for an intentional omission. Empty source feedback cannot acquire a written paraphrase.

Website consumers should label edited text as a paraphrase and retain the original author and source link. Hide entries with `omitReason`; render summary text with textContent. The original CSV export continues to export source feedback and sentiment data; the editorial JSON is the separate backup for summaries. No public feedback route or website section is added by this change.

## Verification

```sh
npm run test:github-feedback
npm test
```

Tests cover CSV parsing and export, SQL size limits, filters and counts, avatars and attribution, Access authorization, manual corrections and resets, re-import preservation, and export/re-import consistency. They use an in-memory SQLite adapter and signed test JWTs; they do not modify production.
