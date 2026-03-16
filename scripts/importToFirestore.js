/**
 * Full import script — joins all CSVs and writes to Firestore
 *
 * Setup (one-time):
 *   cd scripts && npm install firebase-admin csv-parse
 *
 * Download service account key from:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   Save as scripts/serviceAccountKey.json  (never commit this file)
 *
 * Run:
 *   node scripts/importToFirestore.js
 *
 * Data sources (all read from ../test data for fmoc/):
 *   5_min_interval.csv                           — speech, price, volatility, historical RAG
 *   same_minute/predictions_only_mapped.csv       — h0 predictions (nowcast)
 *   same_minute/all_except_prediction_mapped.csv  — h0 actuals + accuracy
 *   next_minute/predictions_only_mapped.csv       — h1 predictions (1-min ahead)
 *   next_minute/all_except_prediction_mapped.csv  — h1 actuals + accuracy
 *   interval_top55_news.csv                       — top 55 news per interval (we store top 10)
 *   summary_by_snapshot.csv                       — per-session accuracy summary
 *
 * Firestore structure written:
 *   fomc_sessions/{date}
 *     fomc_sessions/{date}/intervals/{HH:MM:SS}
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

// ── Firebase init ─────────────────────────────────────────────────────────────
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Paths ─────────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'test data for fmoc');

// ── Session config (6 FOMC dates we have prediction data for) ─────────────────
const SESSION_CONFIG = {
  '2024-06-12': {
    label: 'Jun 12, 2024',
    rate: 'Hold → 5.25–5.50%',
    videoId: 'q3ZE5tF_IMU',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2024-07-31': {
    label: 'Jul 31, 2024',
    rate: 'Hold → 5.25–5.50%',
    videoId: 'd1wx4mCqYF8',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2024-09-18': {
    label: 'Sep 18, 2024',
    rate: '-50bps → 4.75–5.00%',
    videoId: '8S7JjIcIrkI',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2024-11-07': {
    label: 'Nov 7, 2024',
    rate: '-25bps → 4.50–4.75%',
    videoId: '3adfVQCpEBk',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2024-12-18': {
    label: 'Dec 18, 2024',
    rate: '-25bps → 4.25–4.50%',
    videoId: 'nsNgk46qHgw',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-01-29': {
    label: 'Jan 29, 2025',
    rate: 'Hold → 4.25–4.50%',
    videoId: 'REimusg6un4',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
}

/**
 * Convert start_time like "2024-06-12T18:30:00" or "2024-06-12 18:30:00"
 * into videoSeconds relative to 18:30:00 (press conference start = second 0).
 */
function toVideoSeconds(startTime) {
  const timeStr = startTime.includes('T') ? startTime.split('T')[1] : startTime.split(' ')[1];
  const [hh, mm, ss] = timeStr.split(':').map(Number);
  return (hh - 18) * 3600 + (mm - 30) * 60 + (ss || 0);
}

/**
 * Derive interval doc ID from start_time — HH:MM:SS part.
 * e.g. "2024-06-12T18:30:00" → "18:30:00"
 */
function toIntervalId(startTime) {
  return startTime.includes('T') ? startTime.split('T')[1] : startTime.split(' ')[1];
}

/**
 * Parse the historical field — Python-style list-of-dicts string.
 * Returns top 5 by score with compact shape.
 */
function parseHistorical(raw) {
  if (!raw || raw.trim() === '[]') return [];
  try {
    const jsonStr = raw
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null');
    const parsed = JSON.parse(jsonStr);
    return parsed
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map((h) => ({
        id: h.id || '',
        score: typeof h.score === 'number' ? parseFloat(h.score.toFixed(4)) : 0,
        date: h.metadata?.original_date || '',
        actualChange: typeof h.metadata?.actual_price_change === 'number'
          ? parseFloat(h.metadata.actual_price_change.toFixed(4)) : 0,
        speech: (h.metadata?.speech || '').substring(0, 300),
      }));
  } catch {
    return [];
  }
}

