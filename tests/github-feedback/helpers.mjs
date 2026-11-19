import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { stringifyCsv } from "../../src/github-feedback-core/csv.js";
import { buildImportSql, CSV_COLUMNS, normalizeRows } from "../../src/github-feedback-core/records.js";
import { parseCsvObjects } from "../../src/github-feedback-core/csv.js";

// The subset of the D1 API the feedback code uses, backed by an in-memory SQLite database
// with the real migration applied, so queries, constraints, and the view all run for real.
export function memoryD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(readFileSync(new URL("../../migrations/0003_github_feedback.sql", import.meta.url), "utf8"));
  sqlite.exec(readFileSync(new URL("../../migrations/0004_github_feedback_summaries.sql", import.meta.url), "utf8"));
  const statement = (sql, binds = []) => ({
    bind: (...values) => statement(sql, values),
    all: async () => ({ results: sqlite.prepare(sql).all(...binds).map(row => ({ ...row })) }),
    first: async () => {
      const row = sqlite.prepare(sql).get(...binds);
      return row ? { ...row } : null;
    },
    run: async () => {
      const info = sqlite.prepare(sql).run(...binds);
      return { meta: { changes: Number(info.changes) } };
    },
  });
  return {
    sqlite,
    prepare: sql => statement(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const item of statements) results.push(await item.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export function csvRow(overrides = {}) {
  return {
    "Sentiment": "Neutral",
    "Date (UTC)": "2026-11-03T10:00:00Z",
    "Repository": "acme/widgets",
    "Repository owner": "acme",
    "Type": "Issue / PR comment",
    "Author": "reviewer-one",
    "Accountability": "Human",
    "Your own entry": "No",
    "Review state": "",
    "Thread title": "Add a widget",
    "Feedback": "Could you add a test?",
    "URL": "https://github.com/acme/widgets/pull/7#issuecomment-1",
    "Thread URL": "https://github.com/acme/widgets/pull/7",
    "File": "",
    "Line": "",
    "Updated (UTC)": "",
    "Base sentiment": "Neutral",
    "Sentiment reason": "No explicit positive or negative signal; classified as Neutral.",
    ...overrides,
  };
}

// A small dataset covering every type, both attributions, own entries, and a private repo.
export function fixtureRows() {
  const thread = "https://github.com/acme/widgets/pull/7";
  const issue = "https://github.com/me/private-tool/issues/3";
  return [
    csvRow({ "Type": "Pull request description", "Author": "me", "Your own entry": "Yes", "Review state": "open", "URL": thread, "Feedback": "- adds widgets\n- fixes \"quotes\", commas", "Sentiment reason": "Thread description provides context; classified as Neutral.", "Date (UTC)": "2026-11-01T09:00:00Z" }),
    csvRow({ "Type": "Pull request review", "Review state": "APPROVED", "URL": `${thread}#pullrequestreview-10`, "Feedback": "", "Sentiment": "Positive", "Base sentiment": "Positive", "Sentiment reason": "GitHub review approval.", "Date (UTC)": "2026-11-02T09:00:00Z" }),
    csvRow({ "Type": "Pull request review", "Review state": "CHANGES_REQUESTED", "Author": "reviewer-two", "URL": `${thread}#pullrequestreview-11`, "Feedback": "This is a blocker: 100% of tests fail_here", "Sentiment": "Negative", "Base sentiment": "Negative", "Sentiment reason": "GitHub review explicitly requests changes; assessment of the contribution, not the person.", "Date (UTC)": "2026-11-04T09:00:00Z" }),
    csvRow({ "Type": "Inline review comment", "URL": `${thread}#discussion_r12`, "File": "src/widget.js", "Line": "42", "Feedback": "nit: rename", "Date (UTC)": "2026-11-05T09:00:00Z" }),
    csvRow({ "Author": "helper[bot]", "Accountability": "Human", "URL": `${thread}#issuecomment-13`, "Feedback": "Thanks for the PR! Deploy succeeded.", "Sentiment": "Positive", "Base sentiment": "Positive", "Sentiment reason": "Explicit thanks, praise, acceptance, or positive confirmation.", "Date (UTC)": "2026-11-06T09:00:00Z" }),
    csvRow({ "Author": "me", "Your own entry": "Yes", "URL": `${thread}#issuecomment-14`, "Feedback": "=SUM(A1) done", "Date (UTC)": "2026-11-07T09:00:00Z", "Updated (UTC)": "2026-11-07T10:00:00Z" }),
    csvRow({ "Type": "Issue description", "Repository": "me/private-tool", "Repository owner": "me", "Thread title": "Private bug", "Author": "me", "Your own entry": "Yes", "Review state": "closed", "URL": issue, "Thread URL": issue, "Feedback": "secret details", "Sentiment reason": "Thread description provides context; classified as Neutral.", "Date (UTC)": "2026-11-08T09:00:00Z" }),
    csvRow({ "Repository": "me/private-tool", "Repository owner": "me", "Thread title": "Private bug", "Author": "reviewer-two", "URL": `${issue}#issuecomment-15`, "Thread URL": issue, "Feedback": "Got it, thanks for reporting.", "Date (UTC)": "2026-11-09T09:00:00Z" }),
  ];
}

export const fixtureAccounts = () => new Map([
  ["me", { login: "me", type: "User", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4", profileUrl: "https://github.com/me" }],
  ["acme", { login: "acme", type: "Organization", avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4", profileUrl: "https://github.com/acme" }],
  ["reviewer-one", { login: "reviewer-one", type: "User", avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4", profileUrl: "https://github.com/reviewer-one" }],
  ["reviewer-two", { login: "reviewer-two", type: "User", avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4", profileUrl: "https://github.com/reviewer-two" }],
  ["helper[bot]", { login: "helper[bot]", type: "Bot", avatarUrl: "https://avatars.githubusercontent.com/in/5?v=4", profileUrl: "https://github.com/apps/helper" }],
]);

export const fixtureRepositories = () => new Map([
  ["acme/widgets", { fullName: "acme/widgets", owner: "acme", visibility: "public" }],
  ["me/private-tool", { fullName: "me/private-tool", owner: "me", visibility: "private" }],
]);

// Round-trips the rows through CSV text and the importer, exactly as the import script does.
export async function importRows(db, rows, now = "2026-11-19T00:00:00.000Z") {
  const { records: raw } = parseCsvObjects(stringifyCsv(CSV_COLUMNS, rows).replace(/^﻿/, ""));
  const { records, errors } = normalizeRows(raw);
  if (errors.length) throw new Error(errors.join("\n"));
  const sql = await buildImportSql({
    records,
    accounts: fixtureAccounts(),
    repositories: fixtureRepositories(),
    importRun: { id: `import-${now}`, sourceFile: "fixture.csv", periodStart: "2026-11-01T04:00:00Z", periodEnd: now },
    now,
  });
  db.sqlite.exec(sql);
  return records;
}
