#!/usr/bin/env node
// Loads github_collaboration_feedback.csv (or a dashboard export) into the D1 database.
//
//   npm run github:feedback:import -- <file.csv>            local D1 (wrangler dev state)
//   npm run github:feedback:import -- <file.csv> --remote   production D1
//   npm run github:feedback:import -- <file.csv> --dry-run  validate and write SQL only
//
// Options: --notes <collection_notes.json> (defaults to one next to the CSV), --refresh-github.
//
// Account avatars/types and repository visibility come from the GitHub API, using GITHUB_TOKEN
// or `gh auth token`, and are cached in .wrangler/github-feedback/. The generated SQL is written
// there too: it contains the feedback text, some from private repositories, so it stays out of git.
// Re-importing is safe: entries are matched by URL and manual sentiment corrections are kept.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsvObjects } from "../src/github-feedback-core/csv.js";
import { buildImportSql, countBySentiment, isBotLogin, normalizeRows } from "../src/github-feedback-core/records.js";

const DATABASE = "photography";
const WORK_DIR = path.resolve(".wrangler/github-feedback");
const CACHE_FILE = path.join(WORK_DIR, "github-cache.json");
const GHOST_AVATAR = "https://avatars.githubusercontent.com/u/10137?v=4";

function parseArgs(argv) {
  const args = { remote: false, dryRun: false, refresh: false, notes: null, file: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--remote") args.remote = true;
    else if (arg === "--local") args.remote = false;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--refresh-github") args.refresh = true;
    else if (arg === "--notes") args.notes = argv[++i];
    else if (arg.startsWith("--")) throw new Error(`unknown option ${arg}`);
    else if (!args.file) args.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (!args.file) throw new Error("usage: import-github-feedback.mjs <file.csv> [--remote] [--dry-run] [--notes file] [--refresh-github]");
  return args;
}

function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("set GITHUB_TOKEN or sign in with `gh auth login` to look up avatars and repository visibility");
  }
}

