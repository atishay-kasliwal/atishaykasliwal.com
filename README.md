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

## Update the content

- `src/projects.js` contains the six featured GitHub projects: links, stacks, descriptions, and artwork. Live-product screenshots are in `public/projects/`.
- Carousel card images are in `public/projects/cards/`. For live sites, the preview window plays a scroll recording from `public/projects/video/`. To re-record them after a site changes:

  ```sh
  python3 -m venv .venv && .venv/bin/pip install playwright   # once
  .venv/bin/python scripts/record_previews.py                  # all sites, or name one: tracker, bio, jobs
  ```

  The script uses your installed Google Chrome and `ffmpeg`. Visitors who prefer reduced motion see the still screenshot instead.
- `index.html` contains the draft introduction and profile information.
- `src/style.css` controls layout, responsive behavior, and the CSS artwork for code-only projects.
- `src/main.js` handles the looping carousel, pointer and keyboard controls, and project dialogs.
- `src/intro.js` contains the multilingual welcome sequence, language tags, and timing.
- `src/info-sheet.js` handles the phone-only details sheet. Its content lives at the bottom of `index.html`, so update it along with the header details.
- `DESIGN-REFERENCES.md` records the chosen design directions.

The bottom carousel drifts continuously left at 18 pixels per second, matching the observed reference speed. It pauses while hovered, during keyboard interaction, while the intro or a dialog is open, or with the pause button. Reduced motion disables automatic movement. The strip supports dragging, touch swipes, mouse-wheel/trackpad scrolling, previous/next buttons, and left/right arrow keys without scrolling the page. Clicking a neighboring card selects it; clicking the selected card or pressing Enter on the carousel opens its preview. Escape closes dialogs.

The page opens with a Dennis-inspired multilingual greeting intro and curved upward reveal. It plays on each fresh load and can be skipped with the button or Escape. Reduced-motion preferences bypass the intro. The main page remains within the viewport; dialogs can scroll when content needs more space.
