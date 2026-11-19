// Shared by the private admin pages under /admin/. Everything from the API is rendered with
// textContent (via h), never as HTML.

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { credentials: "same-origin", ...options, headers: { Accept: "application/json", ...(options.headers ?? {}) } });
  } catch {
    // An expired Access session answers with a redirect to the sign-in host, which fetch cannot follow.
    throw new ApiError("The request did not complete. If your Cloudflare Access session expired, reload the page to sign in again.", 0, null);
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw new ApiError(body?.error ?? `${response.status} ${response.statusText}`, response.status, body);
  return body;
}

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "dataset") Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const formatBytes = bytes => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`);

export function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const time = iso => h("time", { datetime: iso, title: iso }, formatDate(iso));
export const shortSha = sha => (sha ? sha.slice(0, 12) : "—");

export function nav(current) {
  const pages = [
    ["resume", "Résumé", "/admin/resume/"],
    ["responses", "Responses", "/admin/responses/"],
  ];
  return h(
    "nav",
    { class: "admin-nav", "aria-label": "Admin" },
    pages.map(([id, label, href]) => h("a", { href, "aria-current": id === current ? "page" : null }, label)),
  );
}

export function download(filename, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = h("a", { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
