import { requireAdmin } from '../../../../../_lib/access.js';
import { validateRotation } from '../../../../../../src/photography-core/rotation.js';
import { MAX_DISPLAY_BYTES, orientationOf } from '../../../../../../src/photography-core/upload.js';

async function lookup(request, env, id) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return { error: Response.json({ error: 'forbidden' }, { status: admin.status }) };
  if (!/^[a-f0-9]{24}$/.test(id)) return { error: Response.json({ error: 'unknown photo' }, { status: 404 }) };
  const row = await env.DB.prepare('SELECT src, origin FROM photos WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!row) return { error: Response.json({ error: 'unknown photo' }, { status: 404 }) };
  if (row.origin !== 'r2') return { error: Response.json({ error: 'Rotation is available for uploaded photos.' }, { status: 400 }) };
  const base = new URL(env.PHOTO_PUBLIC_BASE);
  const url = new URL(row.src);
  const prefix = base.pathname.replace(/\/$/, '') + '/display/';
  if (url.origin !== base.origin || !url.pathname.startsWith(prefix)) return { error: Response.json({ error: 'Photo storage path is invalid.' }, { status: 400 }) };
  const key = 'display/' + url.pathname.slice(prefix.length);
  const object = await env.PHOTOS.get(key);
  if (!object) return { error: Response.json({ error: 'Display photo is missing.' }, { status: 404 }) };
  return { row, object };
}

export async function onRequestGet({ request, env, params }) {
  const found = await lookup(request, env, params.id);
  if (found.error) return found.error;
  return new Response(found.object.body, { headers: {
    'Content-Type': found.object.httpMetadata?.contentType || 'image/jpeg',
    'Cache-Control': 'no-store',
    ETag: found.object.httpEtag,
  } });
}

export async function onRequestPost({ request, env, params }) {
  if (Number(request.headers.get('Content-Length')) > MAX_DISPLAY_BYTES) return Response.json({ error: 'Rotated photo is larger than 6 MB.' }, { status: 413 });
  const found = await lookup(request, env, params.id);
  if (found.error) return found.error;
  if (request.headers.get('If-Match') !== found.object.httpEtag) return Response.json({ error: 'This photo changed. Refresh and try again.' }, { status: 409 });
  const rotated = new Uint8Array(await request.arrayBuffer());
  const current = new Uint8Array(await found.object.arrayBuffer());
  const checked = validateRotation(current, rotated);
  if (!checked.ok) return Response.json({ error: checked.error }, { status: 400 });
  const key = `display/${params.id}-rotated-${crypto.randomUUID()}.jpg`;
  const src = `${env.PHOTO_PUBLIC_BASE.replace(/\/$/, '')}/${key}`;
  await env.PHOTOS.put(key, rotated, { httpMetadata: { contentType: 'image/jpeg' } });
  const { width, height } = checked.dimensions;
  const result = await env.DB.prepare('UPDATE photos SET src = ?, width = ?, height = ?, orientation = ?, updated_at = ? WHERE id = ? AND src = ? AND deleted_at IS NULL')
    .bind(src, width, height, orientationOf(width, height), new Date().toISOString(), params.id, found.row.src).run();
  if (!result.meta.changes) {
    await env.PHOTOS.delete(key);
    return Response.json({ error: 'This photo changed. Refresh and try again.' }, { status: 409 });
  }
  // Keep the original and prior display available: cached exhibition responses
  // may still point at the old URL while the new, versioned URL propagates.
  return Response.json({ id: params.id, src, width, height }, { headers: { 'Cache-Control': 'no-store' } });
}
