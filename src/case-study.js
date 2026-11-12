import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./case-study.css";

// The stage shows the product. Where a project has a recording it plays on arrival, muted and
// looping, unless the visitor prefers reduced motion; clicking the stage pauses or resumes it.
// The thumbnails switch between the recording and the stills.
const screen = document.getElementById("screen");
const image = document.getElementById("screen-img");
const video = document.getElementById("screen-video");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function hasVideo() {
  return Boolean(video) && !screen.hasAttribute("data-no-video");
}

function play() {
  if (!hasVideo()) return;
  if (!video.src) video.src = video.dataset.src;
  video.play().then(() => screen.classList.add("is-playing")).catch(() => {});
}

function stop() {
  if (!video) return;
  video.pause();
  screen.classList.remove("is-playing");
}

if (screen && video) {
  if (!reducedMotion.matches) play();
  screen.addEventListener("click", () => (video.paused ? play() : stop()));
  screen.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      video.paused ? play() : stop();
    }
  });
}

document.querySelectorAll(".thumb").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".thumb").forEach(other => other.setAttribute("aria-pressed", String(other === button)));
    stop();
    // Experience photos carry a responsive srcset; project screens have a single source.
    if (button.dataset.srcset) image.srcset = button.dataset.srcset;
    else image.removeAttribute("srcset");
    image.src = button.dataset.src;
    image.alt = button.dataset.alt;
    screen.toggleAttribute("data-no-video", !button.hasAttribute("data-video"));
    if (video) {
      screen.setAttribute("tabindex", hasVideo() ? "0" : "-1");
      screen.setAttribute("role", hasVideo() ? "button" : "presentation");
      if (hasVideo()) play();
    }
  });
});
