// Fetches the homepage GitHub activity: the latest public push, daily contributions for the
// last 30 days, pull requests merged into other people's repositories, and a short history of
// recent pull requests, pushes, issues, replies and reviews. Uses only fetch, so it runs both in
// Node (scripts/fetch-github-activity.mjs, at build time) and in the Pages Function
// (functions/api/github-activity.js, which keeps the live homepage current between builds).

const LOGIN = "atishay-kasliwal";

export async function fetchGithubActivity(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "atishaykasliwal.com",
  };
  async function github(url, options = {}) {
    const response = await fetch(`https://api.github.com${url}`, { ...options, headers });
    if (!response.ok) throw new Error(`GitHub ${url}: ${response.status} ${await response.text()}`);
    return response.json();
  }

  // Everything except the organisation lookups is independent, so it is requested at once.
  const mergedQuery = `is:pr author:${LOGIN} is:merged -user:${LOGIN}`;
  const search = (q, params) => github(`/search/issues?${params}&q=${encodeURIComponent(q)}`);
  const [{ data, errors }, authored, issues, events, merged] = await Promise.all([github("/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar { weeks { contributionDays { date contributionCount } } }
        }
        repositories(first: 40, privacy: PUBLIC, ownerAffiliations: [OWNER], orderBy: { field: PUSHED_AT, direction: DESC }) {
          nodes { nameWithOwner pushedAt parent { nameWithOwner } }
        }
      } }`,
      variables: { login: LOGIN, from: new Date(Date.now() - 30 * 86400000).toISOString(), to: new Date().toISOString() },
    }),
  }),
    search(`is:pr author:${LOGIN}`, "per_page=50&sort=updated&order=desc"),
    search(`is:issue author:${LOGIN} -user:${LOGIN}`, "per_page=30&sort=created&order=desc"),
    github(`/users/${LOGIN}/events/public?per_page=100`),
    search(mergedQuery, "per_page=100"),
  ]);
  if (errors) throw new Error(`GitHub GraphQL: ${JSON.stringify(errors)}`);
  const days = data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap(week => week.contributionDays)
    .slice(-30)
    .map(day => day.contributionCount);

  // Pushes come from each public repository's last push time: the events API is delayed by hours
  // and can miss pushes entirely. A fork's push is work on the upstream project, so it is named after
  // that project. Private repositories are never listed.
  const since = Date.now() - 30 * 86400000;
  const pushes = [];
  for (const node of data.user.repositories.nodes) {
    const repo = node.parent?.nameWithOwner ?? node.nameWithOwner;
    if (!node.pushedAt || pushes.some(push => push.repo === repo)) continue;
    pushes.push({ kind: "pushed", repo, url: `https://github.com/${repo}`, at: node.pushedAt });
  }
  const latestPush = pushes[0] ?? null;

  // History for the dropdown. The events API no longer carries pull request titles, so pull
  // requests come from search (merged, or still open); the events add reviews of others' PRs.
  const history = authored.items.flatMap(item => {
    const repo = item.repository_url.split("/repos/")[1];
    const mergedAt = item.pull_request?.merged_at;
    if (mergedAt) return [{ kind: "merged", repo, number: item.number, title: item.title, url: item.html_url, at: mergedAt }];
    if (item.state === "open") return [{ kind: "opened", repo, number: item.number, title: item.title, url: item.html_url, at: item.created_at }];
    return [];
  });
  history.push(...pushes);
  // Issues I opened in other people's projects (my own repositories hold planning issues).
  for (const item of issues.items) {
    history.push({ kind: "issue", repo: item.repository_url.split("/repos/")[1], number: item.number, title: item.title, url: item.html_url, at: item.created_at });
  }

  // Review events on my own pull requests are replies to reviewers, not reviews.
  const seen = new Set(authored.items.map(item => `${item.repository_url.split("/repos/")[1]}#${item.number}`));
  // Replies on issues and pull requests in other people's projects, once per thread at the latest
  // reply (events arrive newest first).
  const replied = new Set();
  for (const event of events) {
    if (!["IssueCommentEvent", "PullRequestReviewCommentEvent"].includes(event.type) || event.payload.action !== "created") continue;
    if (event.repo.name.startsWith(`${LOGIN}/`)) continue;
    const thread = event.payload.issue ?? event.payload.pull_request;
    const key = `${event.repo.name}#${thread?.number}`;
    if (!thread || replied.has(key)) continue;
    replied.add(key);
    history.push({ kind: "replied", repo: event.repo.name, number: thread.number, title: thread.title, url: event.payload.comment?.html_url ?? thread.html_url, at: event.created_at });
  }

  for (const event of events) {
    if (event.type !== "PullRequestReviewEvent" || event.payload.action !== "created") continue;
    const number = event.payload.pull_request?.number;
    const key = `${event.repo.name}#${number}`;
    if (number && !seen.has(key)) {
      history.push({ kind: "reviewed", repo: event.repo.name, number, url: `https://github.com/${event.repo.name}/pull/${number}`, at: event.created_at });
    }
    seen.add(key);
  }
  const recent = history
    .filter(item => new Date(item.at).getTime() >= since)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 60);

  // Organisations, so the page can show a recognisable company name and logo instead of an org
  // slug. Names come from each organisation's own profile; a few are shortened to the name people
  // know (dsx-ai-factory's profile links to nvidia.com). Personal accounts get no company label.
  const companyNames = { "dsx-ai-factory": "NVIDIA", "redhat-developer": "Red Hat", "cockpit-project": "Cockpit" };
  const titleCase = slug => slug.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
  const logins = [...new Set([...recent, latestPush].filter(Boolean).map(item => item.repo.split("/")[0]))];
  const owners = Object.fromEntries(await Promise.all(logins.map(async login => {
    const owner = await github(`/users/${login}`);
    const name = owner.type === "Organization"
      ? companyNames[login] ?? (owner.name ?? titleCase(login)).replace(/,? Inc\.?$/, "").split(" - ")[0]
      : null;
    return [login, { name, avatar: `${owner.avatar_url}${owner.avatar_url.includes("?") ? "&" : "?"}s=48` }];
  })));

  const repositories = new Set(merged.items.map(item => item.repository_url.split("/repos/")[1]));

  return {
    login: LOGIN,
    profileUrl: `https://github.com/${LOGIN}`,
    fetchedAt: new Date().toISOString(),
    lastPush: latestPush && { repo: latestPush.repo, url: latestPush.url, at: latestPush.at },
    recent,
    owners,
    contributionsLast30Days: days.reduce((sum, count) => sum + count, 0),
    dailyContributions: days,
    mergedUpstream: {
      pullRequests: merged.total_count,
      repositories: repositories.size,
      url: `https://github.com/search?type=pullrequests&q=${encodeURIComponent(mergedQuery)}`,
    },
  };
}
