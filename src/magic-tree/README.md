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
- `SceneOptions` (`qrVersion`, `treeSeed`, with matching parameters in `qr.ts` and `canopy.ts`), so
  one tree can stand over several links' codes of the same size;
- `setPaletteTurn` (and `turnLeaves` in `canopy.ts`): a season change where the leaves turn a few
  at a time in random order instead of all at once;
- `setFallingLeaves` (and its options in `motes.ts`): leaf-sized falling leaves that break off
  the crown and flutter down, instead of small motes drifting over the plot;
- a two-storey option in `species.ts` and `tree.ts`: the crown raised on a taller trunk, with a
  smaller tier of branches and leaves partway up it.
- a garden in `plot.ts`: the code's dark modules are clipped hedges (top at 0.28, under the settled
  leaves, so the code view still scans), each a slightly different shade, and the rim outside the
  quiet zone is a bed of flowers in the canopy's colours, shrubs and stones. The plot's size is unchanged.

Themes (LinkedIn, GitHub, seasonal résumé) are this site's own, in `../hero-tree.js`.
