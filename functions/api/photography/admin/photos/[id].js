import { requireAdmin } from "../../../../_lib/access.js";

const ID_PATTERN = /^[a-f0-9]{24}$/;

export async function onRequestPatch({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return Response.json({ error: "forbidden" }, { status: admin.status });
  if (!ID_PATTERN.test(params.id)) return Response.json({ error: "unknown photo" }, { status: 404 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (typeof body.hidden !== "boolean") return Response.json({ error: "hidden must be a boolean" }, { status: 400 });
  const result = await env.DB.prepare(
    "UPDATE photos SET hidden = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(body.hidden ? 1 : 0, new Date().toISOString(), params.id)
    .run();
  if (!result.meta.changes) return Response.json({ error: "unknown photo" }, { status: 404 });
  return Response.json({ id: params.id, hidden: body.hidden }, { headers: { "Cache-Control": "no-store" } });
}

// Deletion order keeps public surfaces correct at every step: the row is marked deleted first
// (so it vanishes from exhibition and search at once), then storage is removed, then rows are
// dropped. A failure after step one leaves a hidden orphan that a retry cleans up.
export async function onRequestDelete({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return Response.json({ error: "forbidden" }, { status: admin.status });
  if (!ID_PATTERN.test(params.id)) return Response.json({ error: "unknown photo" }, { status: 404 });
  const row = await env.DB.prepare("SELECT original_key, src FROM photos WHERE id = ?").bind(params.id).first();
  if (!row) return Response.json({ error: "unknown photo" }, { status: 404 });
  await env.DB.prepare("UPDATE photos SET deleted_at = ? WHERE id = ?").bind(new Date().toISOString(), params.id).run();
  const displayKey = row.src?.includes("/display/") ? row.src.slice(row.src.indexOf("display/")) : null;
  const keys = [row.original_key, displayKey].filter(Boolean);
  if (row.original_key) {
    // Rotation creates versioned display URLs; permanent deletion removes
    // those earlier display versions as well as the current image.
    let cursor;
    do {
      const page = await env.PHOTOS.list({ prefix: `display/${params.id}`, cursor });
      const historical = page.objects.map(object => object.key);
      if (historical.length) await env.PHOTOS.delete(historical);
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }
  if (keys.length) await env.PHOTOS.delete(keys);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM photo_tags WHERE photo_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM processing_runs WHERE photo_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(params.id),
  ]);
  return Response.json({ id: params.id, deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
