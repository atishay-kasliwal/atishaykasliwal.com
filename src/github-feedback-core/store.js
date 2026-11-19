// D1 queries behind the GitHub feedback admin API. All reads go through the gh_feedback_entries
// view. Feedback bodies are returned as raw text: clients must render them with textContent
// (or escape them), never as HTML.
import { stringifyCsv } from "./csv.js";
import { ATTRIBUTIONS, EXPORT_COLUMNS, FEEDBACK_TYPES, SENTIMENTS, VISIBILITIES } from "./records.js";

export class FeedbackRequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const ID_PATTERN = /^[a-f0-9]{24}$/;
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})(?:\[bot\])?$/;
const REPOSITORY = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BINDS = 90; // D1 allows 100 bound parameters per statement
export const MAX_PAGE_SIZE = 500;

function listParam(params, name, allowed) {
  const values = params.getAll(name).flatMap(value => value.split(",")).map(value => value.trim()).filter(Boolean);
  for (const value of values) {
    const ok = allowed instanceof RegExp ? allowed.test(value) : allowed.includes(value);
    if (!ok) throw new FeedbackRequestError(`invalid ${name}: ${value}`);
  }
  return [...new Set(values)];
}

function choiceParam(params, name, choices, fallback) {
  const value = params.get(name);
  if (value === null || value === "") return fallback;
  if (!choices.includes(value)) throw new FeedbackRequestError(`${name} must be one of ${choices.join(", ")}`);
  return value;
}

function dayParam(params, name) {
  const value = params.get(name);
  if (!value) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!DAY.test(value) || Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) throw new FeedbackRequestError(`${name} must be a YYYY-MM-DD date`);
  return value;
}

function intParam(params, name, fallback, min, max) {
  const value = params.get(name);
  if (value === null || value === "") return fallback;
  if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max) throw new FeedbackRequestError(`${name} must be a whole number from ${min} to ${max}`);
  return Number(value);
}

// Query parameters (repeat a parameter, or comma-separate, to select several values):
//   q            text search over feedback, thread title, author, repository, and reason
//   repository   owner/name          owner        repository owner login
//   author       author login        sentiment    Positive | Neutral | Negative
//   attribution  Human | Organization
//   type         pull_request_description | issue_description | discussion_description |
//                comment | review | review_comment
//   from, to     inclusive YYYY-MM-DD bounds on the entry date (UTC)
//   own          include | exclude | only      entries written by the account owner
//   descriptions include | exclude | only      issue, PR, and discussion descriptions
//   source       auto | manual                 whether the sentiment was corrected by hand
//   visibility   public | private | internal | unknown
//   sort         newest | oldest     limit 1–500 (default 50)     offset
export function parseFilters(params) {
  const q = (params.get("q") ?? "").trim();
  if (q.length > 200) throw new FeedbackRequestError("q must be 200 characters or fewer");
  const filters = {
    q,
    repositories: listParam(params, "repository", REPOSITORY),
    owners: listParam(params, "owner", LOGIN),
    authors: listParam(params, "author", LOGIN),
    sentiments: listParam(params, "sentiment", SENTIMENTS),
    attributions: listParam(params, "attribution", ATTRIBUTIONS),
    types: listParam(params, "type", Object.keys(FEEDBACK_TYPES)),
    visibilities: listParam(params, "visibility", VISIBILITIES),
    from: dayParam(params, "from"),
    to: dayParam(params, "to"),
    own: choiceParam(params, "own", ["include", "exclude", "only"], "include"),
    descriptions: choiceParam(params, "descriptions", ["include", "exclude", "only"], "include"),
    source: choiceParam(params, "source", ["auto", "manual"], null),
    sort: choiceParam(params, "sort", ["newest", "oldest"], "newest"),
    limit: intParam(params, "limit", 50, 1, MAX_PAGE_SIZE),
    offset: intParam(params, "offset", 0, 0, 1_000_000),
  };
  if (filters.from && filters.to && filters.from > filters.to) throw new FeedbackRequestError("from must be on or before to");
  return filters;
}