function safeFloat(val, decimals = 4) {
  const n = parseFloat(val);
  return isNaN(n) ? null : parseFloat(n.toFixed(decimals));
}

function safeInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function safeBool(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
}

// ── Load all CSVs ─────────────────────────────────────────────────────────────

console.log('📂 Loading CSVs...');

const intervals5min = readCsv(path.join(DATA_DIR, '5_min_interval.csv'));
console.log(`  ✓ 5_min_interval.csv — ${intervals5min.length} rows`);

const h0Preds = readCsv(path.join(DATA_DIR, 'same_minute', 'predictions_only_mapped.csv'));
console.log(`  ✓ same_minute/predictions_only_mapped.csv — ${h0Preds.length} rows`);

const h0Actuals = readCsv(path.join(DATA_DIR, 'same_minute', 'all_except_prediction_mapped.csv'));
console.log(`  ✓ same_minute/all_except_prediction_mapped.csv — ${h0Actuals.length} rows`);

const h1Preds = readCsv(path.join(DATA_DIR, 'next_minute', 'predictions_only_mapped.csv'));
console.log(`  ✓ next_minute/predictions_only_mapped.csv — ${h1Preds.length} rows`);

const h1Actuals = readCsv(path.join(DATA_DIR, 'next_minute', 'all_except_prediction_mapped.csv'));
console.log(`  ✓ next_minute/all_except_prediction_mapped.csv — ${h1Actuals.length} rows`);

const newsRows = readCsv(path.join(DATA_DIR, 'interval_top55_news.csv'));
console.log(`  ✓ interval_top55_news.csv — ${newsRows.length} rows`);

const summaryRows = readCsv(path.join(DATA_DIR, 'summary_by_snapshot.csv'));
console.log(`  ✓ summary_by_snapshot.csv — ${summaryRows.length} rows`);

// ── Build lookup maps ─────────────────────────────────────────────────────────

console.log('\n🔗 Building lookup maps...');

// unique_id → h0/h1 prediction & actuals
const h0PredByUid = new Map(h0Preds.map((r) => [r.current_unique_id, r]));
const h0ActualByUid = new Map(h0Actuals.map((r) => [r.current_unique_id, r]));
const h1PredByUid = new Map(h1Preds.map((r) => [r.current_unique_id, r]));
const h1ActualByUid = new Map(h1Actuals.map((r) => [r.current_unique_id, r]));

// interval_unique_id → top 10 news sorted by rank
const newsByUid = new Map();
for (const n of newsRows) {
  const uid = n.interval_unique_id;
  if (!newsByUid.has(uid)) newsByUid.set(uid, []);
  newsByUid.get(uid).push(n);
}
for (const [uid, items] of newsByUid) {
  newsByUid.set(
    uid,
    items
      .sort((a, b) => parseInt(a.rank) - parseInt(b.rank))
      .slice(0, 10)
      .map((n) => ({
        rank: safeInt(n.rank),
        score: safeFloat(n.score),
        title: n.news_title || '',
        url: n.news_url || '',
        date: n.news_date || '',
        text: (n.news_text || '').substring(0, 500),
      }))
  );
}

// snapshot date string → summary row
const summaryByDate = new Map(
  summaryRows.map((r) => [r.snapshot_file.replace('pred_', '').replace('.jsonl', ''), r])
);

// Group 5_min_interval rows by original_date (only our 6 import dates)
const IMPORT_DATES = Object.keys(SESSION_CONFIG);
const intervalsByDate = new Map();
for (const row of intervals5min) {
  if (!IMPORT_DATES.includes(row.original_date)) continue;
  if (!intervalsByDate.has(row.original_date)) intervalsByDate.set(row.original_date, []);
  intervalsByDate.get(row.original_date).push(row);
}

console.log('  ✓ All lookup maps built');

// ── Batch commit helper (Firestore limit: 500 ops/batch) ──────────────────────

