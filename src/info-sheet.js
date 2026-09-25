// Phone-only bottom sheet with Now, Stack, and Contact details.
export function setupInfoSheet() {
  const sheet = document.querySelector("#info-sheet");
  const handle = sheet.querySelector(".sheet-handle");
  const grabber = sheet.querySelector(".sheet-grabber");
  const email = sheet.querySelector("#sheet-email");
  const copyButton = sheet.querySelector("#copy-email");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let closeTimer;
  let copyTimer;
  let dragStart = null;
  let dragDistance = 0;
  let suppressClick = false;

  function open(focusTarget = grabber) {
    clearTimeout(closeTimer);
    sheet.style.transform = "";
    if (!sheet.open) sheet.showModal();
    focusTarget.focus({ preventScroll: true });
    requestAnimationFrame(() => sheet.classList.add("is-open"));
  }

  function close() {
    if (!sheet.open) return;
    sheet.classList.remove("is-open");
    sheet.style.transform = "";
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => sheet.close(), reducedMotion.matches ? 0 : 320);
  }

  document.querySelectorAll("[data-open-sheet]").forEach(button => {
    button.addEventListener("click", () =>
      open(button.dataset.openSheet === "contact" ? email : grabber),
    );
  });
  grabber.addEventListener("click", () => {
    if (!suppressClick) close();
  });
  // Escape animates the sheet closed instead of removing it instantly.
  sheet.addEventListener("cancel", event => {
    event.preventDefault();
    close();
  });
  // A tap on the backdrop lands on the dialog element itself.
  sheet.addEventListener("click", event => {
    const box = sheet.getBoundingClientRect();
    if (event.target === sheet && event.clientY < box.top) close();
  });
  // Close the sheet if the window grows past the phone layout.
  matchMedia("(max-width: 700px)").addEventListener("change", event => {
    if (!event.matches && sheet.open) {
      sheet.classList.remove("is-open");
      sheet.close();
    }
  });

  // Swipe down on the handle to dismiss.
  handle.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart = event.clientY;
    dragDistance = 0;
    suppressClick = false;
  });
  handle.addEventListener("pointermove", event => {
    if (dragStart === null) return;
    dragDistance = Math.max(0, event.clientY - dragStart);
    if (dragDistance > 6 && !handle.hasPointerCapture(event.pointerId)) {
      handle.setPointerCapture(event.pointerId);
      sheet.classList.add("is-dragging");
    }
    if (handle.hasPointerCapture(event.pointerId))
      sheet.style.transform = `translateY(${dragDistance}px)`;
  });
  function endDrag(event) {
    if (dragStart === null) return;
    dragStart = null;
    sheet.classList.remove("is-dragging");
    if (handle.hasPointerCapture(event.pointerId))
      handle.releasePointerCapture(event.pointerId);
    suppressClick = dragDistance > 6;
    if (dragDistance > 90) close();
    else sheet.style.transform = "";
  }
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  copyButton.addEventListener("click", async () => {
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email);
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Can't copy";
    }
    copyTimer = setTimeout(() => (copyButton.textContent = "Copy"), 1600);
  });
}
