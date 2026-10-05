import { loadYouTube } from './music/youtube.js';
import collection from './music/collection.json';
import { dailySong, newYorkDate } from './music/selection.js';

export function setupDailyVibe() {
  const widget = document.querySelector('.daily-vibe');
  if (!widget) return;
  const find = selector => widget.querySelector(selector);
  const trigger = find('.vibe-trigger');
  const panel = find('.vibe-panel');
  const play = find('.vibe-play');
  const status = find('.vibe-status');
  const seek = find('.vibe-seek');
  const audio = find('audio');
  const playlist = find('.vibe-playlist');
  let player;
  let youtubePlaying = false;
  let generation = 0;
  const youtube = find('.vibe-youtube');
  let current;
  let loading = false;
  let requestId = 0;
  const time = seconds => {
    if (!Number.isFinite(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };
  function sync() {
    const playing = current?.song?.youtubeId ? youtubePlaying : !audio.paused && !audio.ended;
    widget.classList.toggle('is-playing', playing);
    play.setAttribute('aria-pressed', String(playing));
    play.setAttribute('aria-label', playing ? 'Pause song' : 'Play song');
    find('[data-vibe-icon]').textContent = playing ? 'Ⅱ' : '▶';
    find('[data-vibe-action]').textContent = loading ? 'Loading…' : playing ? 'Pause' : 'Play song';
    seek.disabled = !Number.isFinite(audio.duration) || audio.duration <= 0;
    seek.max = Number.isFinite(audio.duration) ? audio.duration : 0;
    seek.value = audio.currentTime;
    seek.setAttribute('aria-valuetext', `${time(audio.currentTime)} of ${time(audio.duration)}`);
    find('.vibe-elapsed').textContent = time(audio.currentTime);
    find('.vibe-duration').textContent = time(audio.duration);
  }
  function render(data) {
    generation++;
    player?.destroy();
    player = null;
    youtubePlaying = false;
    youtube.replaceChildren();
    youtube.hidden = true;
    find('.vibe-progress').hidden = !!data.song?.youtubeId;
    current = data;
    audio.pause();
    loading = false;
    audio.removeAttribute('src');
    if (data.song?.audioUrl) audio.src = data.song.audioUrl;
    audio.load();
    find('[data-vibe-day]').textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC', month: 'short', day: 'numeric',
    }).format(new Date(`${data.date}T12:00:00Z`));
    find('.vibe-song').textContent = data.song?.title || 'A new vibe soon';
    find('.vibe-artist').textContent = data.song
      ? `${data.song.artist} · ${String(data.position).padStart(2, '0')} / ${String(data.total).padStart(2, '0')}`
      : 'The daily collection is on its way.';
    find('.vibe-lyrics p').textContent = data.song?.lyric ? `“${data.song.lyric}”` : '';
    find('.vibe-lyrics').hidden = !data.song?.lyric;
    play.disabled = !(data.song?.audioUrl || data.song?.youtubeId);
    status.textContent = (data.song?.audioUrl || data.song?.youtubeId) ? 'Ready when you are' : data.song ? 'Audio coming soon' : 'Songs coming soon';
    playlist.hidden = !data.playlistUrl;
    playlist.removeAttribute('aria-disabled');
    playlist.removeAttribute('role');
    playlist.removeAttribute('title');
    if (data.playlistUrl) playlist.href = data.playlistUrl;
    else playlist.removeAttribute('href');
    sync();
  }
  async function refresh() {
    const id = ++requestId;
    try {
      const response = await fetch('/api/music/today', { cache: 'no-store' });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
      const data = await response.json();
      if (id !== requestId || data.date !== newYorkDate() || !Number.isInteger(data.total)) return;
      if (JSON.stringify(current) !== JSON.stringify(data)) render(data);
    } catch { /* Local builds use the same bundled collection. */ }
  }
  render(dailySong(collection));
  refresh();
  const checkDate = () => {
    if (current.date !== newYorkDate()) {
      render(dailySong(collection));
      refresh();
    }
  };
  setInterval(checkDate, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDate(); });
  const close = () => { if (player) player.pauseVideo(); panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); };
  find('.vibe-close').addEventListener('click', () => { close(); trigger.focus(); });
  trigger.addEventListener('click', () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (window.matchMedia('(max-width: 700px)').matches) find('.vibe-close').focus({ preventScroll: true });
  });
  play.addEventListener('click', async () => {
    if (current.song?.youtubeId) {
      if (player) {
        if (youtubePlaying) player.pauseVideo();
        else player.playVideo();
        return;
      }
      if (loading) return;
      const version = generation;
      loading = true;
      status.textContent = 'Loading YouTube…';
      youtube.hidden = false;
      sync();
      try {
        const YT = await loadYouTube();
        if (version !== generation || panel.hidden) { loading = false; sync(); return; }
        const mount = document.createElement('div');
        youtube.replaceChildren(mount);
        player = new YT.Player(mount, {
          width: '100%', height: '200', videoId: current.song.youtubeId,
          playerVars: { playsinline: 1, controls: 1, origin: location.origin },
          events: {
            onReady: event => {
              loading = false;
              status.textContent = 'Starting song…';
              if (!panel.hidden) event.target.playVideo();
              sync();
            },
            onStateChange: event => {
              youtubePlaying = event.data === YT.PlayerState.PLAYING;
              status.textContent = youtubePlaying ? 'Now playing' : event.data === YT.PlayerState.BUFFERING ? 'Buffering…' : 'Ready when you are';
              sync();
            },
            onAutoplayBlocked: () => { status.textContent = 'YouTube blocked playback. Try the playlist link.'; },
            onError: () => {
              loading = false;
              youtubePlaying = false;
              status.textContent = 'This video cannot play here. Try the playlist link.';
              player?.destroy(); player = null;
              sync();
            },
          },
        });
      } catch {
        loading = false;
        status.textContent = 'YouTube unavailable. Try again.';
        sync();
      }
      return;
    }
    if (!audio.paused) { audio.pause(); return; }
    if (loading) return;
    loading = true;
    status.textContent = 'Loading audio…';
    sync();
    try { await audio.play(); }
    catch { status.textContent = 'Unable to play this song. Try again.'; }
    finally { loading = false; sync(); }
  });
  audio.addEventListener('playing', () => { loading = false; status.textContent = 'Now playing'; sync(); });
  audio.addEventListener('pause', () => { if (current.song?.audioUrl) status.textContent = 'Paused'; sync(); });
  audio.addEventListener('waiting', () => { status.textContent = 'Buffering…'; });
  audio.addEventListener('ended', () => { status.textContent = 'Play it again'; sync(); });
  audio.addEventListener('error', () => { loading = false; status.textContent = 'Audio unavailable. Try again later.'; sync(); });
  for (const event of ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied']) audio.addEventListener(event, sync);
  seek.addEventListener('input', () => { if (!seek.disabled) audio.currentTime = Number(seek.value); });
  document.addEventListener('click', event => { if (!widget.contains(event.target)) close(); });
  widget.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { close(); trigger.focus(); }
  });
}
