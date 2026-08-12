import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['src', 'scripts', 'test'];
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs']);
const IGNORED_SEGMENTS = new Set(['node_modules', 'build', '.ssr', 'artifacts']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_SEGMENTS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function loaderFor(filePath) {
  return path.extname(filePath) === '.jsx' ? 'jsx' : 'js';
}

async function lintFile(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  await transform(source, {
    loader: loaderFor(filePath),
    sourcefile: path.relative(ROOT, filePath),
    jsx: 'automatic',
    format: 'esm',
    target: 'es2022',
  });
}

async function main() {
  const files = (
    await Promise.all(
      TARGETS.map(async (segment) => {
        const full = path.join(ROOT, segment);
        try {
          return await walk(full);
        } catch {
          return [];
        }
      })
    )
  ).flat();

  const failures = [];

  for (const file of files) {
    try {
      await lintFile(file);
    } catch (error) {
      failures.push({
        file: path.relative(ROOT, file),
        message: error.message,
      });
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`Syntax lint failed: ${failure.file}\n${failure.message}\n`);
    }
    process.exit(1);
  }

  console.log(`Syntax lint passed for ${files.length} files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
