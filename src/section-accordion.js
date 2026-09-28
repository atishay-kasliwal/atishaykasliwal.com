// Start with Projects open unless a section link is supplied. Only one panel opens at a time.
export function setupSectionAccordion({ onChange } = {}) {
  const toggles = [...document.querySelectorAll("[data-section-toggle]")];
  const workToggle = document.querySelector("#work-toggle");
  let reopenTimer;

  const allClosed = () => toggles.every(toggle => toggle.getAttribute("aria-expanded") === "false");

  function setExpanded(toggle, expanded) {
    const id = toggle.getAttribute("aria-controls");
    const panel = document.getElementById(id);
    if (!expanded && panel.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
    toggle.setAttribute("aria-expanded", String(expanded));
    panel.hidden = !expanded;
    toggle.closest("section").classList.toggle("is-collapsed", !expanded);
    document.querySelectorAll(`[data-section-extra="${id}"]`).forEach(extra => {
      extra.hidden = !expanded;
    });
  }

  toggles.forEach(toggle => {
    setExpanded(toggle, toggle.getAttribute("aria-expanded") === "true");
    toggle.addEventListener("click", event => {
      // A normal click keeps the accordion; native modified clicks open the real page.
      if (toggle.tagName === "A") {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
      }
      clearTimeout(reopenTimer);
      const expanded = toggle.getAttribute("aria-expanded") !== "true";
      if (expanded) {
        toggles.filter(other => other !== toggle).forEach(other => setExpanded(other, false));
      }
      setExpanded(toggle, expanded);
      onChange?.();
      if (allClosed()) {
        reopenTimer = setTimeout(() => {
          if (!allClosed()) return;
          setExpanded(workToggle, true);
          onChange?.();
        }, 5000);
      }
    });
    if (toggle.tagName === "A") toggle.addEventListener("keydown", event => {
      if (event.key !== " ") return;
      event.preventDefault();
      toggle.click();
    });
  });

  function openLinkedSection() {
    const toggle = toggles.find(item => `#${item.closest("section").id}` === window.location.hash);
    if (!toggle) return;
    clearTimeout(reopenTimer);
    toggles.forEach(item => setExpanded(item, item === toggle));
    onChange?.();
  }

  openLinkedSection();
  window.addEventListener("hashchange", openLinkedSection);
}
