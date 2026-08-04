/**
 * Compiles content/posts/*.md into src/content/generated/posts.json.
 *
 * Everything expensive happens here, at build time: markdown parsing, syntax
 * highlighting, TOC extraction, reading time. The client receives finished HTML
 * strings and ships zero bytes of markdown or highlighting machinery — which is
 * why react-syntax-highlighter (1MB of Prism, previously in the main path) is
 * no longer needed for articles at all.
 *
 * Runs before `vite build`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { createHighlighter } from 'shiki';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'generated');

/* ── Frontmatter ───────────────────────────────────────────────────────── */

/**
 * Minimal YAML frontmatter parser. Deliberately not gray-matter — the schema is
 * fixed and tiny (strings, booleans, and flat string arrays), so a dependency
 * that pulls in a full YAML engine is not worth it.
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const [, yaml, body] = match;
  const data = {};

  for (const line of yaml.split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    let value = rawValue.trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (value === 'true' || value === 'false') {
      value = value === 'true';
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }

    data[key] = value;
  }

  return { data, body };
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

/** 220 wpm is a realistic rate for technical prose with code blocks skipped. */
function readingTime(text) {
  const words = text.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Strip markdown to plain text — used for search index and word counts. */
function toPlainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── Build ─────────────────────────────────────────────────────────────── */

async function main() {
  let files = [];
  try {
    files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  } catch {
    console.log('· no content/posts directory — writing empty post index');
  }

  const highlighter = await createHighlighter({
    themes: ['github-dark-dimmed', 'github-light'],
    langs: ['python', 'javascript', 'typescript', 'jsx', 'tsx', 'bash', 'json', 'sql', 'yaml', 'java', 'go', 'css', 'html'],
  });

  const posts = [];

  for (const file of files) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf-8');
    const { data, body } = parseFrontmatter(raw);

    if (data.draft === true) {
      console.log(`· skipping draft: ${file}`);
      continue;
    }

    const slug = data.slug || file.replace(/\.md$/, '');
    const toc = [];

    /* Custom renderer: adds stable heading IDs for the TOC and deep links,
       and hands code blocks to Shiki with both themes so the article respects
       light/dark without a second render. */
    const renderer = new marked.Renderer();

    renderer.heading = ({ tokens, depth }) => {
      const text = tokens.map((t) => t.raw).join('');
      const id = slugify(text);
      if (depth === 2 || depth === 3) toc.push({ id, text, depth });
      const inner = marked.parseInline(text);
      return `<h${depth} id="${id}" class="post-h${depth}">` +
        `<a class="heading-anchor" href="#${id}" aria-label="Link to ${text.replace(/"/g, '')}">#</a>` +
        `${inner}</h${depth}>\n`;
    };

    renderer.code = ({ text, lang }) => {
      const language = (lang || 'text').trim();
      const supported = highlighter.getLoadedLanguages().includes(language);

      if (!supported) {
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<figure class="code-block" data-lang="${language}"><pre><code>${escaped}</code></pre></figure>\n`;
      }

      const html = highlighter.codeToHtml(text, {
        lang: language,
        themes: { light: 'github-light', dark: 'github-dark-dimmed' },
        defaultColor: false,
      });

      // data-code carries the raw source for the copy button, so the client
      // never has to reach into the DOM and reconstruct it from spans.
      const encoded = Buffer.from(text, 'utf-8').toString('base64');
      return `<figure class="code-block" data-lang="${language}" data-code="${encoded}">${html}</figure>\n`;
    };

    renderer.link = ({ href, title, tokens }) => {
      const text = marked.parseInline(tokens.map((t) => t.raw).join(''));
      const external = /^https?:\/\//.test(href) && !href.includes('atishaykasliwal.com');
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${title ? ` title="${title}"` : ''}${attrs}>${text}</a>`;
    };

    // Images need explicit dimensions to avoid CLS, but markdown has no syntax
    // for them; loading/decoding hints are the best available here.
    renderer.image = ({ href, title, text }) =>
      `<img src="${href}" alt="${text || ''}"${title ? ` title="${title}"` : ''} loading="lazy" decoding="async" />`;

    const html = marked.parse(body, { renderer, gfm: true, breaks: false });
    const plain = toPlainText(body);

    posts.push({
      slug,
      title: data.title || slug,
      description: data.description || plain.slice(0, 155),
      date: data.date,
      updated: data.updated || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      category: data.category || 'Engineering',
      featured: data.featured === true,
      image: data.image || null,
      readingTime: readingTime(body),
      wordCount: plain.split(/\s+/).filter(Boolean).length,
      toc,
      html,
      // Truncated plain text powers client-side search without shipping the
      // full article body into the search index.
      excerpt: plain.slice(0, 400),
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUT_DIR, 'posts.json'),
    JSON.stringify(posts, null, 2),
    'utf-8'
  );

  console.log(`✓ compiled ${posts.length} post(s) → src/content/generated/posts.json`);
}

main().catch((err) => {
  console.error('✗ content build failed\n', err);
  process.exit(1);
});
