/**
 * About page taste index.
 *
 * The media lists are provisional editorial picks used to shape the section
 * visually; they should be swapped to Atishay's own exact recommendations
 * once confirmed.
 */

export const ABOUT_TASTE_COLUMNS = [
  {
    id: 'movies',
    plate: '02',
    label: 'Films',
    title: 'Movies I keep recommending',
    accent: '#7c9cff',
    shape: 'poster',
    /* `cover` is the one-sheet at /posters/<slug>.jpg, generated from
       src/assets/posters by scripts/build-images.mjs — same mechanism as the
       sleeves below. None are wired yet: no poster art is in the repo, so every
       card here still falls back to a photograph. */
    items: [
      { title: 'Interstellar', meta: 'Christopher Nolan / 2014' },
      { title: 'Whiplash', meta: 'Damien Chazelle / 2014' },
      { title: 'The Social Network', meta: 'David Fincher / 2010' },
      { title: 'Good Will Hunting', meta: 'Gus Van Sant / 1997' },
      { title: 'The Dark Knight', meta: 'Christopher Nolan / 2008' },
      { title: 'Yes Man', meta: 'Peyton Reed / 2008' },
      { title: '(500) Days of Summer', meta: 'Marc Webb / 2009' },
    ],
  },
  {
    id: 'albums',
    plate: '03',
    label: 'Music',
    title: 'Music on repeat',
    accent: '#9d83ff',
    shape: 'square',
    /* `cover` is the sleeve at /albums/<slug>.jpg, generated from
       src/assets/albums by scripts/build-images.mjs. Optional: an entry without
       one falls back to a photograph, so the row fills in as art lands.

       For a track, the sleeve is the album the track appears on — Sparks is on
       Parachutes, Congratulations is on Stoney.

       Two entries were renamed to the record whose sleeve arrived for them:
       The Divine Feminine rather than Swimming, X&Y rather than A Rush of Blood
       to the Head. Both are still the same artist, and the alternative was a
       card whose picture contradicted its caption.

       Rockstar is the A.R. Rahman soundtrack to Imtiaz Ali's 2011 film, which
       is what the sleeve supplied for this slot actually was; the earlier
       "Post Malone / track" reading of it was wrong.

       Its cover is deliberately absent rather than pointing at a path that does
       not exist yet — a `cover` that 404s renders a broken image, while no
       `cover` at all falls back to a photograph. To finish it: drop the art at
       src/assets/albums/ar-rahman-rockstar.jpg, run `npm run images`, then add
         cover: '/albums/ar-rahman-rockstar.jpg',
         coverAlt: 'Rockstar (2011) — A.R. Rahman soundtrack album cover',
       to the entry below. */
    items: [
      {
        title: 'Sparks',
        meta: 'Coldplay / track',
        cover: '/albums/coldplay-parachutes.jpg',
        coverAlt: 'Coldplay — Parachutes album cover',
      },
      {
        title: 'The Divine Feminine',
        meta: 'Mac Miller / album',
        cover: '/albums/mac-miller-the-divine-feminine.jpg',
        coverAlt: 'Mac Miller — The Divine Feminine album cover',
      },
      {
        title: 'X&Y',
        meta: 'Coldplay / album',
        cover: '/albums/coldplay-x-and-y.jpg',
        coverAlt: 'Coldplay — X&Y album cover',
      },
      {
        title: 'Congratulations',
        meta: 'Post Malone / track',
        cover: '/albums/post-malone-stoney.jpg',
        coverAlt: 'Post Malone — Stoney album cover',
      },
      { title: 'Rockstar', meta: 'A.R. Rahman / album' },
    ],
  },
];
