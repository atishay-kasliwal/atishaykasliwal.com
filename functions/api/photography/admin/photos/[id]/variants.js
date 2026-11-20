import { requireAdmin } from "../../../../../_lib/access.js";
import { MAX_VARIANT_BYTES, VARIANT_WIDTHS, validateVariants } from "../../../../../../src/photography-core/variants.js";

const FORM_OVERHEAD = 64 * 1024;

// POST multipart: `src` (the photo's current display URL) and `w640`, `w1280`, `w1920` WebP files
// made by the admin page. Stores them under a new token, so a cached old copy never shows a
// rotated photo the wrong way, and records them only if the photo has not changed meanwhile.
export async function onRequestPost({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return Response.json({ error: "forbidden" }, { status: admin.status });
  if (!/^[a-f0-9]{24}$/.test(params.id)) return Response.json({ error: "unknown photo" }, { status: 404 });
  if (Number(request.headers.get("Content-Length")) > VARIANT_WIDTHS.length * MAX_VARIANT_BYTES + FORM_OVERHEAD) {
    return Response.json({ error: "The copies are too large." }, { status: 413 });
  }
  const row = await env.DB.prepare("SELECT src, origin, width, height FROM photos WHERE id = ? AND deleted_at IS NULL").bind(params.id).first();
  if (!row) return Response.json({ error: "unknown photo" }, { status: 404 });
  if (row.origin !== "r2") return Response.json({ error: "Smaller copies are made for uploaded photos only." }, { status: 400 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "expected multipart form data" }, { status: 400 });
  }
  if (form.get("src") !== row.src) return Response.json({ error: "This photo changed. Refresh and try again." }, { status: 409 });
  const files = new Map();
  for (const width of VARIANT_WIDTHS) {
    const file = form.get(`w${width}`);
    if (file instanceof File) files.set(width, new Uint8Array(await file.arrayBuffer()));
  }
  const check = validateVariants(files, row);
  if (!check.ok) return Response.json({ error: check.errors.join(" ") }, { status: 400 });

  const base = env.PHOTO_PUBLIC_BASE.replace(/\/$/, "");
  const token = crypto.randomUUID().slice(0, 8);
  const variants = [];
  for (const [width, bytes] of [...files].sort((a, b) => a[0] - b[0])) {
    const key = `variants/${params.id}/${token}/${width}.webp`;
    await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } });
    variants.push({ src: `${base}/${key}`, width, key });
  }
  const result = await env.DB.prepare("UPDATE photos SET variants_json = ?, updated_at = ? WHERE id = ? AND src = ? AND deleted_at IS NULL")
    .bind(JSON.stringify(variants.map(({ src, width }) => ({ src, width }))), new Date().toISOString(), params.id, row.src)
    .run();
  if (!result.meta.changes) {
    await Promise.all(variants.map(variant => env.PHOTOS.delete(variant.key)));
    return Response.json({ error: "This photo changed. Refresh and try again." }, { status: 409 });
  }
  return Response.json({ id: params.id, variants: variants.map(({ src, width }) => ({ src, width })) }, { status: 201 });
}
