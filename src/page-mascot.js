export function setupPageMascot() {
  const button = document.querySelector('.page-mascot');
  if (!button) return;
  const sprite = button.querySelector('.page-mascot-sprite');
  const desktop = matchMedia('(min-width: 701px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let reactionsLoaded = false;
  const preloadReactions = () => {
    if (!desktop.matches || reactionsLoaded) return;
    const image = new Image();
    image.src = '/mascots/atishay-reactions.webp';
    reactionsLoaded = true;
  };
  let timer;
  let reacting = false;
  let reaction = 0;
  const frame = index => {
    sprite.style.backgroundPosition = `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`;
  };
  const reset = () => {
    clearTimeout(timer);
    reacting = false;
    sprite.classList.remove('is-reacting');
    frame(4);
  };
  document.addEventListener('pointermove', event => {
    if (!desktop.matches || reduced.matches || reacting || event.pointerType === 'touch') return;
    const rect = button.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const column = Math.abs(dx) < 60 ? 1 : dx < 0 ? 0 : 2;
    const row = Math.abs(dy) < 60 ? 1 : dy < 0 ? 0 : 2;
    frame(row * 3 + column);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { if (!reacting) frame(4); });
  button.addEventListener('click', () => {
    clearTimeout(timer);
    reacting = true;
    sprite.classList.add('is-reacting');
    frame([8, 1, 2, 5, 3, 4, 0, 7, 6][reaction++ % 9]);
    timer = setTimeout(reset, 1400);
  });
  desktop.addEventListener('change', () => { reset(); preloadReactions(); });
  reduced.addEventListener('change', reset);
  preloadReactions();
  frame(4);
}
