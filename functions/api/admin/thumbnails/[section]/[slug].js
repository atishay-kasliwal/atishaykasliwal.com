import { json, serviceAdminRoute } from "../../../../_lib/admin.js";
import { MAX_REQUEST_BYTES, resetThumbnail, saveThumbnail, ThumbnailError } from "../../../../_lib/card-thumbnails.js";
import { cardId, CARD_ID } from "../../../../../src/card-thumbnails.js";

// /api/admin/thumbnails/<section>/<slug>: the card project:atriveo-tracker is
// /api/admin/thumbnails/project/atriveo-tracker.
function idOf(params) {
  const id = cardId(String(params.section ?? ""), String(params.slug ?? ""));
  if (!CARD_ID.test(id)) throw new ThumbnailError("There's no card with that id.", 404);
  return id;
}

const handle = action => serviceAdminRoute(async (context, admin) => {
  try {
    return json(await action(context, idOf(context.params), admin.email));
  } catch (error) {
    if (error instanceof ThumbnailError) return json({ error: error.message }, error.status);
    throw error;
  }
});

// Multipart form: `full` (1080×664 WebP) and `small` (640×394 WebP), both made by Admin.
export const onRequestPost = handle(async ({ request, env }, id, actor) => {
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_REQUEST_BYTES) throw new ThumbnailError("The upload is too large.", 413);
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new ThumbnailError("Expected multipart form data with `full` and `small`.");
  }
  const bytesOf = async field => {
    const file = form.get(field);
    return file instanceof File ? new Uint8Array(await file.arrayBuffer()) : null;
  };
  return saveThumbnail(env, id, { full: await bytesOf("full"), small: await bytesOf("small") }, actor);
});

// Back to the card's built-in image.
export const onRequestDelete = handle(({ env }, id, actor) => resetThumbnail(env, id, actor));
