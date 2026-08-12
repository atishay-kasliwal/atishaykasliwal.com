# About page — ideas & decisions

Working notes from the planning conversation on the `/about` redesign. Nothing here is built yet — this is the idea backlog and the decisions already made, so we don't re-litigate them next session.

## Goal

The point of this page is to demonstrate how creative he is — but expressed *within* the site's existing design language (the "spec-sheet" theme: hairlines, mono labels, calibration ticks, corner brackets, Playfair display headings, the single accent gradient, dark-only palette), not by introducing a new visual style that fights the rest of the site. Every idea below (self-drawing line art, page-flip books, the places gallery, line-art interest icons) should read as inventive *execution* of the existing system, not a departure from it. This is the filter for judging every idea in this doc: creative, but on-theme.

## Current state (baseline)

`AboutPage.jsx` is back to its original, full-content version (matches `master`, working tree clean). Sections top to bottom: Hero (status, headline, portrait) → Currently → Bio/narrative → Notable orgs → Focus areas → Principles → Selected work → Skills → Education → Beyond work → FAQ → CTA. All copy pulls from real data in `src/data/site.js`, `experience.js`, `education.js`, `faqs.js` — no lorem ipsum in there.

Known integrity issue found while exploring, **not yet fixed**: `/art` (`ArtPage.jsx`) hotlinks Pinterest image URLs and captions them "Frames I kept looking at... shot in New York · Chicago" — implying personal photography that isn't actually his. Worth revisiting separately from the About page work.

## Idea 1 — Bookshelf (page-flip effect)

- Reference: turnjs.com — but that project is dead (its own TLS cert has expired, jQuery-based, last real maintenance years ago).
- **Decision:** use `react-pageflip` instead — same realistic page-curl effect, real React component, MIT licensed, actively maintained. No jQuery.
- Shape: 2 shelves × 4 books = 8 books.
- Content: **left open** — could be resume sections (Experience/Education/Skills/etc as chapters), featured projects (one book per project), or just decorative to start. Not decided.

## Idea 2 — NYC skyline hero (self-drawing line art)

- Reference: `img2svg-animation` (github.com/a1stok/img2svg-animation) — a web app that traces an uploaded raster photo into line art via `potrace` and animates the strokes drawing themselves in via `anime.js`. Not a library to install; it's a one-off tool you'd run against a specific photo.
- **Decision:** hand-build the SVG line art directly instead of running their tool (no source photo, avoids a heavy one-off toolchain for a single asset). Landmarks planned: One World Trade Center, Empire State Building, Chrysler Building, generic skyline filler, Brooklyn Bridge. Self-drawing technique: every shape gets `pathLength="1"` so one `stroke-dasharray`/`stroke-dashoffset` animation (1 → 0) works uniformly regardless of actual path length; landmarks stroked with the site's accent gradient, everything else a dim sketch line.
- This was actually built once (`NYSkyline.jsx` + hero wiring in `AboutPage.jsx`) then reverted/deleted. Recoverable from this conversation's history if we want it back, but superseded by the "actual about me, not dummy stuff" pivot below.

## Pivot — "the actual about me, not dummy stuff"

Redirected away from pure visual experimentation toward making sure the page's content and imagery are real and honestly presented. This governs every decision below.

## Idea 3 — Hero in the "Kev Luna" style

