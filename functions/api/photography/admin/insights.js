import { requireAdmin } from "../../../_lib/access.js";

// Traffic and search data for the SEO dashboard, read live from Google with a service account.
// Secrets (set with `npx wrangler pages secret put NAME`):
//   GOOGLE_SERVICE_ACCOUNT_JSON  the service account's JSON key
//   GA4_PROPERTY_ID              numeric GA4 property ID (Admin → Property settings), not the G- ID
//   GSC_PROPERTY                 optional, defaults to "sc-domain:atishaykasliwal.com"
// The same service account must be a Viewer on the GA4 property and a user on the Search Console
// property. Results are cached per isolate for ten minutes.

const SCOPES = "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly";
const AI_SOURCE = /chatgpt|openai|perplexity|claude|anthropic|gemini|bard|copilot|you\.com|phind|deepseek|poe\.com|meta\.ai|mistral/i;
const SITE = "https://atishaykasliwal.com";
const BRAND = /atishay|kasliwal/i;
let cache = null;

const b64url = data => btoa(typeof data === "string" ? data : String.fromCharCode(...new Uint8Array(data)))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function accessToken(account) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: account.client_email, scope: SCOPES, aud: account.token_uri ?? "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(account.private_key.replace(/-----[^-]+-----|\s/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const response = await fetch(account.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(signature)}` }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description ?? body.error ?? "token request failed");
  return body.access_token;
}

const rowsOf = report => (report.rows ?? []).map(row => ({
  dims: (row.dimensionValues ?? []).map(d => d.value),
  vals: (row.metricValues ?? []).map(m => Number(m.value)),
}));

async function analytics(token, propertyId) {
  const current = { startDate: "28daysAgo", endDate: "yesterday" };
  const previous = { startDate: "56daysAgo", endDate: "29daysAgo" };
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [
      { dateRanges: [current, previous], metrics: ["activeUsers", "newUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"].map(name => ({ name })) },
      { dateRanges: [current], dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }], metrics: [{ name: "sessions" }, { name: "engagementRate" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 25 },
      { dateRanges: [current], dimensions: [{ name: "landingPage" }], metrics: [{ name: "sessions" }, { name: "engagementRate" }, { name: "averageSessionDuration" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 15 },
      { dateRanges: [current], dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 8 },
      { dateRanges: [current], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
    ] }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? "Analytics request failed");
  const [totals, sources, landing, countries, channels] = body.reports;
  const t = rowsOf(totals);
  const pick = range => {
    const row = t.find(r => r.dims.at(-1) === range) ?? t[range === "date_range_0" ? 0 : 1];
    const [users, newUsers, sessions, views, engagementRate, avgDuration] = row?.vals ?? [0, 0, 0, 0, 0, 0];
    return { users, newUsers, sessions, views, engagementRate, avgDuration };
  };
  const sourceRows = rowsOf(sources).map(r => ({ source: r.dims[0], medium: r.dims[1], sessions: r.vals[0], engagementRate: r.vals[1] }));
  return {
    current: pick("date_range_0"),
    previous: pick("date_range_1"),
    channels: rowsOf(channels).map(r => ({ channel: r.dims[0], sessions: r.vals[0] })),
    sources: sourceRows,
    aiReferrals: sourceRows.filter(r => AI_SOURCE.test(r.source)),
    landingPages: rowsOf(landing).map(r => ({ page: r.dims[0], sessions: r.vals[0], engagementRate: r.vals[1], avgDuration: r.vals[2] })),
    countries: rowsOf(countries).map(r => ({ country: r.dims[0], users: r.vals[0] })),
  };
}

async function searchConsole(token, property) {
  const day = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const query = async body => {
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: day(30), endDate: day(3), ...body }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error?.message ?? "Search Console request failed");
    return json.rows ?? [];
  };
  const [totals, queries, pages] = await Promise.all([
    query({}),
    query({ dimensions: ["query"], rowLimit: 50 }),
    query({ dimensions: ["page"], rowLimit: 25 }),
  ]);
  const shape = r => ({ key: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  return { range: [day(30), day(3)], totals: shape(totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }), queries: queries.map(shape), pages: pages.map(shape) };
}

