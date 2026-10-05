export function newYorkDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, 'https://atishaykasliwal.com');
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function dailySong(collection, now = new Date()) {
  const date = newYorkDate(now);
  const songs = collection.songs.filter(song => song.id && song.title && song.artist);
  const start = Date.parse(`${collection.startDate}T00:00:00Z`);
  if (!Number.isFinite(start)) throw new Error('Invalid music rotation start date');
  const elapsed = Math.floor((Date.parse(`${date}T00:00:00Z`) - start) / 86400000);
  const index = songs.length ? ((elapsed % songs.length) + songs.length) % songs.length : -1;
  const song = songs[index];
  return {
    date, position: index + 1, total: songs.length,
    playlistUrl: safeUrl(song?.playlistUrl) || safeUrl(collection.playlistUrl),
    song: song ? {
      youtubeId: /^[A-Za-z0-9_-]{11}$/.test(song.youtubeId ?? '') ? song.youtubeId : '',
      id: song.id, title: song.title, artist: song.artist,
      lyric: typeof song.lyric === 'string' ? song.lyric : '',
      audioUrl: song.audioUrl?.startsWith('/') && !song.audioUrl.startsWith('//')
        ? song.audioUrl : safeUrl(song.audioUrl),
    } : null,
  };
}
