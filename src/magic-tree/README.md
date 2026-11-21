# Magic Tree (vendored)

The 3D tree on the homepage is [Magic Tree](https://github.com/Slifronic/magic-tree) by the Magic
Tree contributors, MIT licensed (see LICENSE). `scene/` is copied from `src/scene/` at commit
`e67d2ca53725879dcf7ddad60d4bfd70a6700f92`. Only the three.js scene is used; the original React UI is not.

Changes from upstream, all in `scene/index.ts`:
- transparent renderer and no scene background, so it sits on the site's black page;
- no control dock (`dockPx` starts at 0) and no development `window` hook;
- pixel ratio capped at 1.5 and a 1024px shadow map, to stay light on the homepage;
- `codeZoomOut` and `codeAtBottom`, so the tapped code view can show the code smaller than the
  canvas and down where the ground was;
- a two-storey option in `species.ts` and `tree.ts`: the crown raised on a taller trunk, with a
  smaller tier of branches and leaves partway up it.

Themes (LinkedIn, GitHub, seasonal résumé) are this site's own, in `../hero-tree.js`.
