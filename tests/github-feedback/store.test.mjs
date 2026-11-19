import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsvObjects } from "../../src/github-feedback-core/csv.js";
import { normalizeRows } from "../../src/github-feedback-core/records.js";
import { exportCsv, getEntry, getFacets, listEntries, parseFilters, updateSentiment } from "../../src/github-feedback-core/store.js";
import { fixtureRows, importRows, memoryD1 } from "./helpers.mjs";

const list = (db, query = "") => listEntries(db, parseFilters(new URLSearchParams(query)));

async function seeded() {
  const db = memoryD1();
  await importRows(db, fixtureRows());
  return db;
}

test("counts come from the imported entries", async () => {
  const db = await seeded();
  const { counts, total, entries } = await list(db);
  assert.deepEqual(counts, { entries: 8, Positive: 2, Neutral: 5, Negative: 1 });
  assert.equal(total, 8);
  assert.equal(entries[0].createdAt, "2026-11-09T09:00:00Z", "newest first");
  const facets = await getFacets(db);
  assert.deepEqual(facets.totals, counts);
  // Received = someone else's entries, thread descriptions excluded.
  assert.deepEqual(facets.received, { entries: 5, Positive: 2, Neutral: 2, Negative: 1 });
  assert.equal(facets.lastImport.rows, 8);
  assert.deepEqual(facets.dateRange, { first: "2026-11-01T09:00:00Z", last: "2026-11-09T09:00:00Z" });
});

test("entries carry avatars for the author and the repository owner, including bots", async () => {
  const db = await seeded();
  const { entries } = await list(db, "author=helper[bot]");
  assert.equal(entries.length, 1);
  const [bot] = entries;
  assert.equal(bot.attribution, "Organization");
  assert.equal(bot.sentiment.label, "Positive", "sentiment is independent of attribution");
  assert.equal(bot.author.type, "Bot");
  assert.equal(bot.author.avatarUrl, "https://avatars.githubusercontent.com/in/5?v=4");
  assert.equal(bot.repository.owner.login, "acme");
  assert.equal(bot.repository.owner.avatarUrl, "https://avatars.githubusercontent.com/u/2?v=4");
  assert.equal(bot.url, "https://github.com/acme/widgets/pull/7#issuecomment-13");
  assert.equal(bot.thread.title, "Add a widget");
});

test("every filter narrows the set and counts follow the filter", async () => {
  const db = await seeded();
  const cases = {
    "repository=me/private-tool": 2,
    "owner=acme": 6,
    "author=reviewer-two": 2,
    "sentiment=Positive,Negative": 3,
    "attribution=Organization": 1,
    "type=review": 2,
    "type=review_comment": 1,
    "from=2026-11-04&to=2026-11-06": 3,
    "to=2026-11-01": 1,
    "own=exclude": 5,
    "own=only": 3,
    "descriptions=exclude": 6,
    "own=exclude&descriptions=exclude": 5,
    "visibility=public": 6,
    "q=blocker": 1,
    "q=PRIVATE BUG": 2,
    "q=100%": 1,
    "q=%": 1,
    "q=fail_here": 1,
    "q=fail%here": 0,
  };
  for (const [query, expected] of Object.entries(cases)) {
    const { total, entries } = await list(db, query);
    assert.equal(total, expected, query);
    assert.equal(entries.length, expected, query);
  }
  const negative = await list(db, "own=exclude&descriptions=exclude&sentiment=Negative");
  assert.deepEqual(negative.counts, { entries: 1, Positive: 0, Neutral: 0, Negative: 1 });
});

test("paging and sort order", async () => {
  const db = await seeded();
  const page = await list(db, "sort=oldest&limit=3&offset=3");
  assert.equal(page.total, 8);
  assert.deepEqual(page.entries.map(entry => entry.createdAt.slice(8, 10)), ["05", "06", "07"]);
});

