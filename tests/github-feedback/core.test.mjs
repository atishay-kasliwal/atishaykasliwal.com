import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseCsvObjects, stringifyCsv } from "../../src/github-feedback-core/csv.js";
import { buildImportSql, feedbackId, normalizeRow, normalizeRows, parseThreadUrl } from "../../src/github-feedback-core/records.js";
import { buildWhere, FeedbackRequestError, parseFilters } from "../../src/github-feedback-core/store.js";
import { csvRow, fixtureAccounts, fixtureRepositories } from "./helpers.mjs";

test("parses quoted fields with commas, quotes, CRLF, newlines, and a BOM", () => {
  const text = '﻿a,b,c\r\n"x, y","say ""hi""","line 1\nline 2"\r\nplain,,end\n';
  assert.deepEqual(parseCsv(text), [["a", "b", "c"], ["x, y", 'say "hi"', "line 1\nline 2"], ["plain", "", "end"]]);
  assert.throws(() => parseCsv('a\n"open'), /quoted field/);
  assert.throws(() => parseCsvObjects("a,b\n1,2,3\n"), /row 2 has 3 fields/);
});

test("CSV export round-trips text and neutralises spreadsheet formulas", () => {
  const records = [{ A: "=HYPERLINK(\"x\")", B: "- markdown list\n- two", C: "plain, with comma" }];
  const csv = stringifyCsv(["A", "B", "C"], records);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`), "formula cell is prefixed with an apostrophe");
  const [parsed] = parseCsvObjects(csv).records;
  assert.equal(parsed.A, "'=HYPERLINK(\"x\")");
  assert.equal(parsed.C, "plain, with comma");
  // The importer strips the guard again.
  const row = normalizeRow(csvRow({ Feedback: parsed.B }), 2);
  assert.equal(row.body, "- markdown list\n- two");
});

test("thread URLs give the repository, kind, and number", () => {
  assert.deepEqual(parseThreadUrl("https://github.com/acme/widgets/pull/7"), { owner: "acme", repository: "acme/widgets", kind: "pull_request", number: 7 });
  assert.equal(parseThreadUrl("https://github.com/NVIDIA/OpenShell/discussions/5594").kind, "discussion");
  assert.equal(parseThreadUrl("https://example.com/acme/widgets/pull/7"), null);
});

test("ids are stable 24-character hashes of the URL", async () => {
  const id = await feedbackId("https://github.com/acme/widgets/pull/7");
  assert.match(id, /^[a-f0-9]{24}$/);
  assert.equal(id, await feedbackId("https://github.com/acme/widgets/pull/7"));
});

test("automated accounts are Organization feedback; sentiment stays as labelled", () => {
  const bot = normalizeRow(csvRow({ Author: "helper[bot]", Accountability: "Human", Sentiment: "Positive", "Base sentiment": "Positive" }), 2);
  assert.equal(bot.attribution, "Organization");
  assert.equal(bot.sentiment, "Positive");
  assert.equal(bot.repositoryOwner, "acme");
  const human = normalizeRow(csvRow(), 2);
  assert.equal(human.attribution, "Human");
  assert.equal(human.sentimentSource, "auto");
});

test("review states and thread states are kept apart", () => {
  const review = normalizeRow(csvRow({ Type: "Pull request review", "Review state": "CHANGES_REQUESTED" }), 2);
  assert.equal(review.reviewState, "CHANGES_REQUESTED");
  assert.equal(review.threadState, null);
  const description = normalizeRow(csvRow({ Type: "Pull request description", "Review state": "closed", URL: "https://github.com/acme/widgets/pull/7" }), 2);
  assert.equal(description.reviewState, null);
  assert.equal(description.threadState, "closed");
  assert.equal(description.isThreadDescription, true);
});

test("a label that differs from the suggestion imports as a manual correction", () => {
  const row = normalizeRow(csvRow({ Sentiment: "Positive", "Base sentiment": "Neutral", "Sentiment reason": "Maintainer praised the fix." }), 2);
  assert.equal(row.sentimentSource, "manual");
  assert.equal(row.sentiment, "Positive");
  assert.equal(row.suggestedSentiment, "Neutral");
  assert.equal(row.sentimentReason, "Maintainer praised the fix.");
});

test("invalid rows are all reported, with row numbers", () => {
  const { records, errors } = normalizeRows([
    csvRow(),
    csvRow({ Sentiment: "Great" }),
    csvRow({ "Thread URL": "https://github.com/acme/widgets/tree/main" }),
    csvRow({ Repository: "other/repo" }),
    csvRow({ "Date (UTC)": "Nov 3" }),
    csvRow(),
  ]);
  assert.equal(records.length, 1);
  assert.equal(errors.length, 5);
  assert.match(errors[0], /^Row 3: Sentiment/);
  assert.match(errors[4], /^Row 7: duplicate URL, first seen on row 2/);
});

test("very long bodies are split so every statement fits D1's limit", async () => {
  const body = "😀".repeat(30_000) + "x".repeat(25_000);
  const record = normalizeRow(csvRow({ Feedback: body }), 2);
  const sql = await buildImportSql({
    records: [record],
    accounts: fixtureAccounts(),
    repositories: fixtureRepositories(),
    importRun: { id: "i", sourceFile: "f.csv" },
    now: "2026-11-19T00:00:00.000Z",
  });
  const statements = sql.trim().split("\n");
  assert.ok(statements.some(statement => statement.startsWith("UPDATE gh_feedback SET body = body ||")));
  for (const statement of statements) assert.ok(new TextEncoder().encode(statement).length < 100_000);
});

test("filters are validated and become parameterised SQL", () => {
  const filters = parseFilters(new URLSearchParams("q=100%_done&repository=acme/widgets,me/tool&sentiment=Positive&sentiment=Negative&own=exclude&descriptions=exclude&from=2026-11-01&to=2026-11-05&type=review"));
  const { clause, binds } = buildWhere(filters);
  assert.match(clause, /repository IN \(\?, \?\)/);
  assert.match(clause, /is_own = 0/);
  assert.match(clause, /is_thread_description = 0/);
  assert.ok(binds.includes("%100\\%\\_done%"), "LIKE wildcards in the search are escaped");
  assert.ok(binds.includes("2026-11-06T00:00:00Z"), "the to date is inclusive");
  assert.ok(!clause.includes("acme"), "values are bound, never interpolated");

  for (const bad of ["sentiment=Great", "attribution=Bot", "type=commit", "repository=../etc", "author=a%27b", "from=2026-13-01", "from=2026-02-30", "to=2026-11-31", "own=maybe", "limit=0", "limit=501", "from=2026-11-05&to=2026-11-01"]) {
    assert.throws(() => parseFilters(new URLSearchParams(bad)), FeedbackRequestError, bad);
  }
  const many = new URLSearchParams(Array.from({ length: 91 }, (_, i) => `author=user${i}`).join("&"));
  assert.throws(() => buildWhere(parseFilters(many)), /too many filter values/);
});
