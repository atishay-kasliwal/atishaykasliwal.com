/**
 * Snapshots public GitHub data into src/data/generated/github.json at build time.
 *
 * Build-time rather than runtime, for three reasons: the client never spends a
 * round trip on api.github.com (which is rate-limited to 60/hr per IP for
 * unauthenticated callers and would throttle real visitors), the repo list is
 * prerenderable, and a GitHub outage cannot blank the page.
 *
 * Network failure is non-fatal — it keeps the previous snapshot so a flaky
 * network never breaks a deploy. Set GITHUB_TOKEN in CI to raise the rate limit.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'data', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'github.json');

const USERNAME = 'atishay-kasliwal';

/** Repos that are noise on a portfolio — forks, the site itself, scratch work. */
const EXCLUDE = new Set(['atishaykasliwal.com']);

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USERNAME}-site-build`,
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

async function get(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  let profile;
  let repos;

  try {
    [profile, repos] = await Promise.all([
      get(`https://api.github.com/users/${USERNAME}`),
      get(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed`),
    ]);
  } catch (err) {
    console.warn(`! GitHub fetch failed (${err.message}) — keeping existing snapshot`);
    try {
      await fs.access(OUT_FILE);
      return; // previous snapshot survives
    } catch {
      // Nothing cached: write an empty but valid shape so the build still works
      // and the page renders its empty state rather than crashing.
      await fs.writeFile(
        OUT_FILE,
        JSON.stringify({ profile: null, repos: [], languages: [], fetchedAt: null }, null, 2)
      );
      return;
    }
  }

  const cleaned = repos
    .filter((r) => !r.fork && !r.archived && !r.private && !EXCLUDE.has(r.name))
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      topics: r.topics || [],
      stars: r.stargazers_count,
      forks: r.forks_count,
      pushedAt: r.pushed_at,
      createdAt: r.created_at,
      license: r.license?.spdx_id || null,
    }))
    // Stars first, then recency — a starred repo is the stronger signal, but
    // with a young account recency carries most of the ordering.
    .sort((a, b) => b.stars - a.stars || new Date(b.pushedAt) - new Date(a.pushedAt));

  const langCounts = new Map();
  for (const r of cleaned) {
    if (r.language) langCounts.set(r.language, (langCounts.get(r.language) || 0) + 1);
  }

  const languages = [...langCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const payload = {
    profile: {
      login: profile.login,
      name: profile.name,
      bio: profile.bio,
      url: profile.html_url,
      avatar: profile.avatar_url,
      company: profile.company,
      location: profile.location,
      publicRepos: profile.public_repos,
      followers: profile.followers,
      createdAt: profile.created_at,
    },
    repos: cleaned,
    languages,
    totalStars: cleaned.reduce((sum, r) => sum + r.stars, 0),
    fetchedAt: new Date().toISOString(),
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`✓ GitHub snapshot: ${cleaned.length} repos, ${languages.length} languages`);
}

main().catch((err) => {
  console.error('✗ fetch-github failed\n', err);
  process.exit(1);
});