// Turn the numbers into concrete suggestions, in the same shape as the build-time ones.
function trafficSuggestions(ga, gsc) {
  const out = [];
  const add = s => out.push({ pages: [], steps: [], source: "live", ...s });
  if (gsc) {
    const lowCtr = gsc.queries.filter(q => q.impressions >= 20 && q.ctr < 0.02);
    if (lowCtr.length) add({ id: "low-ctr", impact: "high", area: "Search results", effort: "Quick fix",
      title: `${lowCtr.length} search${lowCtr.length > 1 ? "es show" : " shows"} your site but almost nobody clicks`,
      why: "Google already ranks you for these. A title and description that answer the searcher's question is the cheapest traffic you can get.",
      steps: lowCtr.slice(0, 10).map(q => `"${q.key}": ${q.impressions} impressions, ${(q.ctr * 100).toFixed(1)}% click rate, position ${q.position.toFixed(1)}`) });
    const nearly = gsc.queries.filter(q => q.position > 3 && q.position <= 15 && q.impressions >= 10);
    if (nearly.length) add({ id: "striking", impact: "medium", area: "Search results", effort: "About an hour",
      title: `${nearly.length} search${nearly.length > 1 ? "es are" : " is"} close to the top of page 1`,
      why: "Positions 4 to 15 get a fraction of the clicks of the top 3. More depth on the matching page and a link to it from the homepage or a related page usually moves these up.",
      steps: nearly.slice(0, 10).map(q => `"${q.key}": position ${q.position.toFixed(1)}, ${q.impressions} impressions`) });
    const branded = gsc.queries.filter(q => BRAND.test(q.key ?? "")).reduce((s, q) => s + q.impressions, 0);
    const all = gsc.queries.reduce((s, q) => s + q.impressions, 0);
    if (all > 0 && branded / all > 0.7) add({ id: "branded", impact: "medium", area: "Traffic", effort: "About an hour",
      title: `${Math.round((branded / all) * 100)}% of search impressions are for your name`,
      why: "People who already know your name find you. Recruiters searching for skills (for example \"AI engineer distributed systems New York\") do not yet. Project write-ups that name the problem, stack and result are what rank for those searches.",
      steps: ["Give each project page a paragraph on the problem and the result, with the technologies named in plain words.", "Link each project from the experience page it came out of."] });
  }
  if (ga) {
    const ai = ga.aiReferrals.reduce((s, r) => s + r.sessions, 0);
    if (ai === 0) add({ id: "ai-referrals", impact: "medium", area: "AI assistants", effort: "Your action",
      title: "No visits from AI assistants yet",
      why: "Nobody has reached the site from ChatGPT, Perplexity, Claude, Gemini or Copilot in the last 28 days. Assistants cite pages they can crawl and whose facts match across the web.",
      steps: ["Allow AI crawlers in Cloudflare (see the AI assistants suggestion if it is listed).", "Add the site to Bing Webmaster Tools: ChatGPT search and Copilot draw on Bing's index.", "Keep job titles, dates and numbers identical on the site, LinkedIn, GitHub and the résumé."] });
    const weak = ga.landingPages.filter(p => p.sessions >= 10 && p.engagementRate < 0.4);
    if (weak.length) add({ id: "weak-landing", impact: "medium", area: "Engagement", effort: "About an hour",
      title: `${weak.length} landing page${weak.length > 1 ? "s lose" : " loses"} most visitors straight away`,
      why: "An engagement rate under 40% means most visitors leave within 10 seconds without clicking. Usually the first screen does not answer why they came.",
      steps: weak.map(p => `${p.page}: ${p.sessions} sessions, ${(p.engagementRate * 100).toFixed(0)}% engaged, ${Math.round(p.avgDuration)}s average`) });
    const prev = ga.previous.sessions, cur = ga.current.sessions;
    if (prev >= 20 && cur < prev * 0.75) add({ id: "drop", impact: "high", area: "Traffic", effort: "About an hour",
      title: `Sessions fell ${Math.round((1 - cur / prev) * 100)}% versus the previous 28 days`,
      why: "A drop this size usually means lost rankings, a broken page, or a referral that stopped linking.",
      steps: ["Compare the Sources table with the previous period in Google Analytics.", "Check Search Console → Pages for newly unindexed pages."] });
  }
  return out;
}

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return Response.json({ error: "forbidden" }, { status: admin.status });
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return Response.json(cache.body, { headers: { "Cache-Control": "no-store" } });

  const connected = { analytics: Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON && env.GA4_PROPERTY_ID), searchConsole: Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON) };
  const body = { connected, generatedAt: new Date().toISOString(), analytics: null, searchConsole: null, errors: {}, suggestions: [] };
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) return Response.json(body, { headers: { "Cache-Control": "no-store" } });

  let token;
  try {
    const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    body.serviceAccount = account.client_email;
    token = await accessToken(account);
  } catch (error) {
    body.errors.auth = error.message;
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  }
  const [ga, gsc] = await Promise.allSettled([
    connected.analytics ? analytics(token, env.GA4_PROPERTY_ID) : Promise.resolve(null),
    searchConsole(token, env.GSC_PROPERTY || "sc-domain:atishaykasliwal.com"),
  ]);
  if (ga.status === "fulfilled") body.analytics = ga.value; else body.errors.analytics = ga.reason.message;
  if (gsc.status === "fulfilled") body.searchConsole = gsc.value; else body.errors.searchConsole = gsc.reason.message;
  body.suggestions = trafficSuggestions(body.analytics, body.searchConsole);
  body.site = SITE;
  cache = { at: Date.now(), body };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

// Exported for tests only.
export { accessToken as _accessToken, trafficSuggestions as _trafficSuggestions };
