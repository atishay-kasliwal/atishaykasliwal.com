import test from 'node:test';
import assert from 'node:assert/strict';
import { dailySong, newYorkDate, safeUrl } from '../../src/music/selection.js';
const collection = {
  startDate: '2026-10-05', playlistUrl: 'https://example.com/playlist',
  songs: Array.from({ length: 31 }, (_, i) => ({ id: `song-${i}`, title: `Song ${i}`, artist: 'Artist', lyric: 'An original line', audioUrl: '/music/song.mp3' })),
};
test('rotates continuously through all 31 songs and wraps', () => {
  assert.equal(dailySong(collection, new Date('2026-10-05T16:00Z')).position, 1);
  assert.equal(dailySong(collection, new Date('2026-11-04T16:00Z')).position, 31);
  assert.equal(dailySong(collection, new Date('2026-11-05T16:00Z')).position, 1);
});
test('changes at New York midnight including daylight saving transition', () => {
  assert.equal(newYorkDate(new Date('2026-10-06T03:59:59Z')), '2026-10-05');
  assert.equal(newYorkDate(new Date('2026-10-06T04:00:00Z')), '2026-10-06');
  assert.equal(newYorkDate(new Date('2026-11-02T04:59:59Z')), '2026-11-01');
  assert.equal(newYorkDate(new Date('2026-11-02T05:00:00Z')), '2026-11-02');
});
test('empty collection is explicit and invalid songs are excluded', () => {
  assert.equal(dailySong({ ...collection, songs: [] }).song, null);
  assert.equal(dailySong({ ...collection, songs: [{}] }).total, 0);
  assert.throws(() => dailySong({ ...collection, startDate: 'bad' }));
});
test('blocks executable URLs and preserves local audio paths', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:audio/mp3;base64,test'), '');
  assert.equal(dailySong(collection).song.audioUrl, '/music/song.mp3');
});
test('accepts only valid YouTube video IDs', () => {
  const song = { id: 'cover', title: 'Creep', artist: 'Avie Sheck', youtubeId: 'nZoHuoFQyrI' };
  assert.equal(dailySong({ ...collection, songs: [song] }).song.youtubeId, 'nZoHuoFQyrI');
  assert.equal(dailySong({ ...collection, songs: [{ ...song, youtubeId: '<script>' }] }).song.youtubeId, '');
});
test('configured songs select Creep today and Kabira tomorrow with its radio mix', async () => {
  const { default: configured } = await import('../../src/music/collection.json', { with: { type: 'json' } });
  assert.equal(dailySong(configured, new Date('2026-10-05T16:00:00Z')).song.audioUrl, '/music/creep-avie-sheck.mp3');
  const tomorrow = dailySong(configured, new Date('2026-10-06T04:00:00Z'));
  assert.equal(tomorrow.song.audioUrl, '/music/kabira.m4a');
  assert.ok(tomorrow.playlistUrl.includes('RDjHNNMj5bNQw'));
});
test('production rotation repeats the four audio files every four days', async () => {
  const { default: configured } = await import('../../src/music/collection.json', { with: { type: 'json' } });
  assert.equal(configured.songs.length, 4);
  for (const [date, id] of [['2026-10-05','creep-avie-sheck'],['2026-10-06','kabira'],['2026-10-07','hush'],['2026-10-08','wat-wat-wat'],['2026-10-09','creep-avie-sheck']]) {
    const result = dailySong(configured, new Date(date + 'T16:00:00Z'));
    assert.equal(result.song.id, id);
    assert.ok(result.song.audioUrl.startsWith('/music/'));
  }
});