async function commitBatch(ops) {
  const CHUNK = 490;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const batch = db.batch();
    ops.slice(i, i + CHUNK).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
    process.stdout.write(`    committed ${Math.min(i + CHUNK, ops.length)}/${ops.length} ops\r`);
  }
  console.log('');
}

// ── Import one date ───────────────────────────────────────────────────────────

async function importDate(date) {
  const config = SESSION_CONFIG[date];
  const summary = summaryByDate.get(date) || {};
  const dateIntervals = intervalsByDate.get(date) || [];

  console.log(`\n📅 ${date} — ${dateIntervals.length} intervals`);

  // Session document
  const sessionRef = db.collection('fomc_sessions').doc(date);
  await sessionRef.set({
    label: config.label,
    rate: config.rate,
    videoId: config.videoId,
    speaker: config.speaker,
    title: config.title,
    accuracyPct: safeFloat(summary.directional_accuracy_pct, 2),
    mae: safeFloat(summary.mae),
    meanSignedError: safeFloat(summary.mean_signed_error),
    totalIntervals: dateIntervals.length,
    schemaVersion: 1,
    modelVersion: 'NOWCAST_H0_v1',
    tags: ['fomc', 'nlp', 'market-reaction'],
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`  ✓ Session doc written`);

  // Interval subcollection
  const ops = [];

  for (const iv of dateIntervals) {
    const uid = iv.unique_id;
    const intervalRef = sessionRef.collection('intervals').doc(toIntervalId(iv.start_time));

    const h0p = h0PredByUid.get(uid) || {};
    const h0a = h0ActualByUid.get(uid) || {};
    const h1p = h1PredByUid.get(uid) || {};
    const h1a = h1ActualByUid.get(uid) || {};

    const horizons = {};

    if (h0p.current_unique_id) {
      horizons.h0 = {
        reaction: h0p.predicted_reaction || null,
        change: safeFloat(h0p.predicted_change),
        reasoning: h0p.prediction_reasoning || null,
        actualChange: safeFloat(h0a.actual_change),
        actualReaction: h0a.actual_reaction || null,
        correctDirection: safeBool(h0a.correct_direction),
        signedError: safeFloat(h0a.signed_error),
        absError: safeFloat(h0a.abs_error),
        tokensEstimated: safeInt(h0a.tokens_estimated),
        kUsed: safeInt(h0a.k_used),
      };
    }

    if (h1p.current_unique_id) {
      horizons.h1 = {
        reaction: h1p.predicted_reaction || null,
        change: safeFloat(h1p.predicted_change),
        reasoning: h1p.prediction_reasoning || null,
        actualChange: safeFloat(h1a.actual_change),
        actualReaction: h1a.actual_reaction || null,
        correctDirection: safeBool(h1a.correct_direction),
        signedError: safeFloat(h1a.signed_error),
        absError: safeFloat(h1a.abs_error),
      };
    }

    ops.push({
      ref: intervalRef,
      data: {
        uniqueId: uid,
        videoSeconds: toVideoSeconds(iv.start_time),
        startTime: iv.start_time,
        endTime: iv.end_time,
        speech: iv.speech || '',
        actualChange: safeFloat(iv.actual_price_change),
        percentageChange: safeFloat(iv.percentage_price_change, 6),
        volatility: safeFloat(iv.volatility, 6),
        horizons,
        historical: parseHistorical(iv.historical),
        news: newsByUid.get(uid) || [],
        metadata: {},
      },
    });
  }

  await commitBatch(ops);
  console.log(`  ✓ ${ops.length} interval docs written`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting Firestore import...');
  console.log(`   Sessions: ${IMPORT_DATES.join(', ')}\n`);

  for (const date of IMPORT_DATES) {
    await importDate(date);
  }

  console.log('\n✅ All done. Check your Firestore console:');
  console.log('   https://console.firebase.google.com/project/fmoc-b630e/firestore');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err);
  process.exit(1);
});
