import collection from '../../../src/music/collection.json' with { type: 'json' };
import { dailySong } from '../../../src/music/selection.js';

export function onRequestGet() {
  return Response.json(dailySong(collection), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
