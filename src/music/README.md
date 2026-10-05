# Daily music

The current rotation is Creep, Kabira, Hush, and Wat Wat Wat. Edit `collection.json` to add more songs in rotation order. The rotation starts on `startDate` and advances at midnight in America/New_York, repeating after the last song. Fewer songs also work.

Each entry in `songs` has this shape:

```json
{
  "id": "unique-song-id",
  "title": "Song title",
  "artist": "Artist name",
  "lyric": "Your chosen excerpt\nAn optional second line",
  "audioUrl": "/music/unique-song-id.mp3"
}
```

Put audio files in `public/music/` or provide a direct HTTPS audio URL. Use sources you have permission to stream. Remote audio must permit browser playback and should support byte range requests for seeking. An ordinary Spotify or YouTube page URL is not an audio source.

Set `playlistUrl` to the playlist page. An empty URL hides the link. Empty audio URLs disable playback while still displaying the song and quote. No songs shows the empty state.

Cloudflare Pages serves `/api/music/today`; Vite development and preview use the same bundled collection as fallback. Rebuild after changing the collection. No database binding or secrets are needed. Deploy through the site's existing Pages workflow. Audio only loads after the visitor presses Play. Closing the panel keeps playback running; reopen it to pause.

Verify rotation with `node --test tests/music/` and build with `npm run build`.

YouTube entries use `youtubeId` (the 11-character video ID) instead of `audioUrl`. The official player loads when Play is pressed, stays visible, and pauses when the panel closes. Embedding restrictions and browser playback policies may require pressing Play in the video itself. Lyrics are optional and never fetched automatically. The four audio songs repeat every four days.
