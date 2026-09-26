// A violet pill that follows the pointer over project cards, with "Name — Year —" scrolling inside,
// after Elliott Mangham's portfolio. Mouse and pen only; touch has no hover to follow.
export function setupCursorMarquee(track, projects, { isBusy = () => false } = {}) {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const pill = document.createElement("div");
  pill.className = "cursor-marquee";
  pill.setAttribute("aria-hidden", "true");
  pill.innerHTML = '<div class="cursor-marquee__track"><span></span><span></span></div>';
  document.body.append(pill);
  const labels = pill.querySelectorAll("span");

  let index = -1;
  let target = { x: 0, y: 0 };
  let position = { x: 0, y: 0 };
  let frame = 0;

  function follow() {
    // Ease toward the pointer so the pill trails it slightly.
    position.x += (target.x - position.x) * 0.22;
    position.y += (target.y - position.y) * 0.22;
    pill.style.translate = `${position.x}px ${position.y}px`;
    const settled = Math.abs(target.x - position.x) < 0.3 && Math.abs(target.y - position.y) < 0.3;
    frame = settled ? 0 : requestAnimationFrame(follow);
  }

  function show(card, event) {
    const next = Number(card.dataset.index);
    if (next !== index) {
      index = next;
      const { name, year } = projects[index];
      // Repeat short names so each half of the loop is wider than the pill.
      let text = `${name} — ${year} — `;
      while (text.length < 34) text += text;
      labels.forEach(label => { label.textContent = text; });
    }
    target = { x: event.clientX, y: event.clientY };
    if (!pill.classList.contains("is-visible")) {
      position = { ...target };
      pill.style.translate = `${position.x}px ${position.y}px`;
      pill.classList.add("is-visible");
    }
    if (!frame) frame = requestAnimationFrame(follow);
  }

  function hide() {
    pill.classList.remove("is-visible");
    index = -1;
  }

  track.addEventListener("pointermove", event => {
    if (!fine.matches || event.pointerType === "touch") return;
    const card = event.target.closest(".project-card");
    if (!card || isBusy()) hide();
    else show(card, event);
  });
  track.addEventListener("pointerleave", hide);
  addEventListener("scroll", hide, { passive: true });
  addEventListener("blur", hide);
}
