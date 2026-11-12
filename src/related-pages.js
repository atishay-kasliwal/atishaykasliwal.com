// "Related" links at the foot of each project and experience page: the projects that came out of
// a job, the job a project came from, and sibling products. Without these, every case study
// linked only home and to the next page, a dead end for readers and for search engines.
// Keys and hrefs are page paths; every href must be a real page (validate-seo checks links).
const P = {
  accolite: ["/experience/accolite/", "Senior Software Engineer, Accolite"],
  shriffle: ["/experience/shriffle/", "Software Engineer Intern, Shriffle"],
  sbuResearch: ["/experience/stony-brook-research/", "Software Engineer, Research, Stony Brook"],
  sbu: ["/experience/stony-brook-university/", "M.S. in Data Science, Stony Brook"],
  symbiosis: ["/experience/symbiosis-university/", "B.Tech, Symbiosis University"],
  cair: ["/experience/wake-forest-cair/", "AI Engineer, Wake Forest CAIR"],
  tracker: ["/projects/atriveo-tracker/", "Atriveo Tracker"],
  jobs: ["/projects/atriveo-job-search/", "Atriveo Job Search"],
  bio: ["/projects/atriveo-bio/", "Atriveo Bio"],
  cortex: ["/projects/atriveo-cortex/", "Atriveo Cortex"],
  reel: ["/projects/atriveo-reel/", "Atriveo Reel"],
  chaal: ["/projects/chaal-tech/", "Chaal.tech"],
  kaggriculture: ["/projects/kaggriculture/", "Kaggriculture"],
  fedtalk: ["/projects/fedtalk/", "FedTalk"],
  insurance: ["/projects/insurance-platform/", "Insurance Platform"],
  insureraft: ["/projects/insureraft/", "InsureRaft"],
  atriaa: ["/projects/atriaa/", "Atriaa"],
  medscan: ["/projects/medscan/", "Medscan"],
  mmm: ["/projects/bayesian-marketing-mix/", "Bayesian Marketing Mix"],
  profile: ["/projects/developer-profile/", "Beyond the Resume"],
  photography: ["/photography/", "Photography"],
};

const RELATED = {
  "/experience/accolite/": ["insurance", "insureraft", "shriffle"],
  "/experience/shriffle/": ["accolite", "insurance", "symbiosis"],
  "/experience/stony-brook-research/": ["fedtalk", "mmm", "sbu"],
  "/experience/stony-brook-university/": ["sbuResearch", "fedtalk", "mmm"],
  "/experience/symbiosis-university/": ["shriffle", "accolite"],
  "/experience/wake-forest-cair/": ["atriaa", "medscan", "sbuResearch"],
  "/projects/atriveo-tracker/": ["jobs", "cortex", "bio"],
  "/projects/atriveo-job-search/": ["tracker", "cortex", "reel"],
  "/projects/atriveo-bio/": ["cortex", "tracker", "medscan"],
  "/projects/atriveo-cortex/": ["bio", "tracker", "jobs"],
  "/projects/atriveo-reel/": ["chaal", "cortex", "jobs"],
  "/projects/chaal-tech/": ["kaggriculture", "reel"],
  "/projects/kaggriculture/": ["chaal", "mmm", "fedtalk"],
  "/projects/fedtalk/": ["sbuResearch", "mmm", "sbu"],
  "/projects/insurance-platform/": ["insureraft", "accolite"],
  "/projects/insureraft/": ["insurance", "accolite"],
  "/projects/atriaa/": ["cair", "medscan"],
  "/projects/medscan/": ["atriaa", "cair", "bio"],
  "/projects/bayesian-marketing-mix/": ["fedtalk", "kaggriculture", "sbu"],
  "/projects/developer-profile/": ["accolite", "sbuResearch", "photography"],
};

const escape = value => String(value).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function relatedSection(path) {
  const keys = RELATED[path];
  if (!keys?.length) return "";
  const links = keys.map(key => {
    const [href, label] = P[key];
    return `<li><a href="${href}">${escape(label)} <b aria-hidden="true">→</b></a></li>`;
  }).join("");
  return `<nav class="related" aria-label="Related pages">
          <h2 class="eyebrow">Related</h2>
          <ul>${links}</ul>
        </nav>`;
}
