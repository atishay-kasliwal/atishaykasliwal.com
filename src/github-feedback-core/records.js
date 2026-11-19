// Turns rows of github_collaboration_feedback.csv into validated records and the SQL that loads
// them into D1. The same column names are used for export, so an exported file re-imports.
import { unguardFormula } from "./csv.js";

export const SENTIMENTS = ["Positive", "Neutral", "Negative"];
export const ATTRIBUTIONS = ["Human", "Organization"];
export const REVIEW_STATES = ["APPROVED", "CHANGES_REQUESTED", "COMMENTED", "DISMISSED"];
export const VISIBILITIES = ["public", "private", "internal", "unknown"];

export const FEEDBACK_TYPES = {
  pull_request_description: "Pull request description",
  issue_description: "Issue description",
  discussion_description: "Discussion description",
  comment: "Issue / PR comment",
  review: "Pull request review",
  review_comment: "Inline review comment",
};
const TYPE_BY_LABEL = Object.fromEntries(Object.entries(FEEDBACK_TYPES).map(([key, label]) => [label, key]));
export const DESCRIPTION_TYPES = new Set(["pull_request_description", "issue_description", "discussion_description"]);

export const CSV_COLUMNS = [
  "Sentiment", "Date (UTC)", "Repository", "Repository owner", "Type", "Author", "Accountability",
  "Your own entry", "Review state", "Thread title", "Feedback", "URL", "Thread URL", "File", "Line",
  "Updated (UTC)", "Base sentiment", "Sentiment reason",
];
// Extra export columns. The importer reads "Sentiment source" and "Suggested reason" back.
export const EXPORT_COLUMNS = [
  ...CSV_COLUMNS,
  "Sentiment source", "Suggested reason", "Sentiment edited at", "Author type", "Author avatar",
  "Repository owner avatar", "Repository visibility",
];

const THREAD_URL = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/(pull|issues|discussions)\/(\d+)$/;
const KIND_BY_PATH = { pull: "pull_request", issues: "issue", discussions: "discussion" };
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const isBotLogin = login => /\[bot\]$/.test(login);

export function parseThreadUrl(url) {
  const match = THREAD_URL.exec(url);
  if (!match) return null;
  return { owner: match[1], repository: `${match[1]}/${match[2]}`, kind: KIND_BY_PATH[match[3]], number: Number(match[4]) };
}

export async function feedbackId(url) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

