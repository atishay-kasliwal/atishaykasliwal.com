// Renders the homepage GitHub column from src/github-activity.json (written by
// scripts/fetch-github-activity.mjs). The build prerenders the markup. In the browser this module
// is loaded only after the page is idle, for setupLiveGithub(), which swaps in newer activity from
// /api/github-activity; the small behaviours every visit needs are in src/github-feed.js.
import { clockFormat, setupClockTimes, setupRelativeTimes } from "./github-feed.js";


const escape = value => String(value).replace(/[&<>"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
})[character]);
const external = 'target="_blank" rel="noopener noreferrer"';
const number = value => value.toLocaleString("en-US");
const shortDate = iso => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
const time = iso => `<time datetime="${escape(iso)}" data-relative>${shortDate(iso)}</time>`;
const clock = iso => `<time datetime="${escape(iso)}" data-clock>${new Date(iso).toLocaleString("en-US", { ...clockFormat, timeZone: "America/New_York" })}</time>`;

// My own repositories show their product's mark instead of my profile photo: Atriveo's "A"
// (the same mark atriveo.com serves as its favicon) or this site's icon.
const atriveoMark = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="18" fill="#0a0c12"/><path d="M50 12L88 88H76L50 38L24 88H12L50 12Z" fill="#f6f5f1"/><path d="M43 65L50 56L57 65L50 61L43 65Z" fill="#4e86ff"/></svg>')}`;
const products = [
  { match: /^atishay-kasliwal\/atriveo/i, company: "Atriveo", avatar: atriveoMark },
  { match: /^atishay-kasliwal\//, company: null, avatar: "/favicon.svg" },
];

// "dsx-ai-factory/nvkr" → { company: "NVIDIA", repo: "nvkr", avatar }. Personal accounts have no company.
function source(activity, fullName) {
  const [login, repo] = fullName.split("/");
  const product = products.find(({ match }) => match.test(fullName));
  if (product) return { company: product.company, repo: repo ?? fullName, avatar: product.avatar };
  const owner = activity.owners?.[login] ?? {};
  return { company: owner.name ?? null, repo: repo ?? fullName, avatar: owner.avatar ?? null };
}
const sourceLabel = ({ company, repo }) => (company ? `${escape(company)} <span class="github-slash">/</span> ${escape(repo)}` : escape(repo));
const logo = (avatar, className, eager = false) =>
  avatar ? `<img class="${className}" src="${escape(avatar)}" width="24" height="24" alt="" ${eager ? "" : 'loading="lazy" '}decoding="async" />` : `<span class="${className}"></span>`;

const githubMark = '<svg class="github-mark" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';
const chevron = '<svg class="github-chevron" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
// Octicon git-merge (© GitHub, Inc., MIT License), beside the count of PRs merged upstream.
const mergeIcon = '<svg class="github-merged-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"/></svg>';

// One bar per day for the last 30 days. Any active day starts at half height and the rest is a
// log scale, so one very busy day doesn't flatten ordinary days; days off stay a short stub.
// Busier days are slightly brighter, and today is drawn brightest.
function sparkline(days) {
  const peak = Math.log1p(Math.max(1, ...days));
  const bars = days.map((count, index) => {
    const level = count === 0 ? 0 : Math.log1p(count) / peak;
    const height = count === 0 ? 0.12 : 0.5 + 0.5 * level;
    const today = index === days.length - 1 ? ' class="is-current"' : "";
    return `<i${today} style="--i:${index};--h:${height.toFixed(3)};--level:${level.toFixed(3)}"></i>`;
  });
  return `<span class="github-spark" aria-hidden="true">${bars.join("")}</span>`;
}

const kinds = {
  merged: "Merged",
  opened: "Opened",
  pushed: "Pushed",
  reviewed: "Reviewed",
  issue: "Issue",
  replied: "Replied",
};

// GitHub's own symbols for each kind of event: Octicons git-merge, git-pull-request, git-commit,
// code-review, issue-opened and comment (16px). Octicons © GitHub, Inc., MIT License.
const octicon = path => `<svg class="github-event-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="${path}"/></svg>`;
const icons = {
  merged: octicon("M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"),
  opened: octicon("M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"),
  pushed: octicon("M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"),
  reviewed: octicon("M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 13H8.061l-2.574 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-8.5C0 1.784.784 1 1.75 1ZM1.5 2.75v8.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Zm5.28 1.72a.75.75 0 0 1 0 1.06L5.31 7l1.47 1.47a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 0 1 1.06 0Zm2.44 0a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.69 7 9.22 5.53a.75.75 0 0 1 0-1.06Z"),
  issue: octicon("M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"),
  replied: octicon("M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z")
};

// One card: company logo, then the title over "kind · company · repo #number", with the
// relative time over the clock time on the right.
function historyItem(item, activity) {
  const from = source(activity, item.repo);
  const where = [from.company && escape(from.company), `${escape(from.repo)}${item.number ? ` #${item.number}` : ""}`].filter(Boolean).join(" · ");
  const title = item.title ? escape(item.title) : sourceLabel(from);
  const meta = `${icons[item.kind]}${kinds[item.kind]}</span>${item.title || item.number ? ` · ${where}` : ""}`;
  return `<li class="github-event is-${item.kind}">
              <a href="${escape(item.url)}" ${external} title="${escape(item.repo)}${item.number ? ` #${item.number}` : ""}">
                ${logo(from.avatar, "github-event-logo")}
                <span class="github-event-body">
                  <span class="github-event-title">${title}</span>
                  <span class="github-event-meta"><span class="github-event-kind">${meta}</span>
                </span>
                <span class="github-event-when">${time(item.at)}${clock(item.at)}</span>
              </a>
            </li>`;
}

// The masthead's GitHub column: one button (the latest push on the label line, the 30-day graph
// and totals beneath it) that opens a panel with recent history.
export function renderGithubColumn(activity) {
  const { lastPush, contributionsLast30Days: total, mergedUpstream, recent = [] } = activity;
  const label = [
    lastPush ? `Latest push to ${[source(activity, lastPush.repo).company, source(activity, lastPush.repo).repo].filter(Boolean).join(" ")}` : null,
    `${number(total)} contributions in the last 30 days`,
    `${number(mergedUpstream.pullRequests)} pull requests merged upstream`,
  ].filter(Boolean).join(", ");
  return `<h2 class="visually-hidden">GitHub</h2>
          <button class="github-trigger" type="button" data-fetched-at="${escape(activity.fetchedAt ?? "")}" aria-expanded="false" aria-controls="github-feed" aria-label="GitHub activity: ${escape(label)}. Show recent history">
            <span class="eyebrow github-eyebrow">${githubMark}${lastPush ? `<span class="github-push">Pushed ${logo(source(activity, lastPush.repo).avatar, "github-push-logo", true)}${sourceLabel(source(activity, lastPush.repo))}</span><span class="github-sep">·</span>${time(lastPush.at)}` : ""}</span>
            <span class="github-totals">${sparkline(activity.dailyContributions)}<span class="github-merged">${mergeIcon}${number(mergedUpstream.pullRequests)}</span>${chevron}</span>
          </button>
          <div class="github-feed" id="github-feed" hidden>
            <div class="github-feed-head">
              <p class="eyebrow">Recent activity</p>
              <p>Last 30 days</p>
            </div>
            <ol class="github-feed-list" tabindex="0" aria-label="Recent GitHub activity">
            ${recent.map(item => historyItem(item, activity)).join("\n            ")}
            </ol>
            <div class="github-feed-foot">
              <a href="${escape(activity.profileUrl)}" ${external}>Profile <span class="arrow" aria-hidden="true">↗︎</span></a>
              <a href="${escape(mergedUpstream.url)}" ${external}>All merged PRs <span class="arrow" aria-hidden="true">↗︎</span></a>
            </div>
          </div>`;
}

// The GitHub row in the phone details sheet.
export function renderGithubFact(activity) {
  const { lastPush, contributionsLast30Days: total, mergedUpstream, profileUrl } = activity;
  const push = lastPush ? `<a href="${escape(lastPush.url)}" ${external}>Pushed to ${sourceLabel(source(activity, lastPush.repo))}</a> · ${time(lastPush.at)}` : "";
  const contributions = `<a href="${escape(profileUrl)}" ${external}>${number(total)} in the last 30 days</a>`;
  const merged = `<a href="${escape(mergedUpstream.url)}" ${external}>${number(mergedUpstream.pullRequests)} PRs merged upstream <span class="arrow" aria-hidden="true">↗︎</span></a>`;
  return `<div class="github-fact">
          <dt>GitHub</dt>
          <dd>${push || contributions}<br /><span>${push ? `${contributions} · ` : ""}${merged}</span></dd>
        </div>`;
}

// The prerendered block is as old as the last deploy. Fetch the live activity and, if it is newer,
// re-render in place: the button and panel keep their elements (and listeners, and open state).
export async function setupLiveGithub() {
  const trigger = document.querySelector(".github-trigger");
  const feed = trigger && document.getElementById(trigger.getAttribute("aria-controls"));
  if (!feed) return;
  let activity;
  try {
    const response = await fetch("/api/github-activity");
    if (!response.ok) return;
    activity = await response.json();
  } catch {
    return;
  }
  if (!activity?.fetchedAt || !(activity.fetchedAt > (trigger.dataset.fetchedAt ?? ""))) return;

  const fresh = document.createElement("div");
  fresh.innerHTML = renderGithubColumn(activity);
  const freshTrigger = fresh.querySelector(".github-trigger");
  // Keep the bars (and their entrance animation) unless the counts changed.
  const spark = trigger.querySelector(".github-spark");
  const freshSpark = freshTrigger.querySelector(".github-spark");
  if (spark && freshSpark && spark.outerHTML === freshSpark.outerHTML) freshSpark.replaceWith(spark);
  trigger.replaceChildren(...freshTrigger.childNodes);
  trigger.setAttribute("aria-label", freshTrigger.getAttribute("aria-label"));
  trigger.dataset.fetchedAt = activity.fetchedAt;
  const scroll = feed.querySelector(".github-feed-list")?.scrollTop ?? 0;
  feed.innerHTML = fresh.querySelector(".github-feed").innerHTML;
  feed.querySelector(".github-feed-list").scrollTop = scroll;
  const updated = [trigger, feed];

  const fact = document.querySelector(".github-fact");
  if (fact) {
    fresh.innerHTML = renderGithubFact(activity);
    fact.innerHTML = fresh.firstElementChild.innerHTML;
    updated.push(fact);
  }
  for (const root of updated) {
    setupRelativeTimes(root);
    setupClockTimes(root);
  }
}
