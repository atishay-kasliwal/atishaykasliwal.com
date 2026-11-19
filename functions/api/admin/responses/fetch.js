import { adminRoute, json } from "../../../_lib/admin.js";
import { ResumeRequestError } from "../../../../src/resume-core/store.js";
import { sha256Hex } from "../../../../src/resume-core/constants.js";

// GET ?target=<key>&agent=<key>: fetch one public page of this site from the server, with a chosen
// User-Agent, and report exactly what came back. These are simulations: only the User-Agent string
// is the crawler's. The request leaves from Cloudflare, not from the provider's IP ranges, so it is
// not a verified crawler request and bot rules may treat the real crawler differently. Only the
// fixed paths below on this site's own origin can be fetched, so the route cannot be pointed at
// another host.
export const TARGETS = {
  "profile-json": "/api/profile.json",
  "profile-schema": "/api/profile.schema.json",
  home: "/",
  profile: "/profile/",
  "llms-txt": "/llms.txt",
  robots: "/robots.txt",
  resume: "/Atishay-Kasliwal-Resume.pdf",
};

export const AGENTS = {
  chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  gptbot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.3; +https://openai.com/gptbot)",
  claudebot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  perplexitybot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

const MAX_BODY = 4 * 1024 * 1024;
const TEXT_TYPES = /^(text\/|application\/(json|schema\+json|xml|javascript|ld\+json))/;

export const onRequestGet = adminRoute(async ({ request }) => {
  const params = new URL(request.url).searchParams;
  const path = TARGETS[params.get("target")];
  const userAgent = AGENTS[params.get("agent") ?? "chrome"];
  if (!path || !userAgent) throw new ResumeRequestError("unknown target or agent");
  const origin = new URL(request.url).origin;
  let url = new URL(path, origin);
  const redirects = [];
  const started = Date.now();
  let response;
  for (let hop = 0; hop < 5; hop += 1) {
    response = await fetch(url, { redirect: "manual", headers: { "User-Agent": userAgent, Accept: "*/*" }, cache: "no-store" });
    const location = response.headers.get("Location");
    if (response.status < 300 || response.status >= 400 || !location) break;
    const next = new URL(location, url);
    redirects.push({ status: response.status, from: url.href, to: next.href });
    if (next.origin !== origin) break;
    url = next;
  }
  const headersMs = Date.now() - started;
  const bytes = new Uint8Array(await response.arrayBuffer());
  const totalMs = Date.now() - started;
  const contentType = response.headers.get("Content-Type") ?? "";
  const isText = TEXT_TYPES.test(contentType);
  return json({
    mode: "server",
    simulated: true,
    note: "Simulated request: the crawler's User-Agent sent from this site's server, not a verified request from the provider.",
    target: params.get("target"),
    agent: params.get("agent") ?? "chrome",
    userAgent,
    url: url.href,
    fetchedAt: new Date(started).toISOString(),
    redirects,
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers],
    contentType,
    sizeBytes: bytes.length,
    timing: { headersMs, totalMs },
    sha256: await sha256Hex(bytes),
    body: isText ? new TextDecoder().decode(bytes.length > MAX_BODY ? bytes.subarray(0, MAX_BODY) : bytes) : null,
    bodyTruncated: isText && bytes.length > MAX_BODY,
  });
});
