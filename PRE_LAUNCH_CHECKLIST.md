# Pre-launch checklist — changes not yet pushed/deployed

## Git status (as of this check)

- **Branch:** `master`, 1 commit ahead of `origin/master` (already committed: "Fix mobile responsiveness on landing page").
- **Uncommitted changes:** 6 modified files + untracked `src/project list/`.
- **Build:** `npm run build` completes successfully.

---

## 1. Summary of all local changes (uncommitted + unpushed)

### A. Already committed (1 commit ahead, not pushed)

- Fix mobile responsiveness on landing page.

### B. Uncommitted changes (staged = none; need add + commit)

| File | What changed |
|------|----------------|
| **src/App.js** | ScrollToTop simplified (no 2.5s scroll blocking); chat tooltip removed; route `/highlights/:id` added for project slugs. |
| **src/App.css** | (Likely tooltip/chat-related styles removed or adjusted.) |
| **src/HighlightDetail.js** | Scroll-to-top on project change only (no 2s scroll prevention); iframe load delay 400ms. |
| **src/HighlightDetail.css** | (Scroll/iframe-related tweaks.) |
| **src/Projects.js** | Clickable overlay cards (Link wrapper); grid span on wrapper; "Gemma 3" in description; span class on CardWrapper. |
| **src/Projects.css** | Grid column span on wrapper (not inner card); Project page button top-right (flex-start); selection/tap styles; black-rectangle fixes. |
| **src/project list/** (untracked) | Project content: `index.js`, `project1-healthcare.js`, `project2-gemma.js`, `project3-movie.js`, `project4-hospitality.js`, `project5-template.js`. |

---

## 2. End-to-end behavior to verify before going live

- [ ] **Home** (`/`) — Loads, no sticky scroll, copy/select works.
- [ ] **Highlights** (`/highlights`) — Two rows: row 1 = two images + Atrium block (with “Project page” top-right); row 2 = Gemma, Movie, Hospitality cards. No black rectangles on cards.
- [ ] **Click “Project page”** — Goes to `/highlights/healthcare-ai-research`, Healthcare AI content loads.
- [ ] **Click Gemma / Movie / Hospitality card** — Goes to `/highlights/gemma-nlp-research`, `/highlights/movie-data-analytics`, `/highlights/hospitality-ai-solutions`; correct project content and embeds load.
- [ ] **Scroll** — No sticky/jank in first 2–3 seconds after refresh or route change.
- [ ] **Chat** — Opens/closes; no tooltip (if that was intentional).
- [ ] **Art** (`/art`) — Works as before.
- [ ] **Footer / nav / resume / LinkedIn** — All links work.

---

## 3. Mobile-friendly checks

Already in place:

- **Viewport:** `index.html` has `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
- **Projects grid:**
  - **≤1024px:** 4 columns; card spans adjusted.
  - **≤768px:** 2 columns; all cards `span 2` (full width per row); text-carousel stacks (flex-direction: column); button/subtitle left-aligned; touch-friendly button min-height/min-width.
  - **≤480px:** 1 column; all cards `span 1`; banner/text sizes reduced; padding tightened.
- **Touch:** `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, min touch targets (e.g. 44px) where applicable.
- **Overflow:** `overflow-x: hidden` / `max-width: 100%` on key containers to avoid horizontal scroll.

Manual mobile checks:

- [ ] **Highlights on phone** — Single column; two images card, then Atrium block, then Gemma, Movie, Hospitality. No horizontal scroll. “Project page” and card taps work.
- [ ] **Project pages on phone** — Readable; iframes/embeds don’t overflow; header/nav usable.
- [ ] **Chat on phone** — Button and popup usable; keyboard doesn’t break layout.
- [ ] **Landing (home)** — Layout and tap targets good on 320px–428px width.
- [ ] **Portrait + landscape** — No broken layout at 768px and 480px breakpoints.

---

## 4. Before you push and deploy

1. **Commit everything you want to ship:**
   ```bash
   git add src/App.js src/App.css src/HighlightDetail.js src/HighlightDetail.css src/Projects.js src/Projects.css "src/project list/"
   git status   # confirm
   git commit -m "Highlights: clickable cards, grid fix, scroll fix, project pages, mobile"
   ```

2. **Push:**
   ```bash
   git push origin master
   ```

3. **Deploy** using your normal process (e.g. Cloudflare Pages, GitHub Pages, or script in repo).

4. **After deploy:** Open the live site (e.g. https://atishaykasliwal.com) and re-run the end-to-end and mobile checks above on a real device or DevTools device emulation.

---

## 5. Optional: run locally and test mobile

```bash
npm start
# Then in Chrome: DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M) → pick iPhone/Android, refresh /highlights and project pages
```

---

*Generated as a pre-launch checklist. Remove or edit this file as needed after release.*
