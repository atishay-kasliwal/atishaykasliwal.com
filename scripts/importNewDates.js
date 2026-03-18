/**
 * Import script for Feb 2025 – Dec 2025 FOMC sessions
 *
 * Setup (one-time, same as before):
 *   cd scripts && npm install
 *   Place serviceAccountKey.json in scripts/
 *
 * Run:
 *   node scripts/importNewDates.js
 *
 * Data source:
 *   test data for fmoc/Feb 2025 - December 2025/
 *     same_minute/predictions_only_mapped.csv
 *     same_minute/all_except_prediction_mapped.csv
 *     next_minute/predictions_only_mapped.csv
 *     next_minute/all_except_prediction_mapped.csv
 *
 * Firestore structure written (same as before):
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
const DATA_DIR = path.join(__dirname, '..', 'test data for fmoc', 'Feb 2025 - December 2025');

// ── Session config — fill in videoId and rate for each date ──────────────────
const SESSION_CONFIG = {
  '2025-03-19': {
    label: 'Mar 19, 2025',
    rate: 'Hold → 4.25–4.50%',
    videoId: 'zmfyoadWHME',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-05-07': {
    label: 'May 7, 2025',
    rate: 'Hold → 4.25–4.50%',
    videoId: 'mu6VPhhZfkQ',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-06-18': {
    label: 'Jun 18, 2025',
    rate: 'Hold → 4.25–4.50%',
    videoId: 'iAiL1UMgkYQ',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-07-30': {
    label: 'Jul 30, 2025',
    rate: 'Hold → 4.25–4.50%',
    videoId: 'tt1n8ceFmSY',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-09-17': {
    label: 'Sep 17, 2025',
    rate: 'TBD',
    videoId: 'EEIs8ossWyM',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-10-29': {
    label: 'Oct 29, 2025',
    rate: 'TBD',
    videoId: 'gZsAKn1UtH4',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
  '2025-12-10': {
    label: 'Dec 10, 2025',
    rate: 'TBD',
    videoId: 'Ko-_yb2UkDk',
    speaker: 'Jerome H. Powell',
    title: 'FOMC Press Conference',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
}

function toIntervalId(timeStr) {
  // "2025-03-19T18:30:00" → "18:30:00"
  return timeStr.includes('T') ? timeStr.split('T')[1] : timeStr.split(' ')[1];
}

function toVideoSeconds(timeStr) {
  const t = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr.split(' ')[1];
  const [hh, mm, ss] = t.split(':').map(Number);
  return (hh - 18) * 3600 + (mm - 30) * 60 + (ss || 0);
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

// ── Load CSVs ─────────────────────────────────────────────────────────────────

console.log('📂 Loading CSVs...');

const h0Preds  = readCsv(path.join(DATA_DIR, 'same_minute', 'predictions_only_mapped.csv'));
const h0Acts   = readCsv(path.join(DATA_DIR, 'same_minute', 'all_except_prediction_mapped.csv'));
const h1Preds  = readCsv(path.join(DATA_DIR, 'next_minute', 'predictions_only_mapped.csv'));
const h1Acts   = readCsv(path.join(DATA_DIR, 'next_minute', 'all_except_prediction_mapped.csv'));

console.log(`  ✓ same_minute/predictions  — ${h0Preds.length} rows`);
console.log(`  ✓ same_minute/actuals      — ${h0Acts.length} rows`);
console.log(`  ✓ next_minute/predictions  — ${h1Preds.length} rows`);
console.log(`  ✓ next_minute/actuals      — ${h1Acts.length} rows`);

// ── Build lookup maps ─────────────────────────────────────────────────────────

const h0PredByUid = new Map(h0Preds.map(r => [r.current_unique_id, r]));
const h0ActByUid  = new Map(h0Acts.map(r  => [r.current_unique_id, r]));
const h1PredByUid = new Map(h1Preds.map(r => [r.current_unique_id, r]));
const h1ActByUid  = new Map(h1Acts.map(r  => [r.current_unique_id, r]));

// Group actuals by original_date to drive interval list
const intervalsByDate = new Map();
for (const row of h0Acts) {
  const date = row.original_date;
  if (!intervalsByDate.has(date)) intervalsByDate.set(date, []);
  intervalsByDate.get(date).push(row);
}

// ── Batch commit helper ───────────────────────────────────────────────────────

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
  const dateIntervals = intervalsByDate.get(date) || [];

  console.log(`\n📅 ${date} — ${dateIntervals.length} intervals`);

  // Compute session-level accuracy from actuals
  const correct = dateIntervals.filter(r => r.correct_direction === 'true').length;
  const accuracyPct = dateIntervals.length > 0
    ? parseFloat(((correct / dateIntervals.length) * 100).toFixed(2))
    : null;
  const absErrors = dateIntervals.map(r => parseFloat(r.abs_error)).filter(n => !isNaN(n));
  const mae = absErrors.length > 0
    ? parseFloat((absErrors.reduce((a, b) => a + b, 0) / absErrors.length).toFixed(4))
    : null;
  const signedErrors = dateIntervals.map(r => parseFloat(r.signed_error)).filter(n => !isNaN(n));
  const meanSignedError = signedErrors.length > 0
    ? parseFloat((signedErrors.reduce((a, b) => a + b, 0) / signedErrors.length).toFixed(4))
    : null;

  // Session document
  const sessionRef = db.collection('fomc_sessions').doc(date);
  await sessionRef.set({
    label: config.label,
    rate: config.rate,
    videoId: config.videoId,
    speaker: config.speaker,
    title: config.title,
    accuracyPct,
    mae,
    meanSignedError,
    totalIntervals: dateIntervals.length,
    schemaVersion: 1,
    modelVersion: 'NOWCAST_H0_v1',
    tags: ['fomc', 'nlp', 'market-reaction'],
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`  ✓ Session doc written (accuracy: ${accuracyPct}%)`);

  // Interval subcollection
  const ops = [];

  for (const iv of dateIntervals) {
    const uid = iv.current_unique_id;
    const intervalId = toIntervalId(iv.current_start_time);
    const intervalRef = sessionRef.collection('intervals').doc(intervalId);

    const h0p = h0PredByUid.get(uid) || {};
    const h0a = h0ActByUid.get(uid) || {};
    const h1p = h1PredByUid.get(uid) || {};
    const h1a = h1ActByUid.get(uid) || {};

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
        videoSeconds: toVideoSeconds(iv.current_start_time),
        startTime: iv.current_start_time,
        endTime: iv.predict_to_start_time,
        speech: '',        // not available in new dataset
        actualChange: safeFloat(iv.actual_change),
        percentageChange: null,
        volatility: null,
        horizons,
        historical: [],    // not available in new dataset
        news: [],          // not available in new dataset
        metadata: {},
      },
    });
  }

  await commitBatch(ops);
  console.log(`  ✓ ${ops.length} interval docs written`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const IMPORT_DATES = Object.keys(SESSION_CONFIG);
  console.log('🚀 Starting Firestore import for new dates...');
  console.log(`   Sessions: ${IMPORT_DATES.join(', ')}\n`);

  for (const date of IMPORT_DATES) {
    if (!intervalsByDate.has(date)) {
      console.log(`\n⚠️  ${date} — no rows found in actuals CSV, skipping`);
      continue;
    }
    await importDate(date);
  }

  console.log('\n✅ All done. Check your Firestore console:');
  console.log('   https://console.firebase.google.com/project/fmoc-b630e/firestore');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Import failed:', err);
  process.exit(1);
});
