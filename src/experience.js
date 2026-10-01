// Work history and education, in the same shape createProjectCarousel expects for a
// project: name, category, tag, theme, card (art), plus caseStudy linking to the full
// /experience/<slug>/ page (see src/experience-pages.js).
// `card`/`art` use the same real photos as the lead image on each entry's own page
// (see src/experience-pages.js's media.items[0]), not an invented illustration.
const entry = ({ slug, tag, role, place, start, end, photo, thumb, alt, description }) => {
  const card = `<img src="/experience/media/${slug}/${photo}-thumb.webp" width="${thumb[0]}" height="${thumb[1]}" alt="" decoding="async" />`;
  const art = `<img src="/experience/media/${slug}/${photo}.webp" alt="" decoding="async" />`;
  return {
    name: role,
    category: `${place} · ${start} – ${end}`,
    tag,
    theme: "photo-card",
    description,
    year: Number(start.match(/\d{4}/)[0]),
    caseStudy: `/experience/${slug}/`,
    caseStudyLabel: "View details",
    alt,
    card,
    // project-preview.js reads .art directly (not .card ?? .art) for the dialog's
    // main canvas, so both need the same markup.
    art,
  };
};

export const experience = [
  entry({
    slug: "stony-brook-research",
    tag: "WORK",
    role: "Software Engineer, Research",
    place: "Stony Brook University",
    start: "Nov 2024",
    end: "May 2026",
    photo: "quad",
    thumb: [360, 240],
    alt: "Stony Brook's campus quad in autumn",
    description:
      "Event-driven research infrastructure and production AI services: an async backend ingesting 10,000+ FOMC intervals, LLM service components that cut inference timeouts 80%, and DevOps changes that took one experiment loop from 6 hours to 90 seconds.",
  }),
  entry({
    slug: "wake-forest-cair",
    tag: "WORK",
    role: "Artificial Intelligence Engineer",
    place: "Wake Forest CAIR",
    start: "May 2025",
    end: "Aug 2025",
    photo: "chapel",
    thumb: [360, 202],
    alt: "Wait Chapel on Wake Forest's campus",
    description:
      "Cloud-native PyTorch model serving on GCP and Terraform across 50,000+ medical-imaging scans and 10 TB of data, with automated curation that cut preprocessing from 4 hours to 18 minutes at 95% radiologist concordance.",
  }),
  entry({
    slug: "accolite",
    tag: "WORK",
    role: "Senior Software Engineer",
    place: "Accolite",
    start: "Aug 2021",
    end: "Aug 2024",
    photo: "brand",
    thumb: [360, 202],
    alt: "Accolite brand mark",
    description:
      "20+ production microservices across fintech, telecom and commerce, supporting $1M+ in transactions and 100,000+ monthly users at 99.9% uptime, plus a secure insurance data vault across 15+ providers and CI/CD standardized over 8 teams.",
  }),
  entry({
    slug: "shriffle",
    tag: "WORK",
    role: "Software Engineer Intern",
    place: "Shriffle",
    start: "Aug 2020",
    end: "May 2021",
    photo: "brand-2",
    thumb: [360, 180],
    alt: "Shriffle brand mark",
    description:
      "Billing microservices in Spring Boot processing $50,000 in daily revenue, a real-time React operations dashboard that cut support tickets 30%, and automated test coverage raised to 99% ahead of production deploys.",
  }),
  entry({
    slug: "stony-brook-university",
    tag: "EDU",
    role: "M.S. in Data Science",
    place: "Stony Brook University",
    start: "Aug 2024",
    end: "May 2026",
    photo: "stadium",
    thumb: [360, 221],
    alt: "Stony Brook University stadium filled for commencement",
    description:
      "Statistical learning, big data algorithms and data management, and a semester of applied mathematics built around natural language processing.",
  }),
  entry({
    slug: "symbiosis-university",
    tag: "EDU",
    role: "B.Tech, Computer Science",
    place: "Symbiosis University",
    start: "May 2018",
    end: "May 2022",
    photo: "campus-2",
    thumb: [360, 240],
    alt: "Symbiosis University campus grounds",
    description:
      "Coursework in distributed systems, machine learning, data structures and algorithms.",
  }),
];
