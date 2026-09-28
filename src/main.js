import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { projects } from "./projects.js";
import { photographs } from "./photography.js";
import { experience } from "./experience.js";
import { startIntro } from "./intro.js";
import { createProjectPreview } from "./project-preview.js";
import { setupInfoSheet } from "./info-sheet.js";
import { setupScrollStory } from "./scroll-story.js";
import { createProjectCarousel } from "./project-carousel.js";
import { setupSectionAccordion } from "./section-accordion.js";

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