const nextDay = day => new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

export function buildWhere(filters) {
  const conditions = [];
  const binds = [];
  const anyOf = (column, values) => {
    if (!values.length) return;
    conditions.push(`${column} IN (${values.map(() => "?").join(", ")})`);
    binds.push(...values);
  };
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, match => `\\${match}`)}%`;
    const columns = ["body", "thread_title", "author_login", "repository", "sentiment_reason"];
    conditions.push(`(${columns.map(column => `${column} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    binds.push(...columns.map(() => pattern));
  }
  anyOf("repository", filters.repositories);
  anyOf("repository_owner", filters.owners);
  anyOf("author_login", filters.authors);
  anyOf("sentiment", filters.sentiments);
  anyOf("attribution", filters.attributions);
  anyOf("feedback_type", filters.types);
  anyOf("repository_visibility", filters.visibilities);
  if (filters.from) {
    conditions.push("created_at >= ?");
    binds.push(`${filters.from}T00:00:00Z`);
  }
  if (filters.to) {
    conditions.push("created_at < ?");
    binds.push(`${nextDay(filters.to)}T00:00:00Z`);
  }
  if (filters.own === "exclude") conditions.push("is_own = 0");
  if (filters.own === "only") conditions.push("is_own = 1");
  if (filters.descriptions === "exclude") conditions.push("is_thread_description = 0");
  if (filters.descriptions === "only") conditions.push("is_thread_description = 1");
  if (filters.source) {
    conditions.push("sentiment_source = ?");
    binds.push(filters.source);
  }
  if (binds.length > MAX_BINDS) throw new FeedbackRequestError("too many filter values; select fewer");
  return { clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", binds };
}

export function entryFromRow(row) {
  return {
    id: row.id,
    url: row.url,
    type: row.feedback_type,
    typeLabel: FEEDBACK_TYPES[row.feedback_type],
    isThreadDescription: row.is_thread_description === 1,
    isOwn: row.is_own === 1,
    attribution: row.attribution,
    reviewState: row.review_state,
    body: row.body,
    summary: row.display_summary === null || row.display_summary === undefined ? null : {
      text: row.display_summary,
      kind: "paraphrase",
      omitReason: row.summary_omit_reason,
      styleVersion: row.summary_style_version,
      generatedAt: row.summary_generated_at,
    },
    file: row.file_path,
    line: row.line,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    thread: { url: row.thread_url, title: row.thread_title, kind: row.thread_kind, number: row.thread_number, state: row.thread_state },
    repository: {
      fullName: row.repository,
      visibility: row.repository_visibility,
      owner: { login: row.repository_owner, type: row.owner_type, avatarUrl: row.owner_avatar_url, profileUrl: row.owner_profile_url },
    },
    author: { login: row.author_login, type: row.author_type, avatarUrl: row.author_avatar_url, profileUrl: row.author_profile_url },
    sentiment: {
      label: row.sentiment,
      reason: row.sentiment_reason,
      source: row.sentiment_source,
      suggested: row.suggested_sentiment,
      suggestedReason: row.suggested_reason,
      editedAt: row.sentiment_edited_at,
      editedBy: row.sentiment_edited_by,
    },
  };
}

// Counts are of entries, not unique reviewers.
function sentimentCounts(rows) {
  const counts = { entries: 0, Positive: 0, Neutral: 0, Negative: 0 };
  for (const { sentiment, n } of rows) {
    counts[sentiment] = n;
    counts.entries += n;
  }
  return counts;
}

export async function listEntries(db, filters) {
  const { clause, binds } = buildWhere(filters);
  const direction = filters.sort === "oldest" ? "ASC" : "DESC";
  const [counted, page] = await Promise.all([
    db.prepare(`SELECT sentiment, COUNT(*) AS n FROM gh_feedback_display_entries ${clause} GROUP BY sentiment`).bind(...binds).all(),
    db
      .prepare(`SELECT * FROM gh_feedback_display_entries ${clause} ORDER BY created_at ${direction}, id ${direction} LIMIT ? OFFSET ?`)
      .bind(...binds, filters.limit, filters.offset)
      .all(),
  ]);
  const counts = sentimentCounts(counted.results);
  return { counts, total: counts.entries, limit: filters.limit, offset: filters.offset, entries: page.results.map(entryFromRow) };
}

// Everything a dashboard needs to draw its filters, plus overall and "received" totals
// (received = written by someone else, excluding thread descriptions).
export async function getFacets(db) {
  const [all, received, repositories, authors, types, range, lastImport] = await Promise.all([
    db.prepare("SELECT sentiment, COUNT(*) AS n FROM gh_feedback GROUP BY sentiment").all(),
    db.prepare("SELECT sentiment, COUNT(*) AS n FROM gh_feedback WHERE is_own = 0 AND is_thread_description = 0 GROUP BY sentiment").all(),
    db.prepare(`SELECT repository, repository_owner, owner_type, owner_avatar_url, owner_profile_url, repository_visibility, COUNT(*) AS n
      FROM gh_feedback_entries GROUP BY repository ORDER BY n DESC, repository`).all(),
    db.prepare(`SELECT author_login, author_type, author_avatar_url, author_profile_url, MAX(attribution) AS attribution, MAX(is_own) AS is_own, COUNT(*) AS n
      FROM gh_feedback_entries GROUP BY author_login ORDER BY n DESC, author_login`).all(),
    db.prepare("SELECT feedback_type, COUNT(*) AS n FROM gh_feedback GROUP BY feedback_type ORDER BY n DESC").all(),
    db.prepare("SELECT MIN(created_at) AS first, MAX(created_at) AS last FROM gh_feedback").first(),
    db.prepare("SELECT id, source_file, imported_at, row_count, period_start, period_end FROM gh_feedback_imports ORDER BY imported_at DESC LIMIT 1").first(),
  ]);
  return {
    totals: sentimentCounts(all.results),
    received: sentimentCounts(received.results),
    dateRange: { first: range?.first ?? null, last: range?.last ?? null },
    repositories: repositories.results.map(row => ({
      fullName: row.repository,
      visibility: row.repository_visibility,
      owner: { login: row.repository_owner, type: row.owner_type, avatarUrl: row.owner_avatar_url, profileUrl: row.owner_profile_url },
      entries: row.n,
    })),
    authors: authors.results.map(row => ({
      login: row.author_login,
      type: row.author_type,
      avatarUrl: row.author_avatar_url,
      profileUrl: row.author_profile_url,
      attribution: row.attribution,
      isOwn: row.is_own === 1,
      entries: row.n,
    })),
    types: types.results.map(row => ({ type: row.feedback_type, label: FEEDBACK_TYPES[row.feedback_type], entries: row.n })),
    lastImport: lastImport
      ? { id: lastImport.id, sourceFile: lastImport.source_file, importedAt: lastImport.imported_at, rows: lastImport.row_count, periodStart: lastImport.period_start, periodEnd: lastImport.period_end }
      : null,
  };
}

export async function getEntry(db, id) {
  if (!ID_PATTERN.test(id)) throw new FeedbackRequestError("unknown entry", 404);
  const [row, edits] = await Promise.all([
    db.prepare("SELECT * FROM gh_feedback_display_entries WHERE id = ?").bind(id).first(),
    db.prepare("SELECT previous_sentiment, previous_reason, sentiment, reason, source, edited_by, edited_at FROM gh_sentiment_edits WHERE feedback_id = ? ORDER BY id").bind(id).all(),
  ]);
  if (!row) throw new FeedbackRequestError("unknown entry", 404);
  return {
    ...entryFromRow(row),
    history: edits.results.map(edit => ({
      previousSentiment: edit.previous_sentiment,
      previousReason: edit.previous_reason,
      sentiment: edit.sentiment,
      reason: edit.reason,
      source: edit.source,
      editedBy: edit.edited_by,
      editedAt: edit.edited_at,
    })),
  };
}

// Body: { sentiment, reason } to correct a label, or { reset: true } to return to the suggestion.
// A manual label needs a reason so the dashboard can always say why an entry is classified so.
export async function updateSentiment(db, id, body, { editor, now = new Date().toISOString() }) {
  if (!ID_PATTERN.test(id)) throw new FeedbackRequestError("unknown entry", 404);
  if (!body || typeof body !== "object") throw new FeedbackRequestError("body must be a JSON object");
  const current = await db
    .prepare("SELECT sentiment, sentiment_reason, suggested_sentiment, suggested_reason FROM gh_feedback WHERE id = ?")
    .bind(id)
    .first();
  if (!current) throw new FeedbackRequestError("unknown entry", 404);

  let next;
  if (body.reset === true) {
    next = { sentiment: current.suggested_sentiment, reason: current.suggested_reason, source: "auto", editedAt: null, editedBy: null };
  } else {
    if (!SENTIMENTS.includes(body.sentiment)) throw new FeedbackRequestError("sentiment must be Positive, Neutral, or Negative");
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 3 || reason.length > 500) throw new FeedbackRequestError("reason must be 3 to 500 characters");
    next = { sentiment: body.sentiment, reason, source: "manual", editedAt: now, editedBy: editor ?? null };
  }
  await db.batch([
    db
      .prepare(`INSERT INTO gh_sentiment_edits (feedback_id, previous_sentiment, previous_reason, sentiment, reason, source, edited_by, edited_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, current.sentiment, current.sentiment_reason, next.sentiment, next.reason, next.source, editor ?? null, now),
    db
      .prepare("UPDATE gh_feedback SET sentiment = ?, sentiment_reason = ?, sentiment_source = ?, sentiment_edited_at = ?, sentiment_edited_by = ? WHERE id = ?")
      .bind(next.sentiment, next.reason, next.source, next.editedAt, next.editedBy, id),
  ]);
  return getEntry(db, id);
}

