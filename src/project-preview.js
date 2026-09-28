export function createProjectPreview(projects, viewport, { centered = false } = {}) {
  const preview = document.querySelector("#project-dialog");
  const art = document.querySelector("#dialog-art");
  const title = document.querySelector("#dialog-title");
  const projectIndex = document.querySelector("#dialog-index");
  const category = document.querySelector("#dialog-category");
  const description = document.querySelector("#dialog-description");
  const year = document.querySelector("#dialog-year");
  const closeButton = preview.querySelector("[data-close-project]");
  const openLink = preview.querySelector("#dialog-open");
  const openLabel = preview.querySelector("#dialog-open-label");
  const caseLink = preview.querySelector("#dialog-case");
  const caseLabel = preview.querySelector("#dialog-case-label");
  const stack = preview.querySelector("#dialog-stack");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let index = -1;
  let collection = projects;
  let pinned = false;
  let closeTimer;
  let openingFrame;
  let returnFocus;

  function position() {
    const strip = viewport.getBoundingClientRect();
    const landscape = innerHeight < 460 && innerWidth >= 500;
    const phone = innerWidth <= 700 && !landscape;
    const top = landscape ? 12 : innerWidth > 700 ? 72 : 62;
    const bottom = centered || landscape ? innerHeight - 12 : strip.top - 12;
    const availableHeight = Math.max(120, bottom - top);
    const photo = collection[index]?.kind === "photo";
    // Every photograph uses the same frame; CSS crops the image to fill it.
    const aspectRatio = photo ? 16 / 9 : 270 / 166;
    const sidebar = photo || phone ? 0 : landscape ? 220 : innerWidth > 900 ? 300 : 250;
    // Phone: the video is the main focus, so the info strip stays as thin as it can.
    const mobileInfo = !photo && phone ? innerHeight < 620 ? 64 : 72 : 0;
    const width = photo ? Math.min(
      innerWidth - (phone ? 20 : 32),
      736,
      availableHeight * aspectRatio,
    ) : Math.min(
      innerWidth - (phone ? 20 : 32),
      phone ? 560 : 1180,
      Math.max(280, sidebar + (availableHeight - mobileInfo) * 270 / 166),
    );
    const height = phone
      ? width / aspectRatio + mobileInfo
      : (width - sidebar) / aspectRatio;
    preview.style.setProperty("--preview-sidebar", `${sidebar}px`);
    preview.style.setProperty("--preview-info-height", `${mobileInfo}px`);
    preview.style.width = `${width}px`;
    preview.style.height = `${height}px`;
    preview.style.top = `${top + Math.max(0, (availableHeight - height) / 2)}px`;
  }

  function render(nextIndex, nextCollection) {
    if (index === nextIndex && collection === nextCollection) return;
    index = nextIndex;
    collection = nextCollection;
    const project = collection[index];
    preview.classList.toggle("is-photo-only", project.kind === "photo");
    projectIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(collection.length).padStart(2, "0")}`;
    category.textContent = project.category ?? "";
    title.textContent = project.name;
    description.textContent = project.description ?? "";
    year.textContent = project.year ?? "—";
    art.className = `preview-canvas ${project.theme}`;
    // Live sites play a scroll recording; reduced-motion visitors keep the still screenshot.
    const media = project.video && !reducedMotion.matches
      ? `<video src="${project.video}" poster="${project.poster}" autoplay muted loop playsinline aria-hidden="true"></video>`
      : project.art;
    art.innerHTML = `<div class="project-art">${media}</div>`;
    art.setAttribute("aria-label", project.alt ?? `${project.name}. ${project.category}. ${project.description}`);
    stack.textContent = project.stack ?? "";
    // Projects with a written case study link to it from the title bar.
    caseLink.hidden = !project.caseStudy;
    if (project.caseStudy) {
      caseLink.href = project.caseStudy;
      caseLabel.textContent = project.caseStudyLabel ?? "Read case study";
      caseLink.setAttribute("aria-label", `${caseLabel.textContent}: ${project.name}`);
    } else {
      caseLink.removeAttribute("href");
    }
    // The link only appears for projects that have somewhere to go.
    openLink.hidden = !project.url;
    if (project.url) {
      const isCode = new URL(project.url).hostname === "github.com";
      openLink.href = project.url;
      openLabel.textContent = project.actionLabel ?? (isCode ? "View code" : "Open site");
      openLink.setAttribute(
        "aria-label",
        project.actionLabel
          ? `${project.actionLabel}: ${project.name} (opens in a new tab)`
          : isCode
            ? `View ${project.name} code on GitHub (opens in a new tab)`
            : `Open ${project.name} (opens in a new tab)`,
      );
    } else {
      openLink.removeAttribute("href");
    }
    viewport.querySelectorAll(".project-card").forEach(card => {
      card.classList.toggle("is-previewed", Number(card.dataset.index) === index);
    });
  }

  function show(nextIndex, pin = false, trigger = null, sourceViewport = viewport, items = projects) {
    if (pinned && !pin) return;
    viewport = sourceViewport;
    clearTimeout(closeTimer);
    cancelAnimationFrame(openingFrame);
    pinned = pin;
    if (pin && trigger) returnFocus = trigger;
    render(nextIndex, items);
    position();
    preview.dataset.mode = pin ? "pinned" : "hover";
    if (pin) preview.removeAttribute("aria-hidden");
    else preview.setAttribute("aria-hidden", "true");
    closeButton.tabIndex = pin ? 0 : -1;
    openLink.tabIndex = pin ? 0 : -1;
    caseLink.tabIndex = pin ? 0 : -1;
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
  const resizeObserver = new ResizeObserver(position);
  document.querySelectorAll(".carousel-viewport").forEach(strip => resizeObserver.observe(strip));
  if (centered) resizeObserver.observe(viewport);
  return {
    open: (nextIndex, trigger, sourceViewport, items) => show(nextIndex, true, trigger, sourceViewport, items),
    hover: (nextIndex, sourceViewport, items) => show(nextIndex, false, null, sourceViewport, items),
    leave: () => { if (!pinned) close(); },
    close,
  };
}
