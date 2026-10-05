import { loadPublicLibrary } from "../../_lib/store.js";
import { publicView } from "../../../src/photography-core/library.js";
import { dailySelection } from "../../../src/photography-core/selection.js";
import { layoutForSelection } from "../../../src/photography-core/layout.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requested)) {
    return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const library = await loadPublicLibrary(env.DB);
  const all = url.searchParams.get("all") === "1";
  const selected = (all ? library : dailySelection(library, requested)).map(publicView);
  const mobile = url.searchParams.get("mobile") === "1";
  const layout = layoutForSelection(selected, { key: requested, mobile });
  return Response.json(
    { date: requested, collection: all ? "all" : "daily", photos: selected, layout },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
