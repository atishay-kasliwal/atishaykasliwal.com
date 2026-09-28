// Photographs by Atishay Kasliwal, in their selected order.
const images = [
  {"src": "/photography/rainbow-over-autumn-trees.jpg", "alt": "Rainbow arching over autumn trees beneath a cloudy sky", "width": 397, "height": 223},
  {"src": "/photography/manhattan-skyline-at-dusk.jpg", "alt": "Illuminated Manhattan skyscrapers beneath a blue evening sky", "width": 2542, "height": 1906},
  {"src": "/photography/sunset-over-parking-lot.jpg", "alt": "Golden sunset clouds above trees and a busy parking lot", "width": 3388, "height": 1906},
  {"src": "/photography/person-on-rocky-beach-at-sunset.jpg", "alt": "A person looking toward the setting sun from a rocky beach", "width": 2860, "height": 1906},
  {"src": "https://i.pinimg.com/736x/c1/ca/c4/c1cac4cddb0523efc6e88efa30142688.jpg", "alt": "Bright reflections over city buildings at night", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/01/c8/9d/01c89dc79e5ab598aabcaa441ce2ad2e.jpg", "alt": "Broad waterfall beneath an overcast sky, with buildings across the river", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/23/2f/82/232f829082d3ae16e69bb3575c0c3f75.jpg", "alt": "Clusters of pink and yellow flowers among green leaves", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/c9/e6/5d/c9e65dbd2d22d26956de3264d46b9fc9.jpg", "alt": "Soft white grass seed heads against green foliage", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/2e/c0/f9/2ec0f9746edd4f4cc0227b02ee2d3dad.jpg", "alt": "Sunlit river water flowing around a dark rock", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/7c/6b/92/7c6b9252e64020a4bbcb58c42b567c7b.jpg", "alt": "Golden grasses beside a rocky shoreline", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/f6/16/7e/f6167e1f1774f2e8ca33a77aaa2bb5ed.jpg", "alt": "Waves breaking over a stony beach beneath a clear sky", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/d9/b1/94/d9b1949cf38f160f182402a64a557961.jpg", "alt": "A boat on a river beside waterfront steps and buildings", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/8b/3b/bc/8b3bbce8bcc7cd7b35fc4847aeb1477f.jpg", "alt": "City skyline at night beyond a bridge", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/3c/48/9b/3c489b06a81e11d13da06766405ea2e6.jpg", "alt": "Airplane wing silhouetted against a sunset above the clouds", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/70/82/a6/7082a68a534c51e84b8dda90db00bc83.jpg", "alt": "A boat moored along a riverbank at sunset", "width": 736, "height": 414},
  {"src": "https://i.pinimg.com/736x/f3/19/62/f31962d464371844bcec6f7adf1696c7.jpg", "alt": "Aerial view of tall city buildings in warm evening light", "width": 736, "height": 414}
];

const escape = value => String(value).replace(/[&<>"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
})[character]);
export const photographyPage = {
  url: "https://atishaykasliwal.com/photography/",
  title: "Photography | Atishay Kasliwal",
  description: "A collection of photographs taken by Atishay Kasliwal, from city streets and skylines to landscapes and everyday moments.",
  // Update when photography content changes, never at build time.
  lastModified: "2026-09-28",
  socialImage: "/photography/social/manhattan-skyline-at-dusk.jpg",
};
export const photographyWidths = [320, 640, 960, 1200, 1600, 2400];
export const photographyCardSizes = "(max-height: 460px) and (min-width: 500px) 180px, (max-height: 670px) and (min-width: 701px) 225px, (max-height: 600px) and (max-width: 700px) 57vw, (max-width: 459px) 74vw, (max-width: 700px) 340px, (min-width: 1700px) 320px, 270px";
export const photographyDeckSizes = "(max-height: 460px) and (min-width: 500px) calc((100svh - 180px) * 4 / 3), (max-width: 700px) 78vw, (max-width: 1107px) 56vw, 620px";
const previewSizes = "(max-width: 700px) calc(100vw - 20px), 736px";

export function photoVariants(photo) {
  // External photos and the small rainbow never receive generated derivatives.
  if (!photo.src.startsWith("/photography/") || photo.width <= 736) return [];
  const name = photo.src.split("/").at(-1).replace(/\.[^.]+$/, "");
  return photographyWidths.filter(width => width < photo.width).map(width => ({
    src: `/photography/responsive/${name}-${width}.webp`, width,
  }));
}
export function photoMarkup(photo, { lazy = true, sizes = photographyCardSizes, preview = false } = {}) {
  const candidates = photoVariants(photo).filter(variant => preview || variant.width <= 1200);
  const srcset = candidates.length
    ? ` srcset="${candidates.map(variant => `${variant.src} ${variant.width}w`).join(", ")}" sizes="${escape(sizes)}"`
    : "";
  return `<img src="${escape(photo.src)}"${srcset} width="${photo.width}" height="${photo.height}" alt="${escape(photo.alt)}" loading="${lazy ? "lazy" : "eager"}" decoding="async" />`;
}

export const photographs = images.map((photo, index) => ({
  ...photo,
  kind: "photo",
  name: `Photograph ${String(index + 1).padStart(2, "0")}`,
  theme: "photograph",
  card: photoMarkup(photo),
  art: photoMarkup(photo, { lazy: false, sizes: previewSizes, preview: true }),
}));
