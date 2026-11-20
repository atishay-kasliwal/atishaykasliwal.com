import { requireAdmin } from "../../../_lib/access.js";
import { loadLibrary } from "../../../_lib/store.js";

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env, { allowService: true });
  if (!admin.ok) return Response.json({ error: "forbidden" }, { status: admin.status });
  const photos = (await loadLibrary(env.DB)).map(photo => ({
    id: photo.id,
    origin: photo.origin,
    status: photo.status,
    hidden: photo.hidden,
    src: photo.src,
    width: photo.width,
    height: photo.height,
    variants: photo.variants,
    tags: photo.tags,
    caption: photo.caption,
    uploadedAt: photo.uploadedAt,
  }));
  return Response.json({ photos }, { headers: { "Cache-Control": "no-store" } });
}
