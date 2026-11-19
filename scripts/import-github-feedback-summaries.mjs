#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildSummarySql, validateSummaries } from "../src/github-feedback-core/summaries.js";

const argv = process.argv.slice(2);
const files = argv.filter(arg => !arg.startsWith("--"));
if (files.length !== 1 || argv.some(arg => arg.startsWith("--") && !["--local", "--remote", "--dry-run"].includes(arg)) || (argv.includes("--local") && argv.includes("--remote"))) {
  throw new Error("usage: import-github-feedback-summaries.mjs file.json [--local|--remote] [--dry-run]");
}
const payload = JSON.parse(readFileSync(files[0], "utf8"));
const entries = validateSummaries(payload);
const dir = path.resolve(".wrangler/github-feedback");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "summaries.sql");
writeFileSync(file, buildSummarySql(payload));
console.log(`Validated ${entries.length} summaries/omissions. SQL: ${file}`);
if (argv.includes("--dry-run")) process.exit(0);
const target = argv.includes("--remote") ? "--remote" : "--local";
const run = args => execFileSync("npx", ["wrangler", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024 });
if (target === "--local") run(["d1", "migrations", "apply", "photography", target]);
run(["d1", "execute", "photography", target, "--yes", "--file", file]);
console.log(`Imported ${entries.length} summaries/omissions into ${target.slice(2)} D1.`);
