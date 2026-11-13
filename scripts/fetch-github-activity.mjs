// Writes src/github-activity.json, the snapshot the build prerenders into the homepage, so builds
// never call GitHub. The deploy workflow refreshes it on every deploy; if a fetch fails, the
// existing file is kept. Between deploys, functions/api/github-activity.js keeps the live page
// current. The fetching itself is in src/github-activity-fetch.js.
//
// Auth: GITHUB_TOKEN, or the GitHub CLI's token locally.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGithubActivity } from "../src/github-activity-fetch.js";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/github-activity.json");

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync("gh auth token", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Error("Set GITHUB_TOKEN or sign in with the GitHub CLI.");
  }
}

const activity = await fetchGithubActivity(token());
fs.writeFileSync(file, `${JSON.stringify(activity, null, 2)}\n`);
console.log(
  `GitHub activity: last push ${activity.lastPush?.repo ?? "none"}, ${activity.contributionsLast30Days} contributions in 30 days, ` +
    `${activity.mergedUpstream.pullRequests} PRs merged into ${activity.mergedUpstream.repositories} repositories, ${activity.recent.length} history items.`,
);
