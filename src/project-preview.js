export function createProjectPreview(projects, viewport) {
  const preview = document.querySelector("#project-dialog");
  const art = document.querySelector("#dialog-art");
  const title = document.querySelector("#dialog-title");
  const closeButton = preview.querySelector("[data-close-project]");
  const openLink = preview.querySelector("#dialog-open");
  const openLabel = preview.querySelector("#dialog-open-label");
  const stack = preview.querySelector("#dialog-stack");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let index = -1;
  let pinned = false;
  let closeTimer;
  let openingFrame;
  let returnFocus;

  function position() {
    const strip = viewport.getBoundingClientRect();
    const landscape = innerHeight < 460 && innerWidth >= 500;
    const top = landscape ? 12 : innerWidth > 700 ? 76 : 72;
    const bottom = landscape ? innerHeight - 12 : strip.top - 12;
    const availableHeight = Math.max(120, bottom - top);
    const width = Math.min(innerWidth - 28, innerWidth > 700 ? 1012 : 560, (availableHeight - 36) * 270 / 166 + 12);
    const height = (width - 12) * 166 / 270 + 36;
    preview.style.width = `${width}px`;
    preview.style.top = `${top + Math.max(0, (availableHeight - height) / 2)}px`;
  }

  function render(nextIndex) {
    if (index === nextIndex) return;
    index = nextIndex;
    const project = projects[index];
    title.textContent = project.name;
    art.className = `preview-canvas ${project.theme}`;
    // Live sites play a scroll recording; reduced-motion visitors keep the still screenshot.
    const media = project.video && !reducedMotion.matches
      ? `<video src="${project.video}" poster="${project.poster}" autoplay muted loop playsinline aria-hidden="true"></video>`
      : project.art;
    art.innerHTML = `<div class="project-art">${media}</div>`;
    art.setAttribute("aria-label", `${project.name}. ${project.category}. ${project.description}`);
    stack.textContent = project.stack ?? "";
    // The link only appears for projects that have somewhere to go.
    openLink.hidden = !project.url;
    if (project.url) {
      const isCode = new URL(project.url).hostname === "github.com";
      openLink.href = project.url;
      openLabel.textContent = isCode ? "View code" : "Open site";
      openLink.setAttribute(
        "aria-label",
        isCode ? `View ${project.name} code on GitHub (opens in a new tab)` : `Open ${project.name} (opens in a new tab)`,
      );
    } else {
      openLink.removeAttribute("href");
    }
    document.querySelectorAll(".project-card").forEach(card => {
      card.classList.toggle("is-previewed", Number(card.dataset.index) === index);
    });
  }

  function show(nextIndex, pin = false, trigger = null) {
    if (pinned && !pin) return;
    clearTimeout(closeTimer);
    cancelAnimationFrame(openingFrame);
    pinned = pin;
    if (pin && trigger) returnFocus = trigger;
    render(nextIndex);
    position();
    preview.dataset.mode = pin ? "pinned" : "hover";
    if (pin) preview.removeAttribute("aria-hidden");
    else preview.setAttribute("aria-hidden", "true");
    closeButton.tabIndex = pin ? 0 : -1;
    openLink.tabIndex = pin ? 0 : -1;
    // A non-modal preview preserves the surrounding page and the carousel.
    preview.open = true;
    openingFrame = requestAnimationFrame(() => preview.classList.add("is-visible"));
    if (pin && trigger && trigger.matches(":focus-visible")) closeButton.focus({ preventScroll: true });
  }

  function close({ immediate = false, restoreFocus = false } = {}) {
    clearTimeout(closeTimer);
    cancelAnimationFrame(openingFrame);
    pinned = false;
    preview.classList.remove("is-visible");
    document.querySelectorAll(".is-previewed").forEach(card => card.classList.remove("is-previewed"));
    index = -1;
    const finish = () => {
      preview.open = false;
      // Stop any recording from playing and downloading while the preview is closed.
      art.replaceChildren();
      if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    };
    if (immediate || reducedMotion.matches) finish();
    else closeTimer = setTimeout(finish, 180);
  }

  closeButton.addEventListener("click", () => close({ restoreFocus: true }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && preview.open) {
      event.preventDefault();
      close({ restoreFocus: pinned });
    }
  });
  document.addEventListener("pointerdown", event => {
    if (pinned && !preview.contains(event.target) && !event.target.closest(".work")) close();
  });
  new ResizeObserver(position).observe(viewport);
  return {
    open: (nextIndex, trigger) => show(nextIndex, true, trigger),
    hover: nextIndex => show(nextIndex),
    leave: () => { if (!pinned) close(); },
    close,
  };
}