test("a manual correction is stored with its reason, logged, and can be reset", async () => {
  const db = await seeded();
  const [entry] = (await list(db, "author=reviewer-one&type=review_comment")).entries;
  assert.equal(entry.sentiment.reason, "No explicit positive or negative signal; classified as Neutral.");

  await assert.rejects(updateSentiment(db, entry.id, { sentiment: "Glowing", reason: "x" }, { editor: "me@example.com" }), /sentiment must be/);
  await assert.rejects(updateSentiment(db, entry.id, { sentiment: "Positive", reason: " " }, { editor: "me@example.com" }), /reason must be/);
  await assert.rejects(updateSentiment(db, "0".repeat(24), { sentiment: "Positive", reason: "fine" }, {}), /unknown entry/);
  await assert.rejects(updateSentiment(db, "'; DROP TABLE gh_feedback; --", { sentiment: "Positive", reason: "fine" }, {}), /unknown entry/);

  const edited = await updateSentiment(db, entry.id, { sentiment: "Negative", reason: "Reviewer flags a real naming problem." }, { editor: "me@example.com", now: "2026-11-19T12:00:00.000Z" });
  assert.deepEqual(edited.sentiment, {
    label: "Negative",
    reason: "Reviewer flags a real naming problem.",
    source: "manual",
    suggested: "Neutral",
    suggestedReason: "No explicit positive or negative signal; classified as Neutral.",
    editedAt: "2026-11-19T12:00:00.000Z",
    editedBy: "me@example.com",
  });
  assert.equal(edited.history.length, 1);
  assert.equal(edited.history[0].previousSentiment, "Neutral");
  assert.deepEqual((await list(db)).counts, { entries: 8, Positive: 2, Neutral: 4, Negative: 2 });
  assert.equal((await list(db, "source=manual")).total, 1);

  const reset = await updateSentiment(db, entry.id, { reset: true }, { editor: "me@example.com", now: "2026-11-19T13:00:00.000Z" });
  assert.equal(reset.sentiment.label, "Neutral");
  assert.equal(reset.sentiment.source, "auto");
  assert.equal(reset.sentiment.reason, reset.sentiment.suggestedReason);
  assert.equal((await getEntry(db, entry.id)).history.length, 2);
});

test("re-importing is idempotent and keeps manual corrections", async () => {
  const db = await seeded();
  const [entry] = (await list(db, "author=reviewer-one&type=review_comment")).entries;
  await updateSentiment(db, entry.id, { sentiment: "Positive", reason: "Helpful suggestion." }, { editor: "me@example.com" });
  const rows = fixtureRows();
  rows[3].Feedback = "nit: rename (edited on GitHub)";
  await importRows(db, rows, "2026-11-20T00:00:00.000Z");
  const after = await getEntry(db, entry.id);
  assert.equal(after.body, "nit: rename (edited on GitHub)", "content refreshes");
  assert.equal(after.sentiment.label, "Positive", "manual label survives");
  assert.equal(after.sentiment.reason, "Helpful suggestion.");
  assert.equal((await list(db)).total, 8, "no duplicates");
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM gh_threads").get().n, 2);
});

test("export includes corrected labels and re-imports to the same data", async () => {
  const db = await seeded();
  const [entry] = (await list(db, "author=reviewer-two&type=review")).entries;
  await updateSentiment(db, entry.id, { sentiment: "Neutral", reason: "Requested changes politely; routine." }, { editor: "me@example.com" });

  const { csv, rows } = await exportCsv(db, parseFilters(new URLSearchParams("own=exclude&descriptions=exclude")));
  assert.equal(rows, 5);
  const { records: exported } = parseCsvObjects(csv);
  const corrected = exported.find(row => row.URL === entry.url);
  assert.equal(corrected.Sentiment, "Neutral");
  assert.equal(corrected["Base sentiment"], "Negative");
  assert.equal(corrected["Sentiment reason"], "Requested changes politely; routine.");
  assert.equal(corrected["Sentiment source"], "manual");
  assert.equal(corrected["Author avatar"], "https://avatars.githubusercontent.com/u/4?v=4");
  assert.ok(exported.every(row => row["Your own entry"] === "No"));

  const { records, errors } = normalizeRows(exported);
  assert.deepEqual(errors, []);
  const reimported = records.find(record => record.url === entry.url);
  assert.equal(reimported.sentimentSource, "manual");
  assert.equal(reimported.suggestedSentiment, "Negative");
  assert.equal(reimported.suggestedReason, "GitHub review explicitly requests changes; assessment of the contribution, not the person.");

  // A fresh database loaded from the export ends up with the same labels.
  const copy = memoryD1();
  const { records: allExported } = parseCsvObjects((await exportCsv(db, parseFilters(new URLSearchParams()))).csv);
  await importRows(copy, allExported);
  assert.deepEqual((await list(copy)).counts, (await list(db)).counts);
  const own = (await list(copy, "author=me&type=comment")).entries[0];
  assert.equal(own.body, "=SUM(A1) done", "formula guard is removed on import");
});
