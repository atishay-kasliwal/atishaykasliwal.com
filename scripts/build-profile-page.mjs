// Renders the canonical profile (src/profile/build.js) to:
//   profile/index.html        /profile/, the complete professional profile in plain HTML
//   public/api/profile.json   /api/profile.json, the same data as JSON
//   public/api/profile.schema.json
//   public/llms.txt           only the block between the open-source markers is rewritten
// Runs from vite.config.js on every dev start and build, like the case-study and experience
// generators. profile/ and public/api/ are generated and not committed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_ARROW = "↗︎";
const LLMS_START = "<!-- profile:open-source:start -->";
const LLMS_END = "<!-- profile:open-source:end -->";

const escape = (value = "") =>
  String(value).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatMonth = value => {
  if (!value) return "Present";
  const [year, month] = value.split("-");
  return month ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : year;
};
const formatDay = iso => {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${Number(day)}, ${year}`;
};
const place = location => (location ? `${location.locality}, ${location.region}` : "");
const external = (href, label, cls = "") =>
  `<a${cls ? ` class="${cls}"` : ""} href="${escape(href)}">${label} <b aria-hidden="true">${TEXT_ARROW}</b></a>`;
const STATUS_LABEL = {
  verified: "Verified",
  publicly_verifiable: "Public evidence",
  self_reported: "Self-reported",
  needs_review: "Needs review",
};
const status = value => `<span class="status status-${value.replace("_", "-")}">${STATUS_LABEL[value]}</span>`;

function metricsList(metrics) {
  if (!metrics.length) return "";
  return `<ul class="metrics">${metrics
    .map(m => `<li><b>${escape(m.value)}</b><span>${escape(m.label)}</span>${status(m.verificationStatus)}</li>`)
    .join("")}</ul>`;
}

function skillNames(ids, skillsById) {
  if (!ids.length) return "";
  return `<p class="uses"><span class="label">Skills</span> ${ids.map(id => escape(skillsById.get(id).name)).join(" · ")}</p>`;
}

function roleArticle(role, kind, skillsById) {
  const title = kind === "education" ? role.credential : role.title;
  const org = kind === "education" ? role.institution : role.organization;
  const aka = org.alternateNames?.length ? ` <span class="soft">(also ${org.alternateNames.map(escape).join(", ")})</span>` : "";
  return `<article class="entry" id="${kind}-${role.id}">
          <header>
            <h3>${escape(title)}</h3>
            <p class="where"><b>${escape(org.name)}</b>${aka}</p>
            <p class="when"><time datetime="${role.startDate}">${formatMonth(role.startDate)}</time> – ${role.endDate ? `<time datetime="${role.endDate}">${formatMonth(role.endDate)}</time>` : "Present"}${role.location ? ` · ${escape(place(role.location))}` : ""}${role.employmentType ? ` · ${escape(role.employmentType[0].toUpperCase() + role.employmentType.slice(1))}` : ""}</p>
          </header>
          <p>${escape(role.summary)}</p>
          ${metricsList(role.metrics)}
          ${role.highlights.length ? `<ul class="highlights">${role.highlights.map(h => `<li><b>${escape(h.title)}.</b> ${escape(h.detail)}</li>`).join("")}</ul>` : ""}
          ${skillNames(role.skills, skillsById)}
          <p class="more"><a href="${escape(new URL(role.url).pathname)}">${kind === "education" ? "Education" : "Role"} details: ${escape(title)} <b aria-hidden="true">→</b></a></p>
        </article>`;
}

function subjectLink(subject) {
  const href = subject.url.startsWith("https://atishaykasliwal.com/") ? new URL(subject.url).pathname : subject.url;
  return `<a href="${escape(href)}">${escape(subject.name)}</a>`;
}

function projectArticle(project, skillsById) {
  const links = [
    `<a href="/projects/${project.id}/">Case study: ${escape(project.name)} <b aria-hidden="true">→</b></a>`,
    project.links.repository ? external(project.links.repository, `Source code: ${escape(project.name)}`) : "",
    project.links.liveSite ? external(project.links.liveSite, `Live site: ${escape(new URL(project.links.liveSite).hostname)}`) : "",
  ].filter(Boolean);
  const visibility = project.repositoryVisibility === "private" ? "Private repository" : project.repositoryVisibility === "not_linked" ? "Repository not linked" : null;
  const flow = project.architecture?.components.length
    ? `<p class="flow"><span class="label">How it works</span> ${project.architecture.components.map(c => `${escape(c.name)} <span class="soft">(${escape(c.detail)})</span>`).join(" · ")}</p>`
    : "";
  return `<article class="entry project" id="project-${project.id}">
          <header>
            <h3>${escape(project.name)}</h3>
            <p class="where">${escape(project.category)}${project.startedOn ? ` · since <time datetime="${project.startedOn}">${formatMonth(project.startedOn.slice(0, 7))}</time>` : ""}${visibility ? ` · ${visibility}` : ""}</p>
          </header>
          <p>${escape(project.summary)}</p>
          ${project.problem ? `<p class="story-line"><span class="label">Problem</span> ${escape(project.problem.detail)}</p>` : ""}
          ${project.solution ? `<p class="story-line"><span class="label">Built</span> ${escape(project.solution.detail)}</p>` : ""}
          ${flow}
          ${metricsList(project.metrics)}
          <p class="uses"><span class="label">Stack</span> ${project.technologies.map(escape).join(" · ")}</p>
          ${skillNames(project.skills, skillsById)}
          <p class="more">${links.join('<span class="sep" aria-hidden="true">/</span>')}</p>
        </article>`;
}

function render(profile) {
  const p = profile.profile;
  const skillsById = new Map(profile.skills.map(skill => [skill.id, skill]));
  const oss = profile.openSourceSummary;
  const msDegree = profile.education.find(item => item.id === "stony-brook-university");
  const title = "Atishay Kasliwal - Professional Profile, Software & AI Engineer";
  const description =
    "Atishay Kasliwal's full professional profile: experience, education, evidence-linked skills, projects, open source contributions and strengths.";

  const sections = [
    ["specializations", "Focus"],
    ["experience", "Experience"],
    ["education", "Education"],
    ["skills", "Skills"],
    ["strengths", "Strengths"],
    ["projects", "Projects"],
    ["open-source", "Open source"],
    ["achievements", "Achievements"],
    ["data", "Data"],
  ];

  const specializationPanels = p.specializations
    .map(
      item => `<section class="panel">
          <span class="eyebrow">${escape(STATUS_LABEL[item.verificationStatus])}</span>
          <h3>${escape(item.name)}</h3>
          <p>${escape(item.summary)}</p>
          <p class="uses"><span class="label">Shown in</span> ${item.supportedBy.map(subjectLink).join(" · ")}</p>
        </section>`,
    )
    .join("\n        ");

  const skillGroups = profile.skillCategories
    .map(category => {
      const list = profile.skills.filter(skill => skill.category === category.id);
      if (!list.length) return "";
      return `<section class="skill-group" id="skills-${category.id}">
          <h3>${escape(category.name)}</h3>
          <ul class="skills">${list
            .map(
              skill => `<li id="skill-${skill.id}"><p class="skill-head"><span class="skill-name">${escape(skill.name)}</span>${status(skill.verificationStatus)}</p>
              <ul class="skill-uses">${skill.usedIn.map(use => `<li>${subjectLink(use)} <span class="soft">${escape(use.implementation)}</span></li>`).join("")}</ul></li>`,
            )
            .join("")}</ul>
        </section>`;
    })
    .join("\n        ");

  const strengthGroups = [...new Set(profile.professionalStrengths.map(s => s.category))]
    .map(category => `<section class="skill-group">
          <h3>${escape(category)}</h3>
          <ul class="strengths">${profile.professionalStrengths
            .filter(s => s.category === category)
            .map(
              s => `<li id="strength-${s.id}"><p><b>${escape(s.name)}</b>${status(s.verificationStatus)}</p>
              <p class="soft-text">${escape(s.description)}</p>
              <ul class="examples">${s.examples.map(ex => `<li>${subjectLink(ex)}: ${escape(ex.example)}</li>`).join("")}</ul></li>`,
            )
            .join("")}</ul>
        </section>`)
    .join("\n        ");

  const mergedRows = oss.mergedRepositories
    .map(repo => {
      const prs = profile.openSourceContributions.filter(c => c.repository === repo.repository && c.status === "merged");
      return `<li class="repo" id="oss-${repo.repository.replace("/", "-").toLowerCase()}">
            <p><b>${escape(repo.projectName)}</b> <span class="soft">${escape(repo.repository)}</span> · ${repo.merged} merged ${external(repo.mergedPullRequestsUrl, `<span class="visually-hidden">${escape(repo.repository)} </span>on GitHub`)}</p>
            ${repo.projectDescription ? `<p class="soft-text">${escape(repo.projectDescription)}</p>` : ""}
            <ul class="prs">${prs.map(pr => `<li><a href="${escape(pr.url)}">#${pr.number} ${escape(pr.title)}</a> <span class="soft">merged <time datetime="${pr.mergedAt}">${formatDay(pr.mergedAt)}</time></span></li>`).join("")}</ul>
          </li>`;
    })
    .join("");
  const search = q => `https://github.com/pulls?q=${encodeURIComponent(q)}`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${p.urls.profilePage}#webpage`,
        url: p.urls.profilePage,
        name: title,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${p.urls.homepage}#website` },
        about: { "@id": "https://atishaykasliwal.com/#person" },
        mainEntity: { "@id": "https://atishaykasliwal.com/#person" },
        breadcrumb: { "@id": `${p.urls.profilePage}#breadcrumb` },
        dateModified: profile.lastUpdated,
        encoding: { "@type": "MediaObject", contentUrl: p.urls.api, encodingFormat: "application/json" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${p.urls.profilePage}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Atishay Kasliwal", item: p.urls.homepage },
          { "@type": "ListItem", position: 2, name: "Profile", item: p.urls.profilePage },
        ],
      },
      profile.personJsonLd,
      profile.atriveoJsonLd,
      {
        "@type": "ItemList",
        "@id": `${p.urls.profilePage}#projects`,
        name: "Projects",
        itemListElement: profile.projects.map((project, i) => ({ "@type": "ListItem", position: i + 1, name: project.name, url: project.links.caseStudy })),
      },
    ],
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <meta name="author" content="Atishay Kasliwal" />
    <link rel="canonical" href="${p.urls.profilePage}" />
    <link rel="alternate" type="application/json" href="/api/profile.json" title="Atishay Kasliwal: profile as JSON" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="Atishay Kasliwal" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${p.urls.profilePage}" />
    <meta property="og:image" content="https://atishaykasliwal.com/og.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Atishay Kasliwal, software and AI engineer" />
    <meta property="profile:first_name" content="${escape(p.givenName)}" />
    <meta property="profile:last_name" content="${escape(p.familyName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@AtishayKasliwal" />
    <meta name="twitter:creator" content="@AtishayKasliwal" />
    <meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" />
    <meta name="twitter:image" content="https://atishaykasliwal.com/og.jpg" />
    <script type="application/ld+json">
