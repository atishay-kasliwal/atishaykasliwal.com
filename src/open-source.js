// Open source contributions: projects owned by other people or organisations where pull
// requests were merged. Same shape createProjectCarousel expects for a project. There are no
// pages for these; the preview window links to the merged pull requests on GitHub.
// Card art lives in public/open-source/cards/ (1080×664 plus a 640px variant).
const AUTHOR = "atishay-kasliwal";

const entry = ({ slug, name, repo, merged, stack, description, featured }) => {
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
  entry({ slug: "keycloak", name: "Keycloak", repo: "keycloak/keycloak", merged: 1, stack: "Java · TypeScript",
    description: "Open source identity and access management.", featured: "Name the masthead options toggle shown on narrow screens" }),
  entry({ slug: "pr-agent", name: "PR-Agent", repo: "The-PR-Agent/pr-agent", merged: 1, stack: "Python",
    description: "The original open-source AI pull request reviewer.", featured: "Record the keys PR comments can override" }),
  entry({ slug: "cockpit", name: "Cockpit", repo: "cockpit-project/cockpit", merged: 2, stack: "Python · JavaScript · C",
    description: "A web-based graphical interface for servers.", featured: "Make the terminal scrollbar visible again" }),
  entry({ slug: "aura", name: "Aura", repo: "mezmo/aura", merged: 9, stack: "Rust · Python",
    description: "Mezmo's production-tested SRE agent platform.", featured: "Apply client_tool_filter when preparing a single agent" }),
  entry({ slug: "kiali", name: "Kiali", repo: "kiali/kiali", merged: 1, stack: "Go · TypeScript",
    description: "Observability for the Istio service mesh.", featured: "Bound kube cache reads with a timeout" }),
  entry({ slug: "mapt", name: "mapt", repo: "redhat-developer/mapt", merged: 4, stack: "Go · Shell",
    description: "Red Hat's multi-architecture provisioning tool.", featured: "Stop password aging locking users out of SSH" }),
  entry({ slug: "numaflow", name: "Numaflow", repo: "numaproj/numaflow", merged: 4, stack: "Rust · Go",
    description: "Kubernetes-native platform for massively parallel streaming jobs.", featured: "Reject scale.min above scale.max on a MonoVertex" }),
  entry({ slug: "nvkr", name: "NVKR", repo: "dsx-ai-factory/nvkr", merged: 5, stack: "Go · Shell",
    description: "NVIDIA Kubernetes recipes for node images, packages and components.", featured: "Explain one component with catalog show" }),
  entry({ slug: "misterdownloadmanager", name: "Mister Download Manager", repo: "anefzaoui/misterdownloadmanager", merged: 3, stack: "Rust",
    description: "A clean-room download manager written in pure Rust.", featured: "Use system-installed yt-dlp on Linux and macOS" }),
  entry({ slug: "math-mcp", name: "math-mcp", repo: "EthanHenrickson/math-mcp", merged: 1, stack: "TypeScript",
    description: "Math and statistics tools for LLMs over MCP.", featured: "Fix median sorting as strings and report division by zero as an error" }),
  entry({ slug: "couch-tv", name: "couch-tv", repo: "Seagey/couch-tv", merged: 1, stack: "Python · JavaScript · Kotlin",
    description: "Your own Google TV home screen and phone remote.", featured: "The build fetches the TV's own icon for apps with no bundled logo" }),
];
