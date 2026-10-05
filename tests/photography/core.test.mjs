import { test } from "node:test";
import assert from "node:assert/strict";
import { dailySelection } from "../../src/photography-core/selection.js";
import { layoutFor, layoutForSelection } from "../../src/photography-core/layout.js";
import { rankPhotos, parseQuery } from "../../src/photography-core/search.js";
import { classifyPixel, colorShares } from "../../src/photography-core/colors.js";
import { isPublic, publicPhotos, publicView } from "../../src/photography-core/library.js";
import { validateIngestBatch, applyIngest, normalizeTags } from "../../src/photography-core/ingest.js";
import { DEFAULT_VOCABULARY } from "../../src/photography-core/vocabulary.js";

const colourNames = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray", "black", "white"];

function photo(id, overrides = {}) {
  return {
    id,
    status: "ready",
    hidden: false,
    deletedAt: null,
    origin: "r2",
    src: `/p/${id}.jpg`,
    alt: `Photo ${id}`,
    caption: "",
    width: 1600,
    height: 1000,
    orientation: "landscape",
    colors: [{ name: colourNames[Number(id.replace(/\D/g, "")) % colourNames.length], share: 0.5 }],
    tags: [],
    ...overrides,
  };
}

function library(count) {
  return Array.from({ length: count }, (_, index) =>
    photo(`p${String(index).padStart(3, "0")}`, {
      orientation: index % 3 === 0 ? "portrait" : "landscape",
      tags: [["car", "city", "night", "nature", "sky"][index % 5]],
    }),
  );
}

test("daily selection is stable for the same date", () => {
  const photos = library(120);
  const first = dailySelection(photos, "2026-10-04").map(item => item.id);
  const second = dailySelection(photos, "2026-10-04").map(item => item.id);
  assert.deepEqual(first, second);
});

test("daily selection size stays between 20 and 30 when the library is large", () => {
  const photos = library(200);
  for (const date of ["2026-10-04", "2026-10-05", "2026-10-06", "2026-11-01", "2027-01-15"]) {
    const size = dailySelection(photos, date).length;
    assert.ok(size >= 20 && size <= 30, `${date} produced ${size}`);
  }
});

test("different dates produce different exhibitions", () => {
  const photos = library(200);
  const days = ["2026-10-04", "2026-10-05", "2026-10-06"].map(date => dailySelection(photos, date).map(item => item.id).join(","));
  assert.equal(new Set(days).size, 3);
});

test("selection excludes hidden, deleted and not-ready photos", () => {
  const photos = [
    ...library(40),
    photo("hidden", { hidden: true }),
    photo("deleted", { deletedAt: "2026-01-01" }),
    photo("pending", { status: "pending" }),
  ];
  const ids = dailySelection(photos, "2026-10-04").map(item => item.id);
  assert.ok(!ids.includes("hidden") && !ids.includes("deleted") && !ids.includes("pending"));
});

test("selection avoids piling one colour and orientation when alternatives exist", () => {
  const photos = [
    ...Array.from({ length: 30 }, (_, i) => photo(`g${String(i).padStart(2, "0")}`, { colors: [{ name: "green", share: 0.6 }], orientation: "landscape" })),
    ...Array.from({ length: 30 }, (_, i) => photo(`b${String(i).padStart(2, "0")}`, { colors: [{ name: "blue", share: 0.6 }], orientation: "portrait" })),
  ];
  const chosen = dailySelection(photos, "2026-10-04");
  const greens = chosen.filter(item => item.colors[0].name === "green").length;
  assert.ok(greens <= chosen.length * 0.7, `greens=${greens} of ${chosen.length}`);
});

test("layout is deterministic per date, photo and slot", () => {
  const item = photo("p001", { orientation: "portrait" });
  assert.deepEqual(layoutFor(item, { key: "2026-10-04", slot: 3 }), layoutFor(item, { key: "2026-10-04", slot: 3 }));
});

test("layout changes between dates", () => {
  const item = photo("p001");
  assert.notDeepEqual(layoutFor(item, { key: "2026-10-04", slot: 3 }), layoutFor(item, { key: "2026-10-05", slot: 3 }));
});

test("layout keeps photographs on canvas and sizes portraits narrower", () => {
  const selection = dailySelection(library(200), "2026-10-04");
  for (const mobile of [false, true]) {
    for (const entry of layoutForSelection(selection, { key: "2026-10-04", mobile })) {
      assert.ok(entry.x >= 0 && entry.x + entry.width <= 100.01, `x overflow for ${entry.id}`);
      assert.ok(entry.y >= 0 && entry.y <= 100, `y out of range for ${entry.id}`);
    }
  }
  const portrait = layoutFor(photo("a", { orientation: "portrait" }), { key: "k", slot: 0 });
  const landscape = layoutFor(photo("a", { orientation: "landscape" }), { key: "k", slot: 0 });
  assert.ok(portrait.width < landscape.width);
});

test("mobile layout is wider per photograph than desktop", () => {
  const item = photo("p002");
  assert.ok(layoutFor(item, { key: "k", slot: 1, mobile: true }).width > layoutFor(item, { key: "k", slot: 1 }).width);
});

test("colour names are classified from RGB", () => {
  assert.equal(classifyPixel(30, 180, 40), "green");
  assert.equal(classifyPixel(30, 60, 220), "blue");
  assert.equal(classifyPixel(230, 40, 30), "red");
  assert.equal(classifyPixel(5, 5, 5), "black");
  assert.equal(classifyPixel(250, 250, 250), "white");
});

test("colour shares drop noise and sort by share", () => {
  const shares = colorShares({ green: 700, blue: 290, red: 10 });
  assert.deepEqual(shares.map(entry => entry.name), ["green", "blue"]);
  assert.equal(shares[0].share, 0.7);
});