- Reference: a Figma community portfolio template screenshot — floating product photography, dashed alignment/crosshair guides, bold centered display type, mono annotation labels, subtle grid background. Notably, this aesthetic already overlaps with the site's existing "spec-sheet" language (hairline ticks, corner brackets, mono labels already used elsewhere).
- **Decision:** do NOT extract and reuse the reference template's own images (licensing risk, and it isn't actually about him). Rebuild the composition style using his own imagery instead.
- Explored `~/Desktop` folders (`Portfolio/`, `Portfolio_Output/`, `Final images/`, `_cutouts/`) looking for source images. Findings:
  - Most images here are **polished stock/reference photography** he sourced and background-removed (via an isnet/rembg-style pipeline), not personal camera shots — e.g. "chicago bean.png", "chicago sjyline.png" are studio-quality stock cutouts, not travel snapshots.
  - Cutout quality across the batch is inconsistent — some are clean (Grand Central statue, Wall Street Bull), many are broken (SBU entrance, Accolite logo attempt both failed segmentation, left artifacts/near-blank canvases).
  - Some folders contain personal/family property photos (childhood home, a relative's house) — flagged as not appropriate for a public site regardless of caption honesty (privacy, not just attribution).
- Still open: exactly which images end up in the hero, and final layout. Not built yet.

## Idea 4 — Photography/places gallery (lightGallery)

- Reference: lightgalleryjs.com's own demo page — masonry grid of photos, click to open in a lightbox.
- **Decision on framing:** since the candidate images are sourced/stock rather than his own photography, the gallery must be **honestly framed as a "places along the way" journey motif** (cities lived in and traveled to), never captioned as "my photography." This directly avoids repeating the `/art` page's Pinterest-hotlink mislabeling problem.
- Candidate places (from real bio facts, not the sketchier personal-property photos): Indore / Symbiosis University (undergrad), Stony Brook (grad school), Accolite Digital (work), New York (current home), Chicago (travel).
- **License flag:** `lightgallery` core npm package is **GPLv3**. That's a real constraint for a personal site — needs either a lighter/MIT-licensed lightbox, or a deliberate call to accept GPL, before this gets built. Not resolved yet.

## Idea 5 — "About me" flipbook (page-turning book)

- Same underlying tech as Idea 1 (`react-pageflip`), applied specifically to the bio narrative instead of a bookshelf of projects.
- **Decision:** content = the existing bio/journey turned into book chapters, built from real data already in the codebase (not invented): **Origin** (India → Symbiosis) → **Systems** (Accolite / Fidelity / BT Group) → **ML** (Wake Forest research) → **Now** (Stony Brook / Atriveo / New York) → **Beyond** (interests) → **Contact**.
- Not yet decided how this coexists with Idea 1's bookshelf — likely these merge into one book concept rather than two separate features, but that hasn't been discussed explicitly.

## Idea 6 — Beyond work / interests (real content, gathered)

Real answers gathered directly from him, to replace whatever placeholder-ish "Beyond work" content exists today:

- **Loves:** cricket (bowling), swimming.
- **Currently into:** running, walking, gym, table tennis, badminton.
- **Visual style reference:** a single continuous-line minimalist illustration (shown as an example: a bowling/cricket ball drawn in one unbroken pen stroke plus a ground line) — same self-drawing-stroke technique as Idea 2's skyline. Intent seems to be small line-art icons per interest, animated the same way.

## Idea 7 — Dance choreography web app (new side project)

More real content, gathered directly from him: he loves creating innovative ideas/building things, and is currently building a **dance choreography web app**. Two feature ideas mentioned for it so far:

- **Jain temple bhajan rhythm feature** — rhythm/tempo ideas for choreography drawn from bhajans (devotional songs) as sung in Jain temple tradition.
- **Reel video comparison** — a feature for comparing dance reels/videos side by side (likely for practicing or refining choreography against a reference performance).

This is early-stage and worth a follow-up conversation to nail down scope, but it's a real, currently-in-progress project — a strong candidate for the "Currently" strip and/or "Beyond work" section on `/about`, alongside Atriveo, in the same way the existing page already treats Atriveo as a live side project rather than a portfolio placeholder.

## Open threads / not yet decided

- Which exact images go in the Idea 3 hero.
- How to resolve the `lightgallery` GPLv3 licensing question (Idea 4).
- Whether the bookshelf (Idea 1) and the bio flipbook (Idea 5) are one feature or two.
- Whether/when to fix the `/art` page's Pinterest-image mislabeling (adjacent issue, not in scope of `/about` itself unless he wants it bundled in).
- Overall page structure: how these new sections (hero, gallery, book, interests) slot in alongside or replace the existing full-content sections in `AboutPage.jsx`.
