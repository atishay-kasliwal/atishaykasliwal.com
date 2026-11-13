// The homepage GitHub column's behaviour on every visit: relative and local clock times, and the
// history panel. The markup is prerendered by src/github-activity.js, which the page loads only
// later, to swap in live activity.

export const clockFormat = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };

// "Nov 10" in the prerendered HTML becomes "3h ago" once the page loads.
export function setupRelativeTimes(root = document) {
  const units = [["d", 86400], ["h", 3600], ["m", 60]];
  for (const element of root.querySelectorAll("time[data-relative]")) {
    const seconds = (Date.now() - new Date(element.dateTime).getTime()) / 1000;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds >= 30 * 86400) continue;
    const [unit, size] = units.find(([, size]) => seconds >= size) ?? ["m", 60];
    element.textContent = `${Math.max(1, Math.floor(seconds / size))}${unit} ago`;
    element.title = new Date(element.dateTime).toLocaleString();
  }
}

// Clock times in the visitor's own time zone: "4:35 PM" today, "Nov 10, 6:35 PM" before.
export function setupClockTimes(root = document) {
  const today = new Date().toDateString();
  for (const element of root.querySelectorAll("time[data-clock]")) {
    const date = new Date(element.dateTime);
    if (Number.isNaN(date.getTime())) continue;
    element.textContent = date.toDateString() === today
      ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : date.toLocaleString("en-US", clockFormat);
  }
}

// A disclosure: the button toggles the panel; Escape, a click outside, or tabbing out closes it.
export function setupGithubFeed() {
  const trigger = document.querySelector(".github-trigger");
  const feed = trigger && document.getElementById(trigger.getAttribute("aria-controls"));
  if (!feed) return;
  const setOpen = open => {
    trigger.setAttribute("aria-expanded", String(open));
    feed.hidden = !open;
  };
  trigger.addEventListener("click", () => setOpen(feed.hidden));
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || feed.hidden) return;
    setOpen(false);
    trigger.focus();
  });
  document.addEventListener("pointerdown", event => {
    if (!feed.hidden && !feed.contains(event.target) && !trigger.contains(event.target)) setOpen(false);
  });
  feed.addEventListener("focusout", event => {
    if (event.relatedTarget && !feed.contains(event.relatedTarget) && event.relatedTarget !== trigger) setOpen(false);
  });
}
