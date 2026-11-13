// The homepage GitHub activity, live. The homepage is prerendered from the snapshot taken at the
// last deploy, then swaps in this response, so the panel stays current between deploys.
//
// Each Cloudflare location keeps a copy for ten minutes. A request after that refetches from
// GitHub; if GitHub fails, the older copy is served instead. Needs the GITHUB_TOKEN secret (any
// token that can read public data); without it this returns 503 and the page keeps its snapshot.
import { fetchGithubActivity } from "../../src/github-activity-fetch.js";

const FRESH_FOR = 10 * 60 * 1000;
const KEEP_FOR = 7 * 86400; // seconds a stale copy stays available as a fallback
const cacheKey = "https://atishaykasliwal.com/api/github-activity?cache=v1";

const respond = (body, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=60" : "no-store",
    },
  });

export async function onRequestGet({ env, waitUntil }) {
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  const stored = cached && (await cached.text());
  const storedAt = stored ? Date.parse(JSON.parse(stored).fetchedAt) : 0;
  if (stored && Date.now() - storedAt < FRESH_FOR) return respond(stored);

  if (!env.GITHUB_TOKEN) return stored ? respond(stored) : respond('{"error":"GITHUB_TOKEN is not set"}', 503);
  try {
    const body = JSON.stringify(await fetchGithubActivity(env.GITHUB_TOKEN));
    waitUntil(cache.put(cacheKey, new Response(body, { headers: { "Cache-Control": `public, max-age=${KEEP_FOR}` } })));
    return respond(body);
  } catch (error) {
    console.error(error);
    return stored ? respond(stored) : respond('{"error":"GitHub is unavailable"}', 502);
  }
}
