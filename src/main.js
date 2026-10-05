import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { projects } from "./projects.js";
import { photographs, photoMarkup } from "./photography.js";
import { experience } from "./experience.js";
import { startIntro } from "./intro.js";
import { createProjectPreview } from "./project-preview.js";
import { setupInfoSheet } from "./info-sheet.js";
import { setupScrollStory } from "./scroll-story.js";
import { createProjectCarousel } from "./project-carousel.js";
import { setupSectionAccordion } from "./section-accordion.js";
import { setupDailyVibe } from "./daily-vibe.js";

setupDailyVibe();

const projectPreview = createProjectPreview(projects, document.querySelector("#carousel-viewport"));
const carousels = [...document.querySelectorAll(".work")].map(work =>
  createProjectCarousel(work, {
    projects: work.classList.contains("photography")
      ? photographs
      : work.classList.contains("experience")
        ? experience
        : projects,
    projectPreview,
    photoOnly: work.classList.contains("photography"),
  }),
);
async function loadPhotographyLibrary() {
  try {
    const response = await fetch('/api/photography/exhibition?all=1');
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
    const body = await response.json();
    if (body.collection !== 'all' || !Array.isArray(body.photos)) return;
    const library = body.photos.filter(photo => {
      const url = new URL(photo.src, location.origin);
      return ['http:', 'https:'].includes(url.protocol) && photo.width > 0 && photo.height > 0;
    }).map((photo, index) => ({
      ...photo, kind: 'photo', theme: 'photograph',
      name: `Photograph ${String(index + 1).padStart(2, '0')}`,
      card: photoMarkup(photo),
      art: photoMarkup(photo, { lazy: false, sizes: '(max-width: 700px) calc(100vw - 20px), 736px', preview: true }),
    }));
    const index = [...document.querySelectorAll('.work')].findIndex(work => work.classList.contains('photography'));
    carousels[index]?.setPhotos(library);
  } catch { /* Keep the initial photos available when the library cannot be reached. */ }
}
loadPhotographyLibrary();
setupSectionAccordion({
  onChange() {
    projectPreview.close({ immediate: true });
    carousels.forEach(carousel => carousel.refresh());
  },
});
setupScrollStory({
  onScroll: delta => carousels.forEach(carousel => carousel.onScroll(delta)),
});

// Shows the time where Atishay is, not the visitor's local time.
const time = document.querySelector("#local-time");
const newYorkTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
function updateTime() {
  const now = new Date();
  time.dateTime = now.toISOString();
  time.textContent = newYorkTime.format(now);
}
updateTime();
setInterval(updateTime, 10000);
setupInfoSheet();
startIntro();
