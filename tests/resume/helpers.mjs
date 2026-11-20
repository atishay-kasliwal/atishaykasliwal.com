import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { buildProfile } from "../../src/profile/build.js";

const root = new URL("../../", import.meta.url);
export const SITE = "https://atishaykasliwal.com";
export const bundledPdf = () => new Uint8Array(readFileSync(new URL("public/Atishay-Kasliwal-Resume.pdf", root)));
// The résumé that was bundled until 2026-11-19: real, and outdated against the profile in known ways.
export const outdatedPdf = () => new Uint8Array(readFileSync(new URL("tests/resume/fixtures/outdated-resume.pdf", root)));
export const profileSchema = () => JSON.parse(readFileSync(new URL("src/profile/profile.schema.json", root), "utf8"));
export const canonicalProfile = () => JSON.parse(JSON.stringify(buildProfile({ onWarning() {} })));

// The D1 API subset the résumé code uses, on in-memory SQLite with the real migration.
export function memoryD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(readFileSync(new URL("migrations/0005_resume_versions.sql", root), "utf8"));
  const statement = (sql, binds = []) => ({
    bind: (...values) => statement(sql, values),
    all: async () => ({ results: sqlite.prepare(sql).all(...binds).map(row => ({ ...row })) }),
    first: async () => {
      const row = sqlite.prepare(sql).get(...binds);
      return row ? { ...row } : null;
    },
    run: async () => {
      const info = sqlite.prepare(sql).run(...binds);
      return { meta: { changes: Number(info.changes) } };
    },
  });
  return {
    sqlite,
    prepare: sql => statement(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const item of statements) results.push(await item.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

// R2 bucket: put/get/head with single byte ranges, as the Workers binding behaves.
export function memoryR2() {
  const objects = new Map();
  const toObject = (key, entry, range) => {
    const offset = range?.offset ?? 0;
    const length = range?.length ?? entry.bytes.length - offset;
    const slice = entry.bytes.slice(offset, offset + length);
    return {
      key,
      size: entry.bytes.length,
      range: range ? { offset, length } : undefined,
      httpMetadata: entry.options.httpMetadata ?? {},
      customMetadata: entry.options.customMetadata ?? {},
      body: new Blob([slice]).stream(),
      arrayBuffer: async () => slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.byteLength),
    };
  };
  return {
    objects,
    async put(key, bytes, options = {}) {
      objects.set(key, { bytes: new Uint8Array(bytes), options });
    },
    async head(key) {
      return objects.has(key) ? { key, size: objects.get(key).bytes.length } : null;
    },
    async get(key, options) {
      const entry = objects.get(key);
      if (!entry) return null;
      let range;
      const header = options?.range instanceof Headers ? options.range.get("Range") : null;
      if (header) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(header);
        assert.ok(match, `test R2 only supports single ranges, got ${header}`);
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : entry.bytes.length - 1;
        range = { offset: start, length: end - start + 1 };
      }
      return toObject(key, entry, range);
    },
  };
}

// The Pages asset store: the built profile, its schema and the bundled PDF.
export function memoryAssets({ profile = canonicalProfile(), pdf = bundledPdf() } = {}) {
  const files = {
    "/api/profile.json": [JSON.stringify(profile), "application/json; charset=utf-8"],
    "/api/profile.schema.json": [JSON.stringify(profileSchema()), "application/schema+json; charset=utf-8"],
    "/Atishay-Kasliwal-Resume.pdf": [pdf, "application/pdf"],
  };
  return {
    files,
    async fetch(input) {
      const url = new URL(typeof input === "string" ? input : input.url);
      const file = files[url.pathname];
      if (!file) return new Response("Not found", { status: 404 });
      return new Response(file[0], { headers: { "Content-Type": file[1], "X-Served-By": "assets" } });
    },
  };
}

// Cloudflare Access: a signing key whose public half the stubbed certs endpoint serves.
const b64url = bytes => Buffer.from(bytes).toString("base64url");
export async function accessFixture() {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return {
    certs: { keys: [{ ...jwk, kid: "k1" }] },
    async token(email, { aud = "aud-1", iss = "https://team.example", kid = "k1", exp = Math.floor(Date.now() / 1000) + 600, nbf } = {}) {
      const header = b64url(JSON.stringify({ alg: "RS256", kid }));
      const payload = b64url(JSON.stringify({ aud, iss, email, exp, ...(nbf === undefined ? {} : { nbf }) }));
      const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${header}.${payload}`));
      return `${header}.${payload}.${b64url(signature)}`;
    },
  };
}

// ---------- PDF fixtures ----------
const latin1 = text => Uint8Array.from(text, char => char.charCodeAt(0) & 0xff);
const escapePdf = text => text.replace(/[\\()]/g, char => `\\${char}`);

// A minimal, valid single-page PDF with Helvetica text, plus optional extra catalog entries and
// objects for the hostile fixtures. Offsets are computed so pdf.js reads it without repair.
export function makePdf(lines, { catalogExtra = "", extraObjects = [], trailerExtra = "", pageContent = null, pad = 0 } = {}) {
  const content =
    pageContent ??
    `BT /F1 10 Tf 14 TL 50 760 Td\n${lines.map(line => `(${escapePdf(line)}) Tj T*`).join("\n")}\nET`;
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R ${catalogExtra}>>`,
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ...extraObjects,
  ];
  let out = `%PDF-1.4\n%\xe2\xe3\xcf\xd3\n${pad ? `%${"x".repeat(pad)}\n` : ""}`;
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R ${trailerExtra}>>\nstartxref\n${xref}\n%%EOF\n`;
  return latin1(out);
}

// A résumé that agrees with the canonical profile on the facts it states.
export function consistentResumeLines() {
  return [
    "Atishay Kasliwal",
    "Software Engineer | katishay@gmail.com | New York, NY",
    "Education",
    "Stony Brook University Stony Brook, New York",
    "Master of Science in Data Science Aug. 2024 - May 2026",
    "Symbiosis University of Applied Sciences Indore, Madhya Pradesh",
    "Bachelor of Technology in Computer Science Aug. 2018 - May 2022",
    "Experience",
    "Stony Brook University November 2024 - May 2026",
    "Software Engineer, Research | Python, FastAPI, Apache Kafka",
    "* Grew the research platform from 200+ to about 1,000 daily users on Google Cloud.",
    "Wake Forest CAIR May 2025 - August 2025",
    "AI/ML Engineer | Python, PyTorch",
    "* Built an AI radiology platform over 10K+ MRI studies for a physician research team.",
    "Accolite August 2021 - August 2024",
    "Senior Software Developer | Java, Spring Boot, Kafka",
    "* Shipped production microservices for fintech, telecom and commerce clients.",
    "Shriffle August 2020 - May 2021",
    "Software Engineer Intern | Python",
    "* Built backend services during the degree.",
    "Technical Skills",
    "Languages: Java, Python, TypeScript, SQL",
  ];
}
