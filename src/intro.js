// A short welcome sequence, not an artificial download progress indicator.
// Edit the text, language tags, and durations here to personalize the intro.
export const greetings = [
  { text: "Hello", lang: "en", duration: 650 },
  { text: "Bonjour", lang: "fr", duration: 190 },
  { text: "Hola", lang: "es", duration: 190 },
  { text: "Ciao", lang: "it", duration: 190 },
  { text: "नमस्ते", lang: "hi", duration: 230 },
  { text: "こんにちは", lang: "ja", duration: 230 },
  { text: "مرحبًا", lang: "ar", duration: 230 },
  { text: "Hallo", lang: "nl", duration: 400 },
];

export function startIntro() {
  const loader = document.querySelector("#intro-loader");
  const portfolio = document.querySelector(".portfolio");
  const word = document.querySelector("#greeting-word");
  const skip = document.querySelector("#skip-intro");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer;
  let exitTimer;
  let leaving = false;

  if (!loader) return;

  function cleanup() {
    clearTimeout(timer);
    clearTimeout(exitTimer);
    clearTimeout(window.portfolioIntroFallback);
    const hadFocus = loader.contains(document.activeElement);
    loader.remove();
    portfolio.inert = false;
    document.documentElement.classList.remove("has-intro");
    document.removeEventListener("keydown", onKeydown);
    motion.removeEventListener("change", onMotionChange);
    if (hadFocus) {
      portfolio.tabIndex = -1;
      portfolio.focus({ preventScroll: true });
      portfolio.removeAttribute("tabindex");
    }
  }

  function reveal(immediate = false) {
    if (immediate) {
      cleanup();
      return;
    }
    if (leaving) return;
    leaving = true;
    clearTimeout(timer);
    loader.classList.add("is-leaving");
    document.documentElement.classList.remove("has-intro");
    exitTimer = setTimeout(cleanup, 820);
  }

  function onKeydown(event) {
    if (event.key === "Escape") reveal();
  }

  function onMotionChange(event) {
    if (event.matches) reveal(true);
  }

  function showGreeting(index) {
    if (index === greetings.length) {
      reveal();
      return;
    }
    const greeting = greetings[index];
    word.textContent = greeting.text;
    word.lang = greeting.lang;
    timer = setTimeout(() => showGreeting(index + 1), greeting.duration);
  }

  if (motion.matches) {
    cleanup();
    return;
  }

  portfolio.inert = true;
  skip.addEventListener("click", () => reveal());
  document.addEventListener("keydown", onKeydown);
  motion.addEventListener("change", onMotionChange);
  showGreeting(0);
}