// Validates one CSV row and returns a record, or throws with the row number and the problem.
export function normalizeRow(raw, rowNumber) {
  const fail = message => {
    throw new Error(`Row ${rowNumber}: ${message}`);
  };
  const get = column => {
    const value = raw[column];
    return value === undefined ? "" : String(value);
  };
  const url = get("URL").trim();
  const threadUrl = get("Thread URL").trim();
  if (!/^https:\/\/github\.com\//.test(url)) fail(`URL is not a GitHub link: ${url}`);
  const thread = parseThreadUrl(threadUrl);
  if (!thread) fail(`Thread URL is not a GitHub issue, pull request, or discussion: ${threadUrl}`);
  if (!url.startsWith(threadUrl)) fail("URL does not belong to its thread");

  const repository = get("Repository").trim();
  if (repository.toLowerCase() !== thread.repository.toLowerCase()) fail(`Repository ${repository} does not match ${threadUrl}`);
  const repositoryOwner = get("Repository owner").trim() || repository.split("/")[0];
  if (repositoryOwner.toLowerCase() !== repository.split("/")[0].toLowerCase()) fail(`Repository owner ${repositoryOwner} does not own ${repository}`);

  const feedbackType = TYPE_BY_LABEL[get("Type").trim()];
  if (!feedbackType) fail(`unknown Type "${get("Type")}"`);
  const authorLogin = get("Author").trim();
  if (!authorLogin) fail("Author is empty");

  let attribution = get("Accountability").trim();
  if (!ATTRIBUTIONS.includes(attribution)) fail(`Accountability must be Human or Organization, not "${attribution}"`);
  // Automated replies are always Organization feedback, whatever the file says.
  if (isBotLogin(authorLogin)) attribution = "Organization";

  const own = get("Your own entry").trim();
  if (own !== "Yes" && own !== "No") fail(`Your own entry must be Yes or No, not "${own}"`);

  const state = get("Review state").trim();
  let reviewState = null;
  let threadState = null;
  if (feedbackType === "review") {
    if (!REVIEW_STATES.includes(state)) fail(`review has unknown Review state "${state}"`);
    reviewState = state;
  } else if (state) {
    if (!DESCRIPTION_TYPES.has(feedbackType) || !["open", "closed"].includes(state)) fail(`unexpected Review state "${state}"`);
    threadState = state;
  }

  const createdAt = get("Date (UTC)").trim();
  if (!ISO_UTC.test(createdAt)) fail(`Date (UTC) is not an ISO UTC timestamp: ${createdAt}`);
  const updatedAt = get("Updated (UTC)").trim() || null;
  if (updatedAt && !ISO_UTC.test(updatedAt)) fail(`Updated (UTC) is not an ISO UTC timestamp: ${updatedAt}`);

  const lineText = get("Line").trim();
  if (lineText && !/^\d+$/.test(lineText)) fail(`Line is not a number: ${lineText}`);

  const suggestedSentiment = get("Base sentiment").trim() || get("Sentiment").trim();
  const sentiment = get("Sentiment").trim() || suggestedSentiment;
  if (!SENTIMENTS.includes(suggestedSentiment)) fail(`Base sentiment must be Positive, Neutral, or Negative, not "${suggestedSentiment}"`);
  if (!SENTIMENTS.includes(sentiment)) fail(`Sentiment must be Positive, Neutral, or Negative, not "${sentiment}"`);
  const reason = unguardFormula(get("Sentiment reason")).trim();
  // A label that differs from the automated suggestion, or one exported as manual, is a correction.
  const manual = sentiment !== suggestedSentiment || get("Sentiment source").trim() === "manual";
  const suggestedReason = unguardFormula(get("Suggested reason")).trim() || (manual ? "" : reason);

  const body = unguardFormula(get("Feedback"));
  if (body.includes("\u0000")) fail("Feedback contains a NUL character");

  return {
    url,
    threadUrl,
    threadKind: thread.kind,
    threadNumber: thread.number,
    threadTitle: unguardFormula(get("Thread title")).trim(),
    threadState,
    repository: thread.repository,
    repositoryOwner: thread.owner,
    authorLogin,
    feedbackType,
    isThreadDescription: DESCRIPTION_TYPES.has(feedbackType),
    attribution,
    isOwn: own === "Yes",
    reviewState,
    body,
    filePath: unguardFormula(get("File")).trim() || null,
    line: lineText ? Number(lineText) : null,
    createdAt,
    updatedAt,
    suggestedSentiment,
    suggestedReason: suggestedReason || "No automated reason was recorded.",
    sentiment,
    sentimentReason: reason || (manual ? "Corrected in an imported CSV." : "No reason was recorded."),
    sentimentSource: manual ? "manual" : "auto",
  };
}

// Validates every row, collecting all problems, and rejects duplicate URLs.
export function normalizeRows(rawRows) {
  const records = [];
  const errors = [];
  const seen = new Map();
  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    try {
      const record = normalizeRow(raw, rowNumber);
      if (seen.has(record.url)) throw new Error(`Row ${rowNumber}: duplicate URL, first seen on row ${seen.get(record.url)}`);
      seen.set(record.url, rowNumber);
      records.push(record);
    } catch (error) {
      errors.push(error.message);
    }
  });
  return { records, errors };
}

export function countBySentiment(records) {
  const counts = { entries: records.length, Positive: 0, Neutral: 0, Negative: 0 };
  for (const record of records) counts[record.sentiment]++;
  return counts;
}

// ---- SQL generation -------------------------------------------------------------------------

const MAX_STATEMENT_BYTES = 90_000; // D1 rejects statements over 100 KB
const BODY_CHUNK_CHARS = 20_000;

export function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`cannot store ${value}`);
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

const byteLength = text => new TextEncoder().encode(text).length;

