import { requireIngestSecret } from "../../_lib/access.js";
import { d1Store } from "../../_lib/store.js";
import { applyIngest, validateIngestBatch } from "../../../src/photography-core/ingest.js";
import { DEFAULT_VOCABULARY } from "../../../src/photography-core/vocabulary.js";

// Called by the Colab sync notebook with a bearer secret. Never reachable from the browser UI.
export async function onRequestPost({ request, env }) {
  const auth = requireIngestSecret(request, env);
  if (!auth.ok) return Response.json({ error: "unauthorised" }, { status: auth.status });
  let batch;
  try {
    batch = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const check = validateIngestBatch(batch);
  if (!check.ok) return Response.json({ error: check.errors.join(" ") }, { status: 400 });
  const result = await applyIngest(d1Store(env.DB), batch, DEFAULT_VOCABULARY);
  return Response.json(result);
}

export async function onRequestGet({ request, env }) {
  const auth = requireIngestSecret(request, env);
  if (!auth.ok) return Response.json({ error: "unauthorised" }, { status: auth.status });
  const { results } = await env.DB.prepare(
    `SELECT id, alt, src FROM photos
       WHERE deleted_at IS NULL
         AND (status = 'pending' OR (origin = 'external' AND id NOT IN (SELECT photo_id FROM photo_tags)))
       ORDER BY uploaded_at LIMIT 200`,
  ).all();
  return Response.json({ vocabulary: DEFAULT_VOCABULARY, pending: results });
}
