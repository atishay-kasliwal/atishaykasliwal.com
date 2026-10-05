let api;
export function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (api) return api;
  api = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const previous = window.onYouTubeIframeAPIReady;
    const timer = setTimeout(() => { api = null; reject(new Error('YouTube timed out')); }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      previous?.();
      resolve(window.YT);
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timer); script.remove(); api = null; reject(new Error('YouTube unavailable')); };
    document.head.append(script);
  });
  return api;
}
