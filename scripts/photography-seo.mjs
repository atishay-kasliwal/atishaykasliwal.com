import { profileLinks } from "../src/profile-links.js";
const SITE = "https://atishaykasliwal.com/";
const PERSON = `${SITE}#person`;
const escape = value => String(value).replace(/[&<>"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
})[character]);

export function photographySchema(photographs, page, standalone = false) {
  const license = `${page.url}#rights`;
  const acquireLicensePage = "mailto:katishay@gmail.com";
  const images = photographs.map(photo => {
    const contentUrl = new URL(photo.src, SITE).href;
    return {
      "@type": "ImageObject",
      "@id": `${contentUrl}#image`,
      contentUrl,
      description: photo.alt,
      creator: { "@id": PERSON },
      creditText: "Atishay Kasliwal",
      copyrightNotice: "Atishay Kasliwal",
      license,
      acquireLicensePage,
      isPartOf: { "@id": page.url },
    };
  });
  return {
    "@context": "https://schema.org",
    "@graph": [
      // A minimal Person stub, only on the standalone page: each page's JSON-LD is validated
      // in isolation by Google, so "creator": { "@id": PERSON } must resolve locally there. The
      // homepage embeds this same schema too, but it already declares the canonical Person
      // itself, and a second node with the same @id would be a duplicate on that page.
      ...(standalone ? [
        { "@type": "Person", "@id": PERSON, name: "Atishay Kasliwal", url: SITE, sameAs: profileLinks },
        {
          "@type": "ImageGallery",
          "@id": page.url,
          url: page.url,
          name: page.title,
          description: page.description,
          dateModified: page.lastModified,
          creator: { "@id": PERSON },
          hasPart: images.map(image => ({ "@id": image["@id"] })),
        },
      ] : []),
      ...images,
    ],
  };
}

// Initial HTML contains the same unique photos that the homepage carousel enhances.
export function renderPhotographySeo(html, photographs, page) {
  if (!html.includes("<!-- photography:metadata -->")) return html;
  const standalone = html.includes("data-photography-page");
  const cards = photographs.map((photo, index) => `
    <button class="project-card photograph" data-index="${index}" data-position="${index}" tabindex="-1"
      aria-label="${escape(photo.name)}. Open photograph preview.">
      <span class="project-art">${photo.card}</span>
    </button>`).join("");
  const json = JSON.stringify(photographySchema(photographs, page, standalone)).replace(/</g, "\\u003c");
  return html.replace("<!-- photography:cards -->", cards)
    .replace("<!-- photography:metadata -->", `<script id="photography-schema" type="application/ld+json">${json}</script>`);
}
