// Carousel card markup, shared by the browser (src/project-carousel.js) and the build
// (vite.config.js prerenders the work and experience tracks into index.html), so the
// static HTML and the hydrated carousel are identical.
//
// Cards with a `caseStudy` are real links to that page: crawlers and no-JS visitors can
// follow them, and modifier or middle clicks open the page. A plain click or Enter still
// opens the preview window (project-carousel.js cancels the navigation). Cards without a
// page, such as photographs, stay buttons.

const pad = value => String(value).padStart(2, "0");

// The first card of the middle copy is the active card on load and the page's LCP
// image, so it is fetched eagerly at high priority. Every other card loads lazily as
// the carousel brings it near the viewport.
function withImageLoading(markup, eager) {
  return markup.replace(/<img (?![^>]*\b(?:loading|fetchpriority)=)/g, eager ? '<img fetchpriority="high" ' : '<img loading="lazy" ');
}

export function renderCarouselTrack(items, { photoOnly = false, eagerFirst = false } = {}) {
  const count = items.length;
  // Three copies allow a continuous loop. Only the middle copy is exposed to assistive technology.
  return Array.from({ length: 3 }, (_, copy) =>
    items
      .map((item, index) => {
        const hidden = copy !== 1;
        const tag = `${pad(index + 1)} / ${item.tag}`;
        const label = photoOnly
          ? `${item.name}. Open photograph preview.`
          : `${item.name}, ${tag}. ${item.category}. Open project preview.`;
        const art = withImageLoading(item.card ?? item.art, eagerFirst && copy === 1 && index === 0);
        const element = item.caseStudy && !photoOnly ? "a" : "button";
        const link = element === "a" ? ` href="${item.caseStudy}" draggable="false"` : "";
        return `
    <${element} class="project-card ${item.theme}"${link} data-index="${index}" data-position="${copy * count + index}"
      tabindex="-1" ${hidden ? 'aria-hidden="true"' : ""}
      aria-label="${label}">
      <span class="project-art">${art}</span>
      ${photoOnly ? "" : `<span class="card-title">${item.name}</span>
      <span class="card-tag">${tag}</span>`}
    </${element}>`;
      })
      .join(""),
  ).join("");
}
