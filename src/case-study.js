import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./case-study.css";

// The screen shows the carousel card image; hovering (or tapping) plays the scroll recording, as on
// the homepage. The thumbnails swap what the screen shows. The video only downloads on first play.
const screen = document.getElementById("screen");
const image = document.getElementById("screen-img");
const video = document.getElementById("screen-video");
const hint = screen?.querySelector(".hint");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const canHover = matchMedia("(hover: hover)").matches;

if (hint && !canHover) hint.textContent = "Tap to play";

function hasVideo() {
  return Boolean(video) && !screen.hasAttribute("data-no-video");
}

function play() {
  if (!hasVideo() || reducedMotion.matches) return;
  if (!video.src) video.src = video.dataset.src;
  video.currentTime = 0;
  video.play().catch(() => {});
  screen.classList.add("is-playing");
}

function stop() {
  if (!video) return;
  video.pause();
  screen.classList.remove("is-playing");
}

function toggle() {
  if (screen.classList.contains("is-playing")) stop();
  else play();
}

if (screen && video) {
  screen.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") play();
  });
  screen.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse") stop();
  });
  screen.addEventListener("click", event => {
    if (event.pointerType !== "mouse") toggle();
  });
  screen.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });
}

document.querySelectorAll(".thumb").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".thumb").forEach(other => other.setAttribute("aria-pressed", String(other === button)));
    stop();
    image.src = button.dataset.src;
    image.alt = button.dataset.alt;
    screen.toggleAttribute("data-no-video", !button.hasAttribute("data-video"));
    if (video) {
      screen.setAttribute("tabindex", hasVideo() ? "0" : "-1");
      screen.setAttribute("role", hasVideo() ? "button" : "presentation");
    }
  });
});