test("query parsing maps colour words and synonyms", () => {
  const query = parseQuery("Green automobile");
  assert.deepEqual(query.colors, ["green"]);
  assert.deepEqual(query.terms, ["car"]);
});

test("colour queries rank photos that are actually that colour first", () => {
  const photos = [
    photo("tagged", { tags: ["nature"], colors: [{ name: "blue", share: 0.5 }] }),
    photo("green", { tags: ["nature"], colors: [{ name: "green", share: 0.6 }] }),
  ];
  const { results } = rankPhotos("green", photos);
  assert.equal(results[0].id, "green");
  assert.ok(!results.some(result => result.id === "tagged") || results.at(-1).id === "tagged");
});

test("combined semantic and colour query needs both", () => {
  const photos = [
    photo("green-car", { tags: ["car"], colors: [{ name: "green", share: 0.5 }] }),
    photo("red-car", { tags: ["car"], colors: [{ name: "red", share: 0.5 }] }),
    photo("green-tree", { tags: ["nature"], colors: [{ name: "green", share: 0.8 }] }),
  ];
  const ids = rankPhotos("green car", photos).results.map(result => result.id);
  assert.equal(ids[0], "green-car");
  assert.ok(!ids.includes("red-car") || ids.indexOf("red-car") > ids.indexOf("green-car"));
});

test("search covers the whole ready library, not only today's selection", () => {
  const photos = library(200);
  const today = new Set(dailySelection(photos, "2026-10-04").map(item => item.id));
  const cars = rankPhotos("car", photos, { limit: 200 }).results;
  assert.ok(cars.some(result => !today.has(result.id)));
});

test("search excludes hidden and deleted photographs", () => {
  const photos = [photo("visible", { tags: ["car"] }), photo("hidden", { tags: ["car"], hidden: true }), photo("gone", { tags: ["car"], deletedAt: "x" })];
  assert.deepEqual(rankPhotos("car", photos).results.map(result => result.id), ["visible"]);
});

test("public view never includes source metadata", () => {
  const view = publicView({ ...photo("p1"), originalKey: "originals/p1.jpg", exif: { gps: [40, -74] } });
  assert.ok(!("originalKey" in view) && !("exif" in view));
});

test("isPublic requires ready, visible and not deleted", () => {
  assert.equal(isPublic(photo("a")), true);
  assert.equal(isPublic(photo("a", { status: "failed" })), false);
  assert.equal(publicPhotos([photo("a", { hidden: true })]).length, 0);
});

test("ingest validation rejects malformed batches", () => {
  assert.equal(validateIngestBatch({ runId: "run-0001", photos: [{ id: "a", tags: [], caption: "x" }] }).ok, true);
  assert.equal(validateIngestBatch({ runId: "x", photos: [] }).ok, false);
  assert.equal(validateIngestBatch({ runId: "run-0001", photos: [{ id: "a", tags: "car", caption: "x" }] }).ok, false);
  assert.equal(validateIngestBatch({ runId: "run-0001", photos: Array.from({ length: 201 }, (_, i) => ({ id: `${i}`, tags: [], caption: "" })) }).ok, false);
});

test("ingest drops tags outside the vocabulary and normalises case", () => {
  assert.deepEqual(normalizeTags(["Car", "car", "spaceship"], DEFAULT_VOCABULARY), ["car"]);
});

function memoryStore(photos) {
  const rows = new Map(photos.map(item => [item.id, { ...item, tags: [], runs: new Set() }]));
  return {
    rows,
    async getPhoto(id) {
      return rows.get(id) ?? null;
    },
    async replaceTags(id, tags, source) {
      rows.get(id).tags = tags.map(tag => ({ tag, source }));
    },
    async setCaption(id, caption) {
      rows.get(id).caption = caption;
    },
    async recordRun(id, runId) {
      rows.get(id).runs.add(runId);
    },
    async markReady(id) {
      rows.get(id).status = "ready";
    },
  };
}

test("repeated Colab sync is idempotent", async () => {
  const store = memoryStore([photo("a1", { status: "pending" })]);
  const batch = { runId: "run-0001", photos: [{ id: "a1", tags: ["car", "night"], caption: "a car at night" }] };
  await applyIngest(store, batch, DEFAULT_VOCABULARY);
  await applyIngest(store, batch, DEFAULT_VOCABULARY);
  const row = store.rows.get("a1");
  assert.equal(row.tags.length, 2);
  assert.equal(row.runs.size, 1);
  assert.equal(row.status, "ready");
});

test("a later run replaces tags instead of appending", async () => {
  const store = memoryStore([photo("a1", { status: "pending" })]);
  await applyIngest(store, { runId: "run-0001", photos: [{ id: "a1", tags: ["car", "night"], caption: "" }] }, DEFAULT_VOCABULARY);
  await applyIngest(store, { runId: "run-0002", photos: [{ id: "a1", tags: ["sunset"], caption: "" }] }, DEFAULT_VOCABULARY);
  assert.deepEqual(store.rows.get("a1").tags.map(entry => entry.tag), ["sunset"]);
});

test("failed or unknown photographs do not stop the rest of the batch", async () => {
  const store = memoryStore([photo("ok1", { status: "pending" }), photo("gone", { status: "pending", deletedAt: "x" })]);
  const result = await applyIngest(
    store,
    { runId: "run-0003", photos: [{ id: "missing", tags: [], caption: "" }, { id: "gone", tags: [], caption: "" }, { id: "ok1", tags: ["car"], caption: "" }] },
    DEFAULT_VOCABULARY,
  );
  assert.deepEqual(result.applied.map(item => item.id), ["ok1"]);
  assert.equal(result.skipped.length, 2);
});
