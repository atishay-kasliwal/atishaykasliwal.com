// Writes src/profile/open-source-contributions.json: every pull request Atishay opened in a
// repository he does not own, with the state GitHub reports for it, and the pull requests by other
// people that he reviewed. The canonical profile (src/profile/build.js) reads this snapshot, so a
// build never calls GitHub and "merged" always means GitHub's own `merged: true`, never a guess.
//
// Like scripts/fetch-github-activity.mjs, the deploy workflow refreshes it and keeps the committed
// file if GitHub is unavailable. Run it locally with `npm run profile:contributions`.
//
// Auth: GITHUB_TOKEN, or the GitHub CLI's token locally.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = "atishay-kasliwal";
const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/profile/open-source-contributions.json");

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync("gh auth token", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throw new Error("Set GITHUB_TOKEN or sign in with the GitHub CLI.");
  }
}

async function graphql(auth, query, variables) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth}`, "User-Agent": "atishaykasliwal.com", "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GitHub GraphQL: ${response.status} ${await response.text()}`);
  const body = await response.json();
  if (body.errors) throw new Error(`GitHub GraphQL: ${JSON.stringify(body.errors)}`);
  return body.data;
}

// GitHub search returns at most 1,000 results per query, far above the current count.
async function searchPullRequests(auth, q) {
  const query = `query($q: String!, $after: String) {
    search(query: $q, type: ISSUE, first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ... on PullRequest {
        number title url state merged mergedAt createdAt closedAt isDraft
        author { login }
        repository { nameWithOwner url isPrivate primaryLanguage { name } }
      } }
    }
  }`;
  const results = [];
  let after = null;
  do {
    const { search } = await graphql(auth, query, { q, after });
    results.push(...search.nodes.filter(node => node?.number));
    after = search.pageInfo.hasNextPage ? search.pageInfo.endCursor : null;
  } while (after);
  return results.filter(node => !node.repository.isPrivate);
}

const state = node => (node.merged ? "merged" : node.state === "OPEN" ? "open" : "closed");
const byRepoThenNumber = (a, b) => a.repository.localeCompare(b.repository) || a.number - b.number;

const auth = token();
const [authored, reviewed] = await Promise.all([
  searchPullRequests(auth, `is:pr author:${LOGIN} -user:${LOGIN}`),
  searchPullRequests(auth, `is:pr reviewed-by:${LOGIN} -author:${LOGIN} -user:${LOGIN}`),
]);

const languages = {};
for (const node of [...authored, ...reviewed]) {
  languages[node.repository.nameWithOwner] = node.repository.primaryLanguage?.name ?? null;
}

const snapshot = {
  login: LOGIN,
  verifiedAt: new Date().toISOString(),
  source: "GitHub GraphQL API: search is:pr author:atishay-kasliwal -user:atishay-kasliwal, and reviewed-by for reviews",
  repositoryLanguages: Object.fromEntries(Object.entries(languages).sort(([a], [b]) => a.localeCompare(b))),
  pullRequests: authored
    .map(node => ({
      repository: node.repository.nameWithOwner,
      number: node.number,
      title: node.title.trim(),
      url: node.url,
      state: state(node),
      draft: node.isDraft,
      createdAt: node.createdAt,
      mergedAt: node.mergedAt,
      closedAt: node.closedAt,
    }))
    .sort(byRepoThenNumber),
  reviews: reviewed
    .map(node => ({
      repository: node.repository.nameWithOwner,
      number: node.number,
      title: node.title.trim(),
      url: node.url,
      author: node.author?.login ?? null,
      state: state(node),
    }))
    .sort(byRepoThenNumber),
};

fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
const count = s => snapshot.pullRequests.filter(pr => pr.state === s).length;
console.log(
  `Open source: ${snapshot.pullRequests.length} pull requests (${count("merged")} merged, ${count("open")} open, ${count("closed")} closed unmerged), ` +
    `${snapshot.reviews.length} reviews of other contributors' pull requests.`,
);