${JSON.stringify(graph, null, 2)}
    </script>
    <script type="module" src="/src/profile-page.js"></script>
  </head>
  <body>
    <div class="wrap">
      <nav class="topbar" aria-label="Site">
        <a href="/"><span aria-hidden="true">←</span> Home</a>
        <span>Profile</span>
        <a href="/Atishay-Kasliwal-Resume.pdf">Résumé <b aria-hidden="true">${TEXT_ARROW}</b></a>
      </nav>

      <main class="content profile">
        <header class="hero">
          <h1><span class="eyebrow">Profile</span><span class="name">${escape(p.name)}</span><span class="line">${escape(p.headline)}<span class="soft"> · ${escape(place(p.location))}</span></span></h1>
          ${p.openToWork ? `<p class="open"><span class="dot" aria-hidden="true"></span>Open to work</p>` : ""}
          <div class="summary">${p.summary.map(line => `<p>${escape(line)}</p>`).join("")}</div>
          <dl class="facts">
            <div><dt>Now</dt><dd>${escape(p.currentFocus)}</dd></div>
            <div><dt>Based</dt><dd>${escape(place(p.location))}</dd></div>
            ${msDegree ? `<div><dt>Study</dt><dd>${escape(msDegree.credential)}, ${escape(msDegree.institution.name)} (${msDegree.endDate.slice(0, 4)})</dd></div>` : ""}
            <div><dt>Open source</dt><dd>${oss.pullRequests.merged} merged pull requests in ${oss.mergedRepositories.length} repositories</dd></div>
          </dl>
          <div class="actions">
            <a class="btn primary" href="/Atishay-Kasliwal-Resume.pdf">Résumé (PDF) <b aria-hidden="true">${TEXT_ARROW}</b></a>
            <!--email_off--><a class="btn" href="mailto:${escape(p.contact.email)}">${escape(p.contact.email)}</a><!--/email_off-->
            ${p.profiles.filter(link => ["GitHub", "LinkedIn"].includes(link.network)).map(link => `<a class="btn" href="${escape(link.url)}">${escape(link.network)} <b aria-hidden="true">${TEXT_ARROW}</b></a>`).join("\n            ")}
            <a class="btn" href="/api/profile.json">Profile as JSON <b aria-hidden="true">${TEXT_ARROW}</b></a>
          </div>
        </header>

        <nav class="toc" aria-label="On this page">
          <ul>${sections.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("")}</ul>
        </nav>

        <section class="block" id="specializations" aria-labelledby="specializations-title">
          <h2 id="specializations-title">What I focus on</h2>
          <div class="grid">
        ${specializationPanels}
          </div>
        </section>

        <section class="block" id="experience" aria-labelledby="experience-title">
          <h2 id="experience-title">Experience</h2>
          ${profile.experience.map(role => roleArticle(role, "experience", skillsById)).join("\n          ")}
        </section>

        <section class="block" id="education" aria-labelledby="education-title">
          <h2 id="education-title">Education</h2>
          ${profile.education.map(role => roleArticle(role, "education", skillsById)).join("\n          ")}
        </section>

        <section class="block" id="skills" aria-labelledby="skills-title">
          <h2 id="skills-title">Skills, with where each one was used</h2>
          <p class="intro"><b>Public evidence</b> links to source code, a merged pull request or a public review that anyone can inspect. <b>Self-reported</b> rests on my own account of employer or private work. Neither is a proficiency rating.</p>
        ${skillGroups}
        </section>

        <section class="block" id="strengths" aria-labelledby="strengths-title">
          <h2 id="strengths-title">Professional strengths</h2>
          <p class="intro">How I communicate, lead, collaborate and solve problems, each with the work that shows it. Strengths without evidence are left out rather than claimed.</p>
        ${strengthGroups}
        </section>

        <section class="block" id="projects" aria-labelledby="projects-title">
          <h2 id="projects-title">Projects</h2>
          ${profile.projects.map(project => projectArticle(project, skillsById)).join("\n          ")}
        </section>

        <section class="block" id="open-source" aria-labelledby="open-source-title">
          <h2 id="open-source-title">Open source contributions</h2>
          <p class="intro">Pull requests to projects run by other teams, as GitHub reported them on <time datetime="${oss.verifiedAt}">${formatDay(oss.verifiedAt)}</time>. This is contribution, not employment by these organizations.</p>
          <ul class="metrics oss-counts">
            <li><b>${oss.pullRequests.merged}</b><span>merged</span>${status("verified")}</li>
            <li><b>${oss.pullRequests.open}</b><span>open, awaiting review</span>${status("verified")}</li>
            <li><b>${oss.pullRequests.closedUnmerged}</b><span>closed without merging</span>${status("verified")}</li>
            <li><b>${oss.reviewsGiven}</b><span>reviews of other contributors' pull requests</span>${status("verified")}</li>
          </ul>
          <ul class="repos">${mergedRows}
          </ul>
          <p class="more">${external(search(`is:pr author:atishay-kasliwal is:open -user:atishay-kasliwal`), "Open pull requests on GitHub")}<span class="sep" aria-hidden="true">/</span>${external(search(`is:pr author:atishay-kasliwal is:closed is:unmerged -user:atishay-kasliwal`), "Closed without merging")}<span class="sep" aria-hidden="true">/</span>${external(search(`is:pr reviewed-by:atishay-kasliwal -author:atishay-kasliwal`), "Reviews given")}</p>
        </section>

        <section class="block" id="achievements" aria-labelledby="achievements-title">
          <h2 id="achievements-title">Achievements and community</h2>
          <ul class="list">${profile.achievements.map(a => `<li>${escape(a.title)} ${status(a.verificationStatus)}</li>`).join("")}</ul>
          <h3>Volunteering and events</h3>
          <ul class="list">${profile.community.map(c => `<li><b>${escape(c.name)}</b> <span class="soft">${escape(c.role)}${c.year ? `, ${c.year}` : ""}</span>: ${escape(c.description)}</li>`).join("")}</ul>
        </section>

        <section class="block" id="data" aria-labelledby="data-title">
          <h2 id="data-title">Machine-readable profile</h2>
          <p>Everything on this page is also published as JSON, generated from the same source at build time. Agents and tools can read it directly; it is a convenience format, not an applicant tracking system standard.</p>
          <dl class="facts api">
            <div><dt>Profile</dt><dd><a href="/api/profile.json">/api/profile.json</a> <span class="soft">· GET · application/json · schema version ${escape(profile.schemaVersion)}</span></dd></div>
            <div><dt>Schema</dt><dd><a href="/api/profile.schema.json">/api/profile.schema.json</a> <span class="soft">· JSON Schema 2020-12</span></dd></div>
            <div><dt>Summary</dt><dd><a href="/llms.txt">/llms.txt</a> <span class="soft">· plain text for language models</span></dd></div>
            <div><dt>Updated</dt><dd><time datetime="${profile.lastUpdated}">${formatDay(profile.lastUpdated)}</time></dd></div>
          </dl>
          <p class="soft-text">Each skill, strength and metric carries a <code>verificationStatus</code>: <code>verified</code> (checked against the primary public source when generated), <code>publicly_verifiable</code> (linked to a public artifact), <code>self_reported</code> or <code>needs_review</code>. Each one lists the projects, roles or pull requests it rests on.</p>
        </section>
      </main>

      <nav class="thumb-bar" aria-label="Profile links">
        <a class="thumb-button primary" href="/Atishay-Kasliwal-Resume.pdf">Résumé ${TEXT_ARROW}</a>
        <a class="thumb-button" href="/api/profile.json">JSON ${TEXT_ARROW}</a>
        <a class="thumb-button go-next" href="/" aria-label="Home">←</a>
      </nav>

      <footer class="site-footer">
        <span>© ${new Date().getFullYear()} Atishay Kasliwal</span>
        <a href="/">atishaykasliwal.com <b aria-hidden="true">${TEXT_ARROW}</b></a>
      </footer>
    </div>
  </body>