async function githubGet(token, apiPath) {
  const response = await fetch(`https://api.github.com/${apiPath}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "github-feedback-import" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${apiPath}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function mapLimit(items, limit, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

async function resolveGithub(records, refresh) {
  const cache = !refresh && existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : { accounts: {}, repositories: {} };
  const logins = new Set(records.flatMap(record => [record.authorLogin, record.repositoryOwner]));
  const repoNames = new Set(records.map(record => record.repository));
  const missingLogins = [...logins].filter(login => !cache.accounts[login]);
  const missingRepos = [...repoNames].filter(name => !cache.repositories[name]);
  if (missingLogins.length || missingRepos.length) {
    const token = githubToken();
    console.log(`Looking up ${missingLogins.length} accounts and ${missingRepos.length} repositories on GitHub…`);
    await mapLimit(missingLogins, 8, async login => {
      const user = await githubGet(token, `users/${encodeURIComponent(login)}`);
      cache.accounts[login] = user
        ? { login, type: user.type === "Bot" || user.type === "Organization" ? user.type : "User", avatarUrl: user.avatar_url, profileUrl: user.html_url }
        : { login, type: isBotLogin(login) ? "Bot" : "User", avatarUrl: GHOST_AVATAR, profileUrl: `https://github.com/${login}`, missing: true };
    });
    await mapLimit(missingRepos, 8, async fullName => {
      const repo = await githubGet(token, `repos/${fullName}`);
      cache.repositories[fullName] = { fullName, visibility: repo?.visibility ?? (repo ? (repo.private ? "private" : "public") : "unknown") };
    });
    mkdirSync(WORK_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`);
  }
  const accounts = new Map([...logins].map(login => [login, cache.accounts[login]]));
  const repositories = new Map([...repoNames].map(name => [name, { ...cache.repositories[name], owner: name.split("/")[0] }]));
  return { accounts, repositories };
}

function wrangler(args, { json = false } = {}) {
  const output = execFileSync("npx", ["wrangler", ...args], { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024 });
  return json ? JSON.parse(output) : output;
}

function query(target, sql) {
  const [result] = wrangler(["d1", "execute", DATABASE, target, "--json", "--command", sql], { json: true });
  return result.results;
}

const args = parseArgs(process.argv.slice(2));
const csvPath = path.resolve(args.file);
const { records: rawRows } = parseCsvObjects(readFileSync(csvPath, "utf8"));
const { records, errors } = normalizeRows(rawRows);
if (errors.length) {
  console.error(`${errors.length} rows are invalid; nothing was imported:\n  ${errors.slice(0, 25).join("\n  ")}`);
  process.exit(1);
}

const { accounts, repositories } = await resolveGithub(records, args.refresh);
// Automated accounts are Organization feedback even when the file says otherwise.
let reattributed = 0;
for (const record of records) {
  if (accounts.get(record.authorLogin)?.type === "Bot" && record.attribution !== "Organization") {
    record.attribution = "Organization";
    reattributed++;
  }
}

const notesPath = args.notes ?? path.join(path.dirname(csvPath), "collection_notes.json");
const notes = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, "utf8")) : {};
const now = new Date().toISOString();
const importRun = { id: `import-${now.replace(/[^0-9]/g, "").slice(0, 14)}`, sourceFile: path.basename(csvPath), periodStart: notes.start ?? null, periodEnd: notes.end ?? null, notes };
const sql = await buildImportSql({ records, accounts, repositories, importRun, now });
mkdirSync(WORK_DIR, { recursive: true });
const sqlPath = path.join(WORK_DIR, "import.sql");
writeFileSync(sqlPath, sql);

const counts = countBySentiment(records);
const missing = [...accounts.values()].filter(account => account.missing).map(account => account.login);
const privateRepos = [...repositories.values()].filter(repo => repo.visibility !== "public").map(repo => `${repo.fullName} (${repo.visibility})`);
console.log(`Validated ${counts.entries} entries: ${counts.Positive} Positive, ${counts.Neutral} Neutral, ${counts.Negative} Negative.`);
console.log(`${accounts.size} accounts, ${repositories.size} repositories, ${new Set(records.map(r => r.threadUrl)).size} threads.`);
if (reattributed) console.log(`Reattributed ${reattributed} automated entries to Organization.`);
if (missing.length) console.log(`Not found on GitHub (placeholder avatar used): ${missing.join(", ")}`);
if (privateRepos.length) console.log(`Not public: ${privateRepos.join(", ")}`);
console.log(`SQL written to ${path.relative(process.cwd(), sqlPath)}`);
if (args.dryRun) process.exit(0);

const target = args.remote ? "--remote" : "--local";
if (args.remote) {
  const tables = query(target, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'gh_feedback'");
  if (!tables.length) {
    console.error(`The remote database has no gh_feedback table. Apply migrations first:\n  npx wrangler d1 migrations apply ${DATABASE} --remote`);
    process.exit(1);
  }
} else {
  wrangler(["d1", "migrations", "apply", DATABASE, "--local"]);
}
wrangler(["d1", "execute", DATABASE, target, "--yes", "--file", sqlPath]);

const [{ n: imported }] = query(target, `SELECT COUNT(*) AS n FROM gh_feedback WHERE imported_at = '${now}'`);
if (imported !== records.length) {
  console.error(`Expected ${records.length} entries from this import in the database, found ${imported}.`);
  process.exit(1);
}
const totals = Object.fromEntries(query(target, "SELECT sentiment, COUNT(*) AS n FROM gh_feedback GROUP BY sentiment").map(row => [row.sentiment, row.n]));
const total = Object.values(totals).reduce((sum, n) => sum + n, 0);
console.log(`Imported ${imported} entries into ${args.remote ? "production" : "local"} D1. Database now holds ${total} entries: ${totals.Positive ?? 0} Positive, ${totals.Neutral ?? 0} Neutral, ${totals.Negative ?? 0} Negative.`);
