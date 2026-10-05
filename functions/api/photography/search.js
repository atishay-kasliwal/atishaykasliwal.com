import { loadPublicLibrary } from "../../_lib/store.js";
import { rankPhotos, SEARCH_MAX_QUERY } from "../../../src/photography-core/search.js";
import { publicView } from "../../../src/photography-core/library.js";

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.length > SEARCH_MAX_QUERY) return Response.json({ error: "query is too long" }, { status: 400 });
  const library = await loadPublicLibrary(env.DB);
  const { query, results } = rankPhotos(q, library);
  const byId = new Map(library.map(photo => [photo.id, publicView(photo)]));
  return Response.json(
    {
      query: { terms: query.terms, colors: query.colors },
      results: results.map(result => ({ ...result, photo: byId.get(result.id) })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
