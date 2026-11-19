import { sqlLiteral } from "./records.js";

export const SUMMARY_STYLE = "humanize-comment-v1";

// Explicit editorial input only. This never invents summaries from heuristics or sentiment.
export function validateSummaries(payload) {
  if (!payload || payload.styleVersion !== SUMMARY_STYLE || !Array.isArray(payload.entries)) {
    throw new Error(`expected styleVersion ${SUMMARY_STYLE} and an entries array`);
  }
  const seen = new Set();
  return payload.entries.map(entry => {
    if (!/^[a-f0-9]{24}$/.test(entry.id) || seen.has(entry.id)) throw new Error(`invalid or duplicate summary ID: ${entry.id}`);
    seen.add(entry.id);
    if (typeof entry.sourceBody !== "string" || typeof entry.summary !== "string") throw new Error(`missing source or summary: ${entry.id}`);
    if (entry.summary.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(entry.summary)) throw new Error(`invalid summary text: ${entry.id}`);
    if (entry.omitReason !== null && (typeof entry.omitReason !== "string" || !/^[a-z_]{1,50}$/.test(entry.omitReason))) throw new Error(`invalid omission reason: ${entry.id}`);
    if (!entry.summary.trim() && !entry.omitReason) throw new Error(`empty summary needs an omission reason: ${entry.id}`);
    if (!entry.sourceBody.trim() && entry.summary.trim()) throw new Error(`empty feedback cannot have a written paraphrase: ${entry.id}`);
    if (entry.sourceBody.includes("\u0000")) throw new Error(`source contains NUL: ${entry.id}`);
    return { id: entry.id, sourceBody: entry.sourceBody, summary: entry.summary.trim(), omitReason: entry.omitReason };
  });
}

export function buildSummarySql(payload, now = new Date().toISOString()) {
  const entries = validateSummaries(payload);
  const statements = [];
  for (const entry of entries) {
    // Chunk original text to keep statements below D1's 100 KB limit, including emoji.
    statements.push(`INSERT INTO gh_feedback_summaries (feedback_id, source_body, summary, omit_reason, style_version, generated_at)
VALUES (${[entry.id, "", entry.summary, entry.omitReason, SUMMARY_STYLE, now].map(sqlLiteral).join(", ")})
ON CONFLICT(feedback_id) DO UPDATE SET source_body = '', summary = excluded.summary, omit_reason = excluded.omit_reason, style_version = excluded.style_version, generated_at = excluded.generated_at;`);
    let start = 0;
    while (start < entry.sourceBody.length) {
      let end = Math.min(start + 15_000, entry.sourceBody.length);
      if (end < entry.sourceBody.length && /[\uD800-\uDBFF]/.test(entry.sourceBody[end - 1])) end--;
      statements.push(`UPDATE gh_feedback_summaries SET source_body = source_body || ${sqlLiteral(entry.sourceBody.slice(start, end))} WHERE feedback_id = ${sqlLiteral(entry.id)};`);
      start = end;
    }
  }
  if (statements.some(sql => new TextEncoder().encode(sql).length > 90_000)) throw new Error("summary SQL exceeds safe D1 statement size");
  return `${statements.join("\n")}\n`;
}
