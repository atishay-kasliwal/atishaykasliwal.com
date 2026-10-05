import { requireAdmin } from "../../../_lib/access.js";
import { validateUpload, orientationOf } from "../../../../src/photography-core/upload.js";

const EXTENSIONS = { jpeg: "jpg", png: "png", webp: "webp" };

async function contentId(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].slice(0, 12).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

// Uploads are idempotent on content: the same original always maps to the same photo id, so
// re-uploading a file never creates a duplicate row or duplicate objects.
export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return Response.json({ error: "forbidden" }, { status: admin.status });

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "expected multipart form data" }, { status: 400 });
  }
  const originalFile = form.get("original");
  const displayFile = form.get("display");
  const original = originalFile instanceof File ? new Uint8Array(await originalFile.arrayBuffer()) : null;
  const display = displayFile instanceof File ? new Uint8Array(await displayFile.arrayBuffer()) : null;
  let colors = [];
  try {
    colors = JSON.parse(form.get("colors") ?? "[]");
  } catch {
    return Response.json({ error: "colors must be JSON" }, { status: 400 });
  }
  const check = validateUpload({ original, display, metadata: { colors, alt: form.get("alt") } });
  if (!check.ok) return Response.json({ error: check.errors.join(" ") }, { status: 400 });

  const id = await contentId(original);
  const existing = await env.DB.prepare("SELECT id, status FROM photos WHERE id = ?").bind(id).first();
  if (existing) return Response.json({ id, status: existing.status, duplicate: true });

  const originalKey = `originals/${id}.${EXTENSIONS[check.originalType]}`;
  const displayKey = `display/${id}.${EXTENSIONS[check.displayType]}`;
  const now = new Date().toISOString();
  await env.PHOTOS.put(originalKey, original, { httpMetadata: { contentType: `image/${check.originalType}` } });
  await env.PHOTOS.put(displayKey, display, { httpMetadata: { contentType: `image/${check.displayType}` } });
  await env.DB.prepare(
    `INSERT INTO photos (id, origin, status, hidden, alt, src, original_key, width, height, orientation, colors_json, uploaded_at, updated_at)
     VALUES (?, 'r2', 'pending', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      check.alt,
      `${env.PHOTO_PUBLIC_BASE}/${displayKey}`,
      originalKey,
      check.dimensions.width,
      check.dimensions.height,
      orientationOf(check.dimensions.width, check.dimensions.height),
      JSON.stringify(check.colors),
      now,
      now,
    )
    .run();
  return Response.json({ id, status: "pending", duplicate: false }, { status: 201 });
}
