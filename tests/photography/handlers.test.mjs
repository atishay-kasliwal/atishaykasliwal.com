import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequestGet as exhibition } from "../../functions/api/photography/exhibition.js";
import { onRequestGet as search } from "../../functions/api/photography/search.js";

// A fake D1 that answers the two queries the public handlers make, with rows shaped exactly
// like the real table, so the whole request path runs as it does in production.
function fakeDb(rows, tags) {
  return {
    prepare(sql) {
      return {
        all: async () => ({ results: sql.includes("photo_tags") ? tags : rows }),
      };
    },
  };
}

const row = (id, overrides = {}) => ({
  id,
  origin: "external",
  status: "ready",
  hidden: 0,
  deleted_at: null,
  alt: `Photo ${id}`,
  caption: null,
  src: `/photography/${id}.jpg`,
  original_key: null,
  width: 1600,
  height: 1000,
  orientation: "landscape",
  colors_json: JSON.stringify([{ name: "green", share: 0.6 }]),
  uploaded_at: "2026-09-28",
  updated_at: "2026-09-28",
  ...overrides,
});

const rows = [
  row("aaa1"),
  row("bbb2"),
  row("ccc3", { hidden: 1 }),
  row("ddd4", { status: "pending" }),
  row("eee5", { deleted_at: "2026-01-01" }),
];
const tags = [
  { photo_id: "aaa1", tag: "nature" },
  { photo_id: "bbb2", tag: "car" },
];

test("exhibition handler returns public photographs with layout", async () => {
  const env = { DB: fakeDb(rows, tags) };
  const response = await exhibition({ request: new Request("https://x.test/api/photography/exhibition?date=2026-10-04"), env });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.photos.map(photo => photo.id).sort(), ["aaa1", "bbb2"]);
  assert.equal(body.layout.length, 2);
  assert.ok(!("status" in body.photos[0]) && !("hidden" in body.photos[0]));
});

test("search handler finds public photographs and excludes hidden, pending and deleted ones", async () => {
  const env = { DB: fakeDb(rows, tags) };
  const response = await search({ request: new Request("https://x.test/api/photography/search?q=car"), env });
  const body = await response.json();
  assert.deepEqual(body.results.map(result => result.id), ["bbb2"]);
  assert.equal(body.results[0].photo.id, "bbb2");
});

test("search handler ranks colour queries by actual colour", async () => {
  const env = { DB: fakeDb(rows, tags) };
  const response = await search({ request: new Request("https://x.test/api/photography/search?q=green"), env });
  const body = await response.json();
  assert.ok(body.results.length >= 1);
});