function upsert(table, row, conflictColumn, updateSql) {
  const columns = Object.keys(row);
  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(column => sqlLiteral(row[column])).join(", ")}) ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateSql};`;
}

const excludedAll = (columns, skip = []) =>
  columns.filter(column => !skip.includes(column)).map(column => `${column} = excluded.${column}`).join(", ");

// Builds idempotent upserts. Re-importing refreshes content and automated suggestions but never
// overwrites a manual correction made in the dashboard, unless the file itself carries a manual one.
export async function buildImportSql({ records, accounts, repositories, importRun, now }) {
  const statements = [];
  const accountRows = [...accounts.values()].map(account => ({
    login: account.login,
    account_type: account.type,
    avatar_url: account.avatarUrl,
    profile_url: account.profileUrl,
    updated_at: now,
  }));
  for (const row of accountRows) statements.push(upsert("gh_accounts", row, "login", excludedAll(Object.keys(row), ["login"])));

  for (const repo of repositories.values()) {
    const row = { full_name: repo.fullName, owner_login: repo.owner, name: repo.fullName.split("/")[1], visibility: repo.visibility, url: `https://github.com/${repo.fullName}`, updated_at: now };
    statements.push(upsert("gh_repositories", row, "full_name", excludedAll(Object.keys(row), ["full_name"])));
  }

  const threads = new Map();
  for (const record of records) {
    const existing = threads.get(record.threadUrl);
    threads.set(record.threadUrl, {
      url: record.threadUrl,
      repository: record.repository,
      kind: record.threadKind,
      number: record.threadNumber,
      title: existing?.title || record.threadTitle || `#${record.threadNumber}`,
      state: record.threadState ?? existing?.state ?? null,
      updated_at: now,
    });
  }
  for (const row of threads.values()) {
    statements.push(upsert("gh_threads", row, "url", "repository = excluded.repository, kind = excluded.kind, number = excluded.number, title = excluded.title, state = COALESCE(excluded.state, gh_threads.state), updated_at = excluded.updated_at"));
  }

  const keepManual = column =>
    `${column} = CASE WHEN gh_feedback.sentiment_source = 'manual' AND excluded.sentiment_source = 'auto' THEN gh_feedback.${column} ELSE excluded.${column} END`;
  const feedbackUpdate = [
    excludedAll(["thread_url", "repository", "author_login", "feedback_type", "is_thread_description", "attribution", "is_own", "review_state", "body", "file_path", "line", "created_at", "updated_at", "suggested_sentiment", "suggested_reason", "imported_at"]),
    ...["sentiment", "sentiment_reason", "sentiment_edited_at", "sentiment_edited_by", "sentiment_source"].map(keepManual),
  ].join(", ");

  for (const record of records) {
    const row = {
      id: await feedbackId(record.url),
      url: record.url,
      thread_url: record.threadUrl,
      repository: record.repository,
      author_login: record.authorLogin,
      feedback_type: record.feedbackType,
      is_thread_description: record.isThreadDescription,
      attribution: record.attribution,
      is_own: record.isOwn,
      review_state: record.reviewState,
      body: record.body,
      file_path: record.filePath,
      line: record.line,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      suggested_sentiment: record.suggestedSentiment,
      suggested_reason: record.suggestedReason,
      sentiment: record.sentiment,
      sentiment_reason: record.sentimentReason,
      sentiment_source: record.sentimentSource,
      sentiment_edited_at: record.sentimentSource === "manual" ? now : null,
      sentiment_edited_by: record.sentimentSource === "manual" ? "csv import" : null,
      imported_at: now,
    };
    let statement = upsert("gh_feedback", row, "url", feedbackUpdate);
    if (byteLength(statement) <= MAX_STATEMENT_BYTES) {
      statements.push(statement);
      continue;
    }
    // Very long bodies are written in pieces so each statement stays under D1's limit.
    statements.push(upsert("gh_feedback", { ...row, body: "" }, "url", feedbackUpdate));
    let start = 0;
    while (start < record.body.length) {
      let end = Math.min(start + BODY_CHUNK_CHARS, record.body.length);
      // Never split a surrogate pair.
      if (end < record.body.length && /[\uD800-\uDBFF]/.test(record.body[end - 1])) end--;
      const piece = record.body.slice(start, end);
      statements.push(`UPDATE gh_feedback SET body = body || ${sqlLiteral(piece)} WHERE url = ${sqlLiteral(record.url)};`);
      start = end;
    }
  }

  statements.push(
    `INSERT INTO gh_feedback_imports (id, source_file, imported_at, row_count, period_start, period_end, notes_json) VALUES (${[
      importRun.id, importRun.sourceFile, now, records.length, importRun.periodStart ?? null, importRun.periodEnd ?? null, JSON.stringify(importRun.notes ?? {}),
    ].map(sqlLiteral).join(", ")});`,
  );
  for (const statement of statements) {
    if (byteLength(statement) > 100_000) throw new Error("generated a statement over D1's 100 KB limit");
  }
  return `${statements.join("\n")}\n`;
}
