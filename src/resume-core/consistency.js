// Compares the text of an uploaded résumé with the canonical professional profile
// (/api/profile.json as built from src/profile/) and lists every disagreement for a person to
// review. It only reports: the canonical profile stays the source of truth, and nothing here
// changes it or publishes a claim from the PDF.
//
// Severity:
//   conflict    The PDF contradicts the canonical profile (dates, titles, a phrase a review item
//               keeps out of the profile).
//   unverified  The PDF makes a claim the canonical profile has no evidence for (a skill or metric).
//   info        Worth knowing, not a contradiction (a role left off the PDF, an unconfirmed field).

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_PATTERN = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?";
const DATE = `${MONTH_PATTERN}\\s+(\\d{4})`;
const RANGE = new RegExp(`${DATE}\\s*(?:–|—|-|to)\\s*(?:(Present|Current|Now|Ongoing)|${DATE})`, "i");
const HEADINGS = ["education", "experience", "work experience", "professional experience", "projects", "technical skills", "skills", "publications", "certifications", "awards", "open source", "summary"];

const normalize = value => String(value ?? "").replace(/[‐-―]/g, "-").replace(/ /g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const contains = (haystack, needle) => normalize(haystack).includes(normalize(needle));
const monthIndex = name => MONTHS.findIndex(month => month.startsWith(name.toLowerCase().replace(".", "").slice(0, 3)));
const ym = (monthName, year) => `${year}-${String(monthIndex(monthName) + 1).padStart(2, "0")}`;
export const longMonth = value => {
  if (!value) return "Present";
  if (/^\d{4}$/.test(value)) return value;
  const [year, month] = value.split("-");
  const name = MONTHS[Number(month) - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${year}`;
};

export function parseRange(text) {
  const match = RANGE.exec(text);
  if (!match) return null;
  return {
    text: match[0],
    start: ym(match[1], match[2]),
    end: match[3] ? null : ym(match[4], match[5]),
    present: Boolean(match[3]),
  };
}

function sections(lines) {
  const marks = lines
    .map((line, index) => ({ index, name: normalize(line).replace(/:$/, "") }))
    .filter(mark => HEADINGS.includes(mark.name));
  const byName = {};
  marks.forEach((mark, i) => {
    const key = mark.name.includes("experience") ? "experience" : mark.name.includes("skills") ? "skills" : mark.name;
    byName[key] ??= lines.slice(mark.index + 1, marks[i + 1]?.index ?? lines.length);
  });
  return byName;
}

// Bullets as whole sentences: pdf text breaks them across lines and puts the bullet glyph alone.
function bullets(lines) {
  const out = [];
  let current = null;
  for (const line of lines) {
    const bulletStart = /^[•●▪◦‣∙·\-–*]\s*/.exec(line);
    if (bulletStart) {
      if (current) out.push(current);
      current = line.slice(bulletStart[0].length);
    } else if (parseRange(line)) {
      if (current) out.push(current);
      current = null;
    } else if (current !== null) {
      current = `${current} ${line}`.trim();
    }
  }
  if (current) out.push(current);
  return out.map(text => text.replace(/\s+/g, " ").trim()).filter(Boolean);
}

// ---------- Metrics ----------
const METRIC = /(\$\s?)?(\d+(?:,\d{3})*(?:\.\d+)?)\s?(%|[KMB](?![a-z])|ms\b|x\b|×)?(\+)?/gi;
function metricsIn(text) {
  const found = [];
  for (const match of text.matchAll(METRIC)) {
    const [whole, dollar, digits, unitRaw, plus] = match;
    const unit = (unitRaw ?? "").toUpperCase();
    // Bare small numbers ("3 minutes", "8 services") and years are context, not claims.
    if (!dollar && !unit && !plus) continue;
    if (!dollar && !unit && /^(19|20)\d{2}$/.test(digits)) continue;
    const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[unit] ?? 1;
    const value = Number(digits.replace(/,/g, "")) * multiplier;
    const kind = dollar ? "money" : unit === "%" ? "percent" : unit === "MS" ? "ms" : unit === "X" || unit === "×" ? "multiple" : "count";
    found.push({ text: whole.trim(), value, kind });
  }
  return found;
}
const metricKey = metric => `${metric.kind}:${metric.value}`;

// ---------- Skills ----------
// Résumé shorthand for skills the canonical profile names in full.
const SKILL_ALIASES = {
  kafka: "apache kafka",
  airflow: "apache airflow",
  gcp: "google cloud platform",
  "google cloud": "google cloud platform",
  "rest apis": "rest api design",
  "restful apis": "rest api design",
  rest: "rest api design",
  microservices: "microservices architecture",
  "ci/cd": "ci/cd pipelines",
  "jenkins ci/cd": "jenkins",
  k8s: "kubernetes",
  postgres: "postgresql",
  "spring security": "authentication and authorization",
  oauth2: "authentication and authorization",
  oauth: "authentication and authorization",
  jwt: "authentication and authorization",
  llms: "llm applications",
  llm: "llm applications",
  rag: "retrieval-augmented generation",
  nlp: "natural language processing",
  whisper: "speech-to-text (whisper)",
  ollama: "local models (ollama)",
  "cloudflare workers": "cloudflare workers, durable objects, d1 and r2",
  "event driven architecture": "event-driven architecture",
  "event sourcing": "cqrs and event sourcing",
  cqrs: "cqrs and event sourcing",
  "next.js": "next.js",
  nextjs: "next.js",
  node: "node.js",
  nodejs: "node.js",
  "django rest framework": "django rest framework",
  django: "django rest framework",
  "aws lambda": "aws",
};

function skillIndex(profile) {
  const names = new Map();
  for (const skill of profile.skills ?? []) {
    names.set(normalize(skill.name), skill);
    names.set(normalize(skill.id).replace(/-/g, " "), skill);
  }
  return names;
}

function matchSkill(token, names) {
  const n = normalize(token);
  if (!n) return null;
  if (names.has(n)) return names.get(n);
  if (SKILL_ALIASES[n] && names.has(SKILL_ALIASES[n])) return names.get(SKILL_ALIASES[n]);
  for (const [name, skill] of names) {
    // "Kafka" in "Apache Kafka", "AWS" in "AWS (Lambda, EC2)", "Jenkins" in "Jenkins CI/CD".
    const words = name.split(/[\s,:()/]+/).filter(Boolean);
    if (words.length > 1 && words.includes(n) && n.length >= 3) return skill;
    if (name.length >= 3 && new RegExp(`(^|[\\s(])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[\\s),])`).test(n)) return skill;
  }
  return null;
}

function splitSkills(text) {
  // "AWS (Lambda, EC2, S3)" stays one entry; commas inside parentheses do not split.
  const out = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if ((char === "," || char === ";") && depth === 0) {
      out.push(current);
      current = "";
    } else current += char;
  }
  out.push(current);
  return out.map(item => item.replace(/\s*\(.*\)\s*/, " ").trim()).filter(item => item && item.length <= 40);
}

// ---------- The comparison ----------
export function compareWithProfile(lines, profile, reviewItems = []) {
  const items = [];
  const reviewByField = new Map();
  const reviewById = new Map();
  for (const item of reviewItems) {
    reviewById.set(item.id, item);
    if (item.field) reviewByField.set(item.field, item);
  }
  const reviewRef = item => (item ? { id: item.id, status: item.status, resolution: item.resolution, action: item.action ?? null } : null);
  const add = ({ id, category, severity, field = null, message, resume = null, canonical = null, review = null }) => {
    if (items.some(existing => existing.id === id)) return;
    items.push({ id, category, severity, field, message, resume, canonical, reviewItem: reviewRef(review ?? (field ? reviewByField.get(field) : null) ?? reviewById.get(id)) });
  };

  const text = lines.join("\n");
  const parts = sections(lines);
  const experienceLines = parts.experience ?? lines;
  const educationLines = parts.education ?? lines;

  // Identity and contact.
  if (profile.profile?.name && !contains(text, profile.profile.name)) {
    add({ id: "identity-name", category: "contact", severity: "conflict", field: "profile.name", message: `The name "${profile.profile.name}" does not appear on the résumé.`, canonical: profile.profile.name });
  }
  const email = profile.profile?.contact?.email;
  // Addresses a review item accepts on the résumé in place of the site's (never published).
  const resumeEmails = [email, ...reviewItems.flatMap(item => item.acceptedOnResume ?? [])].filter(Boolean);
  if (email && !resumeEmails.some(address => contains(text, address))) {
    const onPdf = text.match(/[^\s@|]+@[^\s@|]+\.[a-z]{2,}/i)?.[0] ?? null;
    add({ id: "resume-email", category: "contact", severity: "conflict", field: "profile.contact.email", message: onPdf ? "The email address differs from the canonical profile." : "No email address was found on the résumé.", resume: onPdf, canonical: email });
  }

  // Experience: dates and titles for every canonical role.
  const matchedExperienceLines = new Set();
  for (const role of profile.experience ?? []) {
    const names = [role.organization?.name, ...(role.organization?.alternateNames ?? [])].filter(Boolean);
    const keys = names.map(name => name.split(/\s+/).slice(0, 2).join(" "));
    const index = experienceLines.findIndex(line => keys.some(key => contains(line, key)) && parseRange(line));
    const fallback = index === -1 ? experienceLines.findIndex(line => keys.some(key => contains(line, key))) : index;
    if (fallback === -1) {
      add({
        id: `${role.id}-missing`,
        category: "experience",
        severity: "info",
        field: `experience.${role.id}`,
        message: `${role.organization.name} (${role.title}) is in the canonical profile but not on the résumé.`,
        canonical: `${role.title}, ${longMonth(role.startDate)} – ${longMonth(role.endDate)}`,
      });
      continue;
    }
    matchedExperienceLines.add(fallback);
    const near = experienceLines.slice(fallback, fallback + 2).join(" ");
    const range = parseRange(near);
    const roleLabel = `${role.organization.name} (${role.title})`;
    if (!range) {
      add({ id: `${role.id}-dates`, category: "experience", severity: "info", field: `experience.${role.id}`, message: `No date range found next to ${roleLabel}.`, canonical: `${longMonth(role.startDate)} – ${longMonth(role.endDate)}` });
    } else {
      if (range.start.slice(0, role.startDate.length) !== role.startDate) {
        add({ id: `${role.id}-start-date`, category: "experience", severity: "conflict", field: `experience.${role.id}.startDate`, message: `${roleLabel} starts ${longMonth(role.startDate)} in the canonical profile; the résumé says ${longMonth(range.start)}.`, resume: range.text, canonical: longMonth(role.startDate) });
      }
      if (role.endDate && range.present) {
        add({ id: `${role.id}-end-date`, category: "experience", severity: "conflict", field: `experience.${role.id}.endDate`, message: `The résumé says ${roleLabel} is ongoing ("Present"); the canonical profile says it ended ${longMonth(role.endDate)}.`, resume: range.text, canonical: longMonth(role.endDate) });
      } else if (role.endDate && range.end && range.end.slice(0, role.endDate.length) !== role.endDate) {
        add({ id: `${role.id}-end-date`, category: "experience", severity: "conflict", field: `experience.${role.id}.endDate`, message: `${roleLabel} ends ${longMonth(role.endDate)} in the canonical profile; the résumé says ${longMonth(range.end)}.`, resume: range.text, canonical: longMonth(role.endDate) });
      } else if (!role.endDate && range.end) {
        add({ id: `${role.id}-end-date`, category: "experience", severity: "conflict", field: `experience.${role.id}.endDate`, message: `${roleLabel} is current in the canonical profile; the résumé says it ended ${longMonth(range.end)}.`, resume: range.text, canonical: "Present" });
      }
    }
    const titleLine = experienceLines.slice(fallback, fallback + 2).find(line => !keys.some(key => contains(line, key))) ?? near;
    const pdfTitle = titleLine.split("|")[0].replace(RANGE, "").trim();
    const canonicalTitle = role.title.split(",")[0];
    if (!contains(near, canonicalTitle)) {
      add({ id: `${role.id}-title`, category: "experience", severity: "conflict", field: `experience.${role.id}.title`, message: `${role.organization.name}: the canonical title is "${role.title}"; the résumé says "${pdfTitle}".`, resume: pdfTitle, canonical: role.title });
    } else if (/\bintern(ship)?\b/i.test(pdfTitle) && role.employmentType !== "internship") {
      add({ id: `${role.id}-title`, category: "experience", severity: "conflict", field: `experience.${role.id}.title`, message: `${role.organization.name} is an internship on the résumé only; the canonical title is "${role.title}" with no internship recorded.`, resume: pdfTitle, canonical: role.title });
    }
  }
  // Dated entries in the experience section that match no canonical role.
  experienceLines.forEach((line, index) => {
    if (matchedExperienceLines.has(index) || !parseRange(line)) return;
    if (matchedExperienceLines.has(index - 1)) return;
    const name = line.replace(RANGE, "").split("|")[0].trim();
    if (!name) return;
    add({ id: `experience-unknown-${normalize(name).replace(/[^a-z0-9]+/g, "-")}`, category: "experience", severity: "unverified", message: `"${name}" is on the résumé but not in the canonical profile.`, resume: line });
  });

  // Education: institution, degree and dates.
  for (const item of profile.education ?? []) {
    const names = [item.institution?.name, ...(item.institution?.alternateNames ?? [])].filter(Boolean);
    const index = educationLines.findIndex(line => names.some(name => contains(line, name)));
    if (index === -1) {
      add({ id: `${item.id}-missing`, category: "education", severity: "conflict", field: `education.${item.id}`, message: `${item.institution.name} is in the canonical profile but not on the résumé.`, canonical: `${item.degree} in ${item.field}` });
      continue;
    }
    const near = educationLines.slice(index, index + 2).join(" ");
    if (!contains(near, item.degree) && !contains(near, item.field)) {
      add({ id: `${item.id}-degree`, category: "education", severity: "conflict", field: `education.${item.id}.degree`, message: `${item.institution.name}: the canonical degree is ${item.degree} in ${item.field}.`, resume: educationLines[index + 1] ?? null, canonical: `${item.degree} in ${item.field}` });
    }
    const range = parseRange(near);
    if (!range) {
      if (!contains(near, item.endDate.slice(0, 4))) add({ id: `${item.id}-end-date`, category: "education", severity: "conflict", field: `education.${item.id}.endDate`, message: `${item.institution.name}: no ${item.endDate.slice(0, 4)} end date on the résumé.`, canonical: longMonth(item.endDate) });
      continue;
    }
    if (range.present || (range.end && range.end.slice(0, item.endDate.length) !== item.endDate)) {
      add({ id: `${item.id}-end-date`, category: "education", severity: "conflict", field: `education.${item.id}.endDate`, message: `${item.institution.name} ends ${longMonth(item.endDate)} in the canonical profile; the résumé says ${range.present ? "Present" : longMonth(range.end)}.`, resume: range.text, canonical: longMonth(item.endDate) });
    }
    if (item.startDate.length === 4) {
      add({ id: `${item.id}-start-date`, category: "education", severity: "info", field: `education.${item.id}.startDate`, message: `${item.institution.name}: the start month is unconfirmed in the canonical profile (year ${item.startDate} only); the résumé says ${longMonth(range.start)}.`, resume: range.text, canonical: item.startDate });
    } else if (range.start !== item.startDate) {
      add({ id: `${item.id}-start-date`, category: "education", severity: "conflict", field: `education.${item.id}.startDate`, message: `${item.institution.name} starts ${longMonth(item.startDate)} in the canonical profile; the résumé says ${longMonth(range.start)}.`, resume: range.text, canonical: longMonth(item.startDate) });
    }
  }

  // Skills: every skill the résumé lists should have evidence in the canonical profile.
  const names = skillIndex(profile);
  const listed = new Map();
  for (const line of parts.skills ?? []) {
    const colon = line.indexOf(":");
    for (const skill of splitSkills(colon === -1 ? line : line.slice(colon + 1))) listed.set(normalize(skill), skill);
  }
  for (const line of experienceLines) {
    // Role headers list tools after a bar: "Software Engineer | Python, React, AWS".
    const bar = line.indexOf("|");
    if (bar === -1 || parseRange(line)) continue;
    for (const skill of splitSkills(line.slice(bar + 1).replace(/\s{2,}.*$/, "").replace(/\b[A-Z][a-z]+(?:[- ][A-Z][a-z]+)*,\s*[A-Z]{2}$/, ""))) listed.set(normalize(skill), skill);
  }
  for (const [key, skill] of listed) {
    if (matchSkill(skill, names)) continue;
    add({ id: `skill-${key.replace(/[^a-z0-9]+/g, "-")}`, category: "skills", severity: "unverified", field: "skills", message: `"${skill}" is listed on the résumé but has no evidence in the canonical profile.`, resume: skill });
  }

  // Accomplishments: phrases a review item keeps out of the profile, then metrics with no
  // canonical counterpart.
  const allBullets = bullets([...(parts.experience ?? []), ...(parts.projects ?? [])]);
  const flaggedBullets = new Set();
  for (const item of reviewItems) {
    for (const phrase of item.mustNotAppear ?? []) {
      if (!contains(text, phrase)) continue;
      const bullet = allBullets.find(b => contains(b, phrase)) ?? null;
      if (bullet) flaggedBullets.add(bullet);
      add({
        id: `review-${item.id}-${normalize(phrase).replace(/[^a-z0-9]+/g, "-")}`,
        category: "accomplishments",
        severity: "conflict",
        field: item.field,
        message: `"${phrase}" is on the résumé; review item ${item.id} keeps it out of the canonical profile (${item.status === "resolved" ? `settled: ${item.canonical}` : "undecided"}).`,
        resume: bullet ?? phrase,
        canonical: item.canonical ?? null,
        review: item,
      });
    }
  }
  const canonicalMetrics = new Set(metricsIn(JSON.stringify(profile)).map(metricKey));
  for (const bullet of allBullets) {
    if (flaggedBullets.has(bullet)) continue;
    const missing = metricsIn(bullet).filter(metric => !canonicalMetrics.has(metricKey(metric)));
    if (!missing.length) continue;
    add({
      id: `metric-${normalize(bullet).replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`,
      category: "accomplishments",
      severity: "unverified",
      message: `${missing.map(metric => metric.text).join(", ")} ${missing.length === 1 ? "does" : "do"} not appear anywhere in the canonical profile.`,
      resume: bullet,
    });
  }

  const order = { conflict: 0, unverified: 1, info: 2 };
  const categories = ["experience", "education", "skills", "accomplishments", "contact"];
  items.sort((a, b) => order[a.severity] - order[b.severity] || categories.indexOf(a.category) - categories.indexOf(b.category));
  return {
    profileVersion: { schemaVersion: profile.schemaVersion ?? null, lastUpdated: profile.lastUpdated ?? null },
    summary: {
      conflict: items.filter(item => item.severity === "conflict").length,
      unverified: items.filter(item => item.severity === "unverified").length,
      info: items.filter(item => item.severity === "info").length,
    },
    items,
  };
}