export function exportRecord(row) {
  return {
    "Sentiment": row.sentiment,
    "Date (UTC)": row.created_at,
    "Repository": row.repository,
    "Repository owner": row.repository_owner,
    "Type": FEEDBACK_TYPES[row.feedback_type],
    "Author": row.author_login,
    "Accountability": row.attribution,
    "Your own entry": row.is_own === 1 ? "Yes" : "No",
    "Review state": row.review_state ?? (row.is_thread_description === 1 ? row.thread_state ?? "" : ""),
    "Thread title": row.thread_title,
    "Feedback": row.body,
    "URL": row.url,
    "Thread URL": row.thread_url,
    "File": row.file_path ?? "",
    "Line": row.line ?? "",
    "Updated (UTC)": row.updated_at ?? "",
    "Base sentiment": row.suggested_sentiment,
    "Sentiment reason": row.sentiment_reason,
    "Sentiment source": row.sentiment_source,
    "Suggested reason": row.suggested_reason,
    "Sentiment edited at": row.sentiment_edited_at ?? "",
    "Author type": row.author_type,
    "Author avatar": row.author_avatar_url,
    "Repository owner avatar": row.owner_avatar_url,
    "Repository visibility": row.repository_visibility,
  };
}

// Every entry matching the filters (paging is ignored), oldest first, with current labels.
export async function exportCsv(db, filters) {
  const { clause, binds } = buildWhere(filters);
  const { results } = await db.prepare(`SELECT * FROM gh_feedback_entries ${clause} ORDER BY created_at ASC, id ASC`).bind(...binds).all();
  return { csv: stringifyCsv(EXPORT_COLUMNS, results.map(exportRecord)), rows: results.length };
}
