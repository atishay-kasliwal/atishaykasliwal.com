/**
 * Run SQL migrations from db/migrations against NEON_DATABASE_URL.
 * Usage (from repo root): NEON_DATABASE_URL='postgresql://...' node apps/api/scripts/run-migrations.js
 */
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const migrationsDir = path.join(repoRoot, "db", "migrations");

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("Set NEON_DATABASE_URL to run migrations.");
  process.exit(1);
}

const sql = neon(url);

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
if (files.length === 0) {
  console.log("No migration files in db/migrations.");
  process.exit(0);
}

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const body = fs.readFileSync(filePath, "utf8");
  const statements = body
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  console.log(`Running ${file} (${statements.length} statement(s))...`);
  for (const statement of statements) {
    if (statement) await sql.query(statement + ";", []);
  }
  console.log(`  Done: ${file}`);
}
console.log("Migrations complete.");
