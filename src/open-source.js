// Open source contributions: projects owned by other people or organisations where pull
// requests were merged. Same shape createProjectCarousel expects for a project. There are no
// pages for these; the preview window links to the merged pull requests on GitHub.
// Card art lives in public/open-source/cards/ (1080×664 plus a 640px variant).
// Merged counts come from the verified GitHub snapshot (npm run profile:contributions), the same
// file the canonical profile and /api/profile.json read, so the cards can never claim more.
import contributions from "./profile/open-source-contributions.json" with { type: "json" };

const AUTHOR = "atishay-kasliwal";
const mergedIn = repo => contributions.pullRequests.filter(pr => pr.repository === repo && pr.state === "merged").length;

const entry = ({ slug, name, repo, stack, description, featured }) => {
  const merged = mergedIn(repo);
  const src = `/open-source/cards/${slug}.webp`;
  const img = `<img src="${src}" srcset="/open-source/cards/${slug}-640.webp 640w, ${src} 1080w" sizes="305px" width="1080" height="664" alt="" decoding="async" />`;
  return {
    name,
    category: `${repo} · ${merged} merged`,
    tag: "OSS",
    theme: "photo-card",
    stack,
    year: 2026,
    description: `${description} Featured: “${featured}”.`,
    url: `https://github.com/${repo}/pulls?q=${encodeURIComponent(`is:pr is:merged author:${AUTHOR}`)}`,
    actionLabel: "View merged PRs",
    card: img,
    art: img,
  };
};

export const openSource = [
  entry({ slug: "keycloak", name: "Keycloak", repo: "keycloak/keycloak", stack: "Java · TypeScript",
    description: "Open source identity and access management.", featured: "Name the masthead options toggle shown on narrow screens" }),
  entry({ slug: "pr-agent", name: "PR-Agent", repo: "The-PR-Agent/pr-agent", stack: "Python",
    description: "The original open-source AI pull request reviewer.", featured: "Record the keys PR comments can override" }),
  entry({ slug: "cockpit", name: "Cockpit", repo: "cockpit-project/cockpit", stack: "Python · JavaScript · C",
    description: "A web-based graphical interface for servers.", featured: "Make the terminal scrollbar visible again" }),
  entry({ slug: "aura", name: "Aura", repo: "mezmo/aura", stack: "Rust · Python",
    description: "Mezmo's production-tested SRE agent platform.", featured: "Apply client_tool_filter when preparing a single agent" }),
  entry({ slug: "kiali", name: "Kiali", repo: "kiali/kiali", stack: "Go · TypeScript",
    description: "Observability for the Istio service mesh.", featured: "Bound kube cache reads with a timeout" }),
  entry({ slug: "mapt", name: "mapt", repo: "redhat-developer/mapt", stack: "Go · Shell",
    description: "Red Hat's multi-architecture provisioning tool.", featured: "Stop password aging locking users out of SSH" }),
  entry({ slug: "numaflow", name: "Numaflow", repo: "numaproj/numaflow", stack: "Rust · Go",
    description: "Kubernetes-native platform for massively parallel streaming jobs.", featured: "Reject scale.min above scale.max on a MonoVertex" }),
  entry({ slug: "nvkr", name: "NVKR", repo: "dsx-ai-factory/nvkr", stack: "Go · Shell",
    description: "NVIDIA Kubernetes recipes for node images, packages and components.", featured: "Explain one component with catalog show" }),
  entry({ slug: "misterdownloadmanager", name: "Mister Download Manager", repo: "anefzaoui/misterdownloadmanager", stack: "Rust",
    description: "A clean-room download manager written in pure Rust.", featured: "Use system-installed yt-dlp on Linux and macOS" }),
  entry({ slug: "math-mcp", name: "math-mcp", repo: "EthanHenrickson/math-mcp", stack: "TypeScript",
    description: "Math and statistics tools for LLMs over MCP.", featured: "Fix median sorting as strings and report division by zero as an error" }),
  entry({ slug: "couch-tv", name: "couch-tv", repo: "Seagey/couch-tv", stack: "Python · JavaScript · Kotlin",
    description: "Your own Google TV home screen and phone remote.", featured: "The build fetches the TV's own icon for apps with no bundled logo" }),
];
