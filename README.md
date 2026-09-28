# Atishay's portfolio

A single-screen developer portfolio inspired by Elliott Mangham's information layout and bottom project carousel. Built with Vite, vanilla JavaScript, and CSS. Fonts and project artwork are served locally.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://127.0.0.1:5173.

```sh
npm run build
npm run preview
```

## SEO and performance checks

`npm test` builds the static site and validates page metadata, canonicals, structured data, internal links, sitemap coverage, robots rules, and Cloudflare headers. `npm run lhci` runs the configured Lighthouse CI checks against the production build.

To audit the deployed site with the pinned SEO crawler, run `npm run seo:sitemap:live` for sitemap health and `npm run seo:crawl:live` for a full technical crawl. Reports are written under `artifacts/`.

After replacing a project card, the Reel source stills, the Bayesian chart, or the profile portrait, run `npm run images:responsive` to regenerate their responsive WebP alternatives. Full-resolution originals remain available for higher-density displays.

## Update the content

- `src/projects.js` contains the eleven featured GitHub projects: links, stacks, descriptions, and artwork. Live-product screenshots are in `public/projects/`.
- Carousel card images are in `public/projects/cards/`. The preview window plays a looping video from `public/projects/video/`: a scroll recording for live sites (Tracker, Bio, Job Search) and an animated HTML scene from `scripts/scenes/` for the rest (Insurance, Cortex, FedTalk). To re-record them after a site or scene changes:

  ```sh
  python3 -m venv .venv && .venv/bin/pip install playwright   # once
  .venv/bin/python scripts/record_previews.py                  # all, or name one: tracker, bio, jobs, insurance, cortex, fedtalk, profile, reel, kaggriculture, mmm, raft
  ```

  The script uses your installed Google Chrome and `ffmpeg`. Visitors who prefer reduced motion see the still screenshot instead.
- The Bayesian Marketing Mix scene uses authentic exported charts stored in `public/projects/media/bayesian-mmm/`. Kaggriculture and InsureRaft scene values come directly from their repository snapshot and README, so keep those assets and labels in sync when the projects change.
- `index.html` contains the draft introduction and profile information.
- `src/style.css` controls layout, responsive behavior, and the CSS artwork for code-only projects.
- `src/project-carousel.js` handles each looping carousel and its pointer and keyboard controls; `src/main.js` connects them to the shared project preview.
- `src/section-accordion.js` switches between Selected work, Experience, and Photography. Work starts open unless the visit includes a section link such as `/#photography`; opening one closes the others. If all three are closed, Work reopens after five seconds; opening a section cancels that timer. Experience uses the shared carousel controls with work and education entries from `src/experience.js`; `src/experience-pages.js` and `scripts/build-experience-pages.mjs` supply their detail pages and sitemap entries.
- `src/photography.js` contains sixteen photographs by Atishay: four local photos first, followed by twelve photos loaded from their Pinterest image URLs. Gallery images load lazily; photography previews fill a consistent, responsive 16:9 frame with a centered crop, with no project text or cursor marquee.
- Local photographs live in `public/photography/`, with descriptive filenames. Add their paths, descriptions, and dimensions to `src/photography.js` to display them in the gallery.
- `scripts/build-photography.mjs` generates the real `/photography/` document from the same dataset, with the homepage header, footer, and contact navigation. The photo stack advances every 2.5 seconds with smooth card transitions, a pause control, arrow keys, previous/next controls, and swipe browsing. Selecting a neighboring card brings it to the front; photographs stay in the stack without pop-out previews on this page. Rotation pauses on hover, keyboard focus, open contact details, and inactive tabs, and respects reduced motion. Without JavaScript, all sixteen photographs remain visible in a normal gallery with links to the images.
- The homepage Photography heading is a real `/photography/` link. JavaScript preserves its accordion behavior; a modified click opens the standalone page. The homepage loop and five-second Projects fallback remain unchanged.
- `npm run images:photography` generates uncropped WebP alternatives at 320, 640, 960, 1200, 1600, and 2400 pixels for the three large local photographs. Builds also generate missing/stale files automatically. Cards and previews use responsive sources; the 397px rainbow is never upscaled. The Manhattan photograph supplies the standalone page's social image. The generator never accesses Pinterest.
- `scripts/photography-seo.mjs` emits sixteen ImageObjects with one description each and credits referencing `https://atishaykasliwal.com/#person`. Only the standalone document has an ImageGallery, with one `hasPart` collection. Its canonical is `https://atishaykasliwal.com/photography/`; the sitemap associates all sixteen absolute image URLs with that page. Update `photographyPage.lastModified` only when photography content changes. `npm test` verifies initial HTML, responsive asset dimensions, schema, attribution, and sitemap coverage.
- `src/intro.js` contains the multilingual welcome sequence, language tags, and timing.
- `src/info-sheet.js` handles the phone-only details sheet. Its content lives at the bottom of `index.html`, so update it along with the header details.
- `DESIGN-REFERENCES.md` records the chosen design directions.
- SEO and sharing live in the `<head>` of `index.html`: description, canonical URL, link-preview tags, and structured data (who you are and the eleven projects; keep it in sync with the masthead and `src/projects.js`). `public/` holds `robots.txt`, `sitemap.xml` (update `lastmod` when content changes), `_redirects` (old site URLs → homepage or résumé), `_headers` (security and caching) and `404.html`. Re-render the share image and home-screen icon with `.venv/bin/python scripts/render_og.py`.

The bottom carousel drifts continuously left at 18 pixels per second, matching the observed reference speed. It pauses while hovered, during keyboard interaction, while the intro or a dialog is open, or with the pause button. Reduced motion disables automatic movement. The strip supports dragging, touch swipes, mouse-wheel/trackpad scrolling, previous/next buttons, and left/right arrow keys without scrolling the page. Clicking a neighboring card selects it; clicking the selected card or pressing Enter on the carousel opens its preview. Escape closes dialogs.

The page opens with a Dennis-inspired multilingual greeting intro and curved upward reveal. It plays on each fresh load and can be skipped with the button or Escape. Reduced-motion preferences bypass the intro. The layout always fits one screen. On desktop (1101px and wider) the page also has a scroll track, after Elliott Mangham's site: scrolling swaps three statements word by word (`src/scroll-story.js`; edit their text in `index.html`), fills the "Scroll" bar, and drifts the carousel. Tablets, phones and reduced-motion visitors see only the first statement. Over the carousel, the wheel moves the carousel instead of the page. A violet pill follows the pointer over project cards with the project name and year scrolling inside (`src/cursor-marquee.js`). Dialogs can scroll when content needs more space.
