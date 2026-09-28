// Work history and education, in the same shape createProjectCarousel expects for a
// project: name, category, tag, theme, card (art), plus caseStudy linking to the full
// /experience/<slug>/ page (see src/experience-pages.js).
// `card` reuses the site's existing .mock-nav / .mock-bottom pattern (see FedTalk,
// InsureRaft in src/projects.js) rather than inventing a new card language.
const entry = ({ slug, tag, role, place, start, end, theme, highlight, description }) => {
  const art = `
    <div class="mock-nav"><b>${tag}</b><span>${start} – ${end}</span></div>
    <div class="timeline-title">${role}</div>
    <div class="mock-bottom"><span>${place}</span><span>${highlight}</span></div>`;
  return {
    name: role,
    category: `${place} · ${start} – ${end}`,
    tag,
    theme,
    description,
    year: Number(start.match(/\d{4}/)[0]),
    caseStudy: `/experience/${slug}/`,
    caseStudyLabel: "View details",
    card: art,
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
    theme: "timeline timeline-a",
    highlight: "10K+ FOMC intervals",
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
    theme: "timeline timeline-b",
    highlight: "50,000+ scans",
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
    theme: "timeline timeline-c",
    highlight: "100,000+ MAU",
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
    theme: "timeline timeline-d",
    highlight: "$50K daily revenue",
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
    theme: "timeline timeline-e",
    highlight: "Big data · NLP",
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
    theme: "timeline timeline-f",
    highlight: "Distributed systems",
    description:
      "Coursework in distributed systems, machine learning, data structures and algorithms.",
  }),
];
