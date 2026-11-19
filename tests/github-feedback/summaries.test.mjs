import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSummarySql, SUMMARY_STYLE, validateSummaries } from "../../src/github-feedback-core/summaries.js";
import { getEntry, listEntries, parseFilters } from "../../src/github-feedback-core/store.js";
import { fixtureRows, importRows, memoryD1 } from "./helpers.mjs";

const payload = entries => ({ styleVersion: SUMMARY_STYLE, entries });
const list = db => listEntries(db, parseFilters(new URLSearchParams()));

test("paraphrases preserve source and labels, survive unchanged reimports, and hide when source changes", async () => {
  const db = memoryD1();
  const rows = fixtureRows();
  await importRows(db, rows);
  const before = await list(db);
  const entry = before.entries.find(item => item.body === "nit: rename");
  db.sqlite.exec(buildSummarySql(payload([{ id: entry.id, sourceBody: entry.body, summary: "Could we use a clearer name here?", omitReason: null }])));
  const detail = await getEntry(db, entry.id);
  assert.equal(detail.summary.text, "Could we use a clearer name here?");
  assert.equal(detail.summary.kind, "paraphrase");
  assert.equal(detail.body, entry.body);
  assert.deepEqual(detail.sentiment, entry.sentiment);
  assert.deepEqual((await list(db)).counts, before.counts);
  assert.equal((await list(db)).entries.find(item => item.id === entry.id).summary.text, detail.summary.text);
  await importRows(db, rows, "2026-11-20T00:00:00.000Z");
  assert.equal((await getEntry(db, entry.id)).summary.text, detail.summary.text);
  rows[3].Feedback = "New feedback with a different meaning.";
  await importRows(db, rows, "2026-11-21T00:00:00.000Z");
  assert.equal((await getEntry(db, entry.id)).summary, null);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM gh_feedback_summaries").get().n, 1);
});

test("empty reviews have omission markers and cannot gain fabricated written comments", async () => {
  const db = memoryD1();
  await importRows(db, fixtureRows());
  const entry = (await list(db)).entries.find(item => item.body === "");
  const input = { id: entry.id, sourceBody: "", summary: "", omitReason: "empty_review" };
  db.sqlite.exec(buildSummarySql(payload([input])));
  assert.equal((await getEntry(db, entry.id)).summary.omitReason, "empty_review");
  assert.throws(() => validateSummaries(payload([{ ...input, summary: "Great work!" }])), /empty feedback/);
  assert.throws(() => validateSummaries(payload([{ ...input, omitReason: null }])), /omission reason/);
  assert.throws(() => validateSummaries(payload([input, input])), /duplicate/);
});

test("large source bodies round-trip through D1-sized summary statements without losing emoji or quotes", async () => {
  const db = memoryD1();
  const rows = fixtureRows();
  rows[3].Feedback = "😀'".repeat(35_000);
  await importRows(db, rows);
  const entry = (await list(db)).entries.find(item => item.body === rows[3].Feedback);
  const input = payload([{ id: entry.id, sourceBody: entry.body, summary: "Could we use a clearer name here?", omitReason: null }]);
  db.sqlite.exec(buildSummarySql(input));
  assert.equal((await getEntry(db, entry.id)).summary.text, input.entries[0].summary);
  assert.equal(db.sqlite.prepare("SELECT source_body FROM gh_feedback_summaries").get().source_body, entry.body);
});
