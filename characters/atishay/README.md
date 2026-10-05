# Atishay page mascot

Generated with the built-in imagegen tool using `public/atishay-kasliwal-512.webp` as the likeness reference. Source sheets are kept here for future rebuilds. The page serves the aligned WebP atlases from `public/mascots/`.

The interaction in `src/page-mascot.js` adapts the [page-mascot workflow](https://github.com/nilbuild/page-mascot/tree/main/skills/page-mascot) to this site's vanilla JavaScript. It follows the pointer on desktop, cycles through nine expressions when clicked, and respects reduced motion. Below 701px it is hidden.

Directions prompt: Draw a 3×3 transparent cartoon sprite sheet based on Atishay's portrait, preserving warm brown skin, thick side-swept black hair and dark plum polo. Use bold outlines, friendly large eyes and simplified cel shading. Keep front-facing neck and shoulders identical; turn only the head. Order: up-left/up/up-right, left/front/right, down-left/down/down-right, from the viewer's perspective. Keep a gentle smile and generous empty margins.

Expressions prompt: Match the directions sheet's character, colors, outline, size and fixed shoulders exactly. All nine faces look forward. Order: closed happy eyes, heart, sparkles, surprise, starstruck, blush, sleep, dizzy, joyful grin. Keep symbols inside the cell margins and use true transparency.

The generated directions sheet was normalized to square dimensions before building. The build pipeline aligns the frames and fades their lower edges.
