import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const BUILD = path.join(ROOT, 'build');
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const EXCLUDED_BUILD_FILES = ['/magazine/atishay-issue-01.pdf'];

async function copyIfPresent(relativePath) {
  const source = path.join(PUBLIC, relativePath);
  const target = path.join(BUILD, relativePath);

  try {
    await fs.copyFile(source, target);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function removeExcludedBuildFiles() {
  for (const relativePath of EXCLUDED_BUILD_FILES) {
    const target = path.join(BUILD, relativePath);
    try {
      await fs.unlink(target);
      console.log(`· excluded from deploy: ${relativePath}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

async function collectLargeFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectLargeFiles(fullPath, results);
      continue;
    }

    const stats = await fs.stat(fullPath);
    if (stats.size > MAX_FILE_SIZE_BYTES) {
      results.push({
        path: fullPath,
        size: stats.size,
      });
    }
  }

  return results;
}

function formatMiB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

async function main() {
  await copyIfPresent('_redirects');
  await copyIfPresent('_headers');
  await removeExcludedBuildFiles();

  const largeFiles = await collectLargeFiles(BUILD);
  if (largeFiles.length === 0) {
    console.log('✓ finalize-build: deploy payload is within file size limits');
    return;
  }

  console.error('\n✗ build contains file(s) larger than 25 MiB:\n');
  for (const file of largeFiles) {
    console.error(`  ${path.relative(ROOT, file.path)} (${formatMiB(file.size)} MiB)`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error('✗ finalize-build failed\n', error);
  process.exit(1);
});