</html>
`;
}

function llmsOpenSource(profile) {
  const oss = profile.openSourceSummary;
  const day = formatDay(oss.verifiedAt);
  const lines = oss.mergedRepositories.map(repo => {
    const prs = profile.openSourceContributions.filter(c => c.repository === repo.repository && c.status === "merged");
    const examples = prs.slice(0, 2).map(pr => `"${pr.title}"`).join(", ");
    return `- [${repo.projectName}](${repo.mergedPullRequestsUrl}) (${repo.repository}): ${repo.merged} merged${repo.merged === 1 ? ":" : ", including"} ${examples}.`;
  });
  return [
    LLMS_START,
    `## Open source contributions`,
    ``,
    `Pull requests to projects run by other teams, as GitHub reported them on ${day}: ${oss.pullRequests.merged} merged across ${oss.mergedRepositories.length} repositories, ${oss.pullRequests.open} open and awaiting review, ${oss.pullRequests.closedUnmerged} closed without merging, and ${oss.reviewsGiven} reviews of other contributors' pull requests. The full list, with links, is in https://atishaykasliwal.com/api/profile.json and at https://atishaykasliwal.com/profile/#open-source.`,
    ``,
    ...lines,
    LLMS_END,
  ].join("\n");
}

export async function buildProfilePage() {
  const stamp = Date.now();
  const { buildProfile, personJsonLd, atriveoJsonLd } = await import(`${pathToFileURL(path.join(ROOT, "src/profile/build.js")).href}?t=${stamp}`);
  const profile = buildProfile();
  const html = render({ ...profile, personJsonLd: personJsonLd(profile), atriveoJsonLd: atriveoJsonLd() });

  const outDir = path.join(ROOT, "profile");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, "index.html");
  fs.writeFileSync(file, html);

  const apiDir = path.join(ROOT, "public/api");
  fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(path.join(apiDir, "profile.json"), `${JSON.stringify(profile)}\n`);
  fs.copyFileSync(path.join(ROOT, "src/profile/profile.schema.json"), path.join(apiDir, "profile.schema.json"));

  const llmsPath = path.join(ROOT, "public/llms.txt");
  const llms = fs.readFileSync(llmsPath, "utf8");
  const start = llms.indexOf(LLMS_START);
  const end = llms.indexOf(LLMS_END);
  if (start === -1 || end === -1) throw new Error(`public/llms.txt must contain ${LLMS_START} and ${LLMS_END}`);
  const next = `${llms.slice(0, start)}${llmsOpenSource(profile)}${llms.slice(end + LLMS_END.length)}`;
  if (next !== llms) fs.writeFileSync(llmsPath, next);

  const sitemap = `  <url>\n    <loc>${profile.profile.urls.profilePage}</loc>\n    <lastmod>${profile.lastUpdated}</lastmod>\n  </url>`;
  return { inputs: { "profile/index": file }, sitemap, profile };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { profile } = await buildProfilePage();
  console.log(`Built /profile/ and /api/profile.json: ${profile.skills.length} skills, ${profile.projects.length} projects, ${profile.openSourceContributions.length} pull requests.`);
}
