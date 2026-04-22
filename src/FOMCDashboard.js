import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './FOMCDashboard.css';
import FOMCApiAccessPanel from './FOMCApiAccessPanel';

// ── Model Evaluation Results (live from Firestore fomc_sessions) ──────────────

const EXPANDING_WINDOW_DATA = [
  { num:  1, testDate: '2024-06-12', rate: 'Hold → 5.25–5.50%',   totalIntervals: 94, pos: 17, neg:  6, accuracy: 67.74, mae: 0.4594, mse:  0.0732 },
  { num:  2, testDate: '2024-07-31', rate: 'Hold → 5.25–5.50%',   totalIntervals: 86, pos: 16, neg:  5, accuracy: 61.18, mae: 0.5070, mse:  0.1104 },
  { num:  3, testDate: '2024-09-18', rate: '-50bps → 4.75–5.00%', totalIntervals: 90, pos: 21, neg:  0, accuracy: 41.57, mae: 1.2106, mse:  0.8538 },
  { num:  4, testDate: '2024-11-07', rate: '-25bps → 4.50–4.75%', totalIntervals: 76, pos: 15, neg:  2, accuracy: 56.00, mae: 0.3048, mse:  0.1121 },
  { num:  5, testDate: '2024-12-18', rate: '-25bps → 4.25–4.50%', totalIntervals: 96, pos: 10, neg: 14, accuracy: 48.42, mae: 0.6793, mse:  0.3814 },
  { num:  6, testDate: '2025-01-29', rate: 'Hold → 4.25–4.50%',   totalIntervals: 90, pos:  0, neg: 21, accuracy: 69.66, mae: 0.3645, mse:  0.0600 },
  { num:  7, testDate: '2025-03-19', rate: 'Hold → 4.25–4.50%',   totalIntervals: 45, pos:  0, neg: 45, accuracy: 31.11, mae: 0.8821, mse: -0.8099 },
  { num:  8, testDate: '2025-05-07', rate: 'Hold → 4.25–4.50%',   totalIntervals: 43, pos:  1, neg: 42, accuracy: 44.19, mae: 0.9012, mse: -0.6807 },
  { num:  9, testDate: '2025-06-18', rate: 'Hold → 4.25–4.50%',   totalIntervals: 47, pos:  0, neg: 47, accuracy: 61.70, mae: 0.6393, mse: -0.2328 },
  { num: 10, testDate: '2025-07-30', rate: 'Hold → 4.25–4.50%',   totalIntervals: 40, pos:  0, neg: 40, accuracy: 70.00, mae: 0.5480, mse: -0.0406 },
  { num: 11, testDate: '2025-09-17', rate: 'TBD',                  totalIntervals: 48, pos: 17, neg: 31, accuracy: 58.33, mae: 0.9945, mse: -0.1614 },
  { num: 12, testDate: '2025-10-29', rate: 'TBD',                  totalIntervals: 50, pos:  1, neg: 49, accuracy: 52.00, mae: 0.9785, mse: -0.5245 },
  { num: 13, testDate: '2025-12-10', rate: 'TBD',                  totalIntervals: 47, pos:  3, neg: 44, accuracy: 42.55, mae: 0.6921, mse: -0.5587 },
];

// ── FOMC Sessions ─────────────────────────────────────────────────────────────

const FOMC_DATES = [
  { id: 0,  date: '2024-06-12', label: 'Jun 12', year: '2024', rate: 'Hold → 5.25–5.50%',   videoId: 'q3ZE5tF_IMU' },
  { id: 1,  date: '2024-07-31', label: 'Jul 31', year: '2024', rate: 'Hold → 5.25–5.50%',   videoId: 'd1wx4mCqYF8' },
  { id: 2,  date: '2024-09-18', label: 'Sep 18', year: '2024', rate: '-50bps → 4.75–5.00%', videoId: '8S7JjIcIrkI' },
  { id: 3,  date: '2024-11-07', label: 'Nov 7',  year: '2024', rate: '-25bps → 4.50–4.75%', videoId: '3adfVQCpEBk' },
  { id: 4,  date: '2024-12-18', label: 'Dec 18', year: '2024', rate: '-25bps → 4.25–4.50%', videoId: 'nsNgk46qHgw' },
  { id: 5,  date: '2025-01-29', label: 'Jan 29', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'REimusg6un4' },
  { id: 6,  date: '2025-03-19', label: 'Mar 19', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'zmfyoadWHME' },
  { id: 7,  date: '2025-05-07', label: 'May 7',  year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'mu6VPhhZfkQ' },
  { id: 8,  date: '2025-06-18', label: 'Jun 18', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'iAiL1UMgkYQ' },
  { id: 9,  date: '2025-07-30', label: 'Jul 30', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'tt1n8ceFmSY' },
  { id: 10, date: '2025-09-17', label: 'Sep 17', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'EEIs8ossWyM' },
  { id: 11, date: '2025-10-29', label: 'Oct 29', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'gZsAKn1UtH4' },
  { id: 12, date: '2025-12-10', label: 'Dec 10', year: '2025', rate: 'Hold → 4.25–4.50%',   videoId: 'Ko-_yb2UkDk' },
];

// ── Models ────────────────────────────────────────────────────────────────────

const MODELS = [
  { key: 'gpt_5min_news',   label: 'GPT',        sub: '5min · News',    color: 'rgba(210,195,255,1)'   },
  { key: 'gpt_5min_nonews', label: 'GPT',        sub: '5min · No News', color: 'rgba(100,220,180,0.9)' },
  { key: 'gpt_1min_news',   label: 'GPT',        sub: '1min · News',    color: 'rgba(255,210,80,0.9)'  },
  { key: 'gpt_10min_news',  label: 'GPT',        sub: '10min · News',   color: 'rgba(80,180,255,0.9)'  },
  { key: 'longformer_5min', label: 'Longformer', sub: '5min · News',    color: 'rgba(255,140,80,0.9)'  },
];

const FOMC_API_BASE =
  process.env.REACT_APP_FOMC_API_BASE || 'https://legal-rag-api.katishay.workers.dev';

const STATIC_EVAL_BY_DATE = Object.fromEntries(
  EXPANDING_WINDOW_DATA.map((r) => [r.testDate, r])
);

function toMetricOrFallback(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildEvaluationRowsForModel(modelKey, bundleByDate = new Map()) {
  return FOMC_DATES.map((session, idx) => {
    const fallback = STATIC_EVAL_BY_DATE[session.date] || null;
    const fallbackMetrics = modelKey === 'gpt_5min_news' ? fallback : null;
    const bundle = bundleByDate.get(session.date) || null;
    const modelMeta = bundle?.modelMeta || null;
    const intervalsLen = Array.isArray(bundle?.intervals) ? bundle.intervals.length : null;
    const useLiveIntervalCount = modelKey !== 'gpt_5min_news';

    return {
      num: idx + 1,
      testDate: session.date,
      rate: session.rate || fallback?.rate || 'TBD',
      totalIntervals: toMetricOrFallback(
        modelMeta?.totalIntervals,
        useLiveIntervalCount
          ? toMetricOrFallback(intervalsLen, null)
          : fallbackMetrics?.totalIntervals ?? null
      ),
      pos: toMetricOrFallback(modelMeta?.pos, fallbackMetrics?.pos ?? null),
      neg: toMetricOrFallback(modelMeta?.neg, fallbackMetrics?.neg ?? null),
      accuracy: toMetricOrFallback(modelMeta?.accuracyPct, fallbackMetrics?.accuracy ?? null),
      mae: toMetricOrFallback(modelMeta?.mae, fallbackMetrics?.mae ?? null),
      mse: toMetricOrFallback(modelMeta?.mse, fallbackMetrics?.mse ?? null),
    };
  });
}

function computeVideoSeconds(startTime, date) {
  try {
    const norm = (startTime || '').replace(' ', 'T').replace(/[+Z].*$/, '');
    const base = new Date(`${date}T18:30:00`);
    const t    = new Date(norm.includes('T') ? norm : `${date}T18:30:00`);
    return Math.max(0, Math.round((t - base) / 1000));
  } catch { return 0; }
}

async function loadIntervalsFromFirestore(db, date, modelKey) {
  if (modelKey === 'gpt_5min_news') {
    const snap = await getDocs(collection(db, 'fomc_sessions', date, 'intervals'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.videoSeconds - b.videoSeconds);
  }
  const snap = await getDocs(
    collection(db, 'fomc_sessions', date, 'models', modelKey, 'predictions')
  );
  return snap.docs
    .map(d => {
      const p = d.data();
      return {
        id:          p.uid || d.id,
        videoSeconds:computeVideoSeconds(p.startTime, date),
        speech:      p.speech      || '',
        news:        p.news        || [],
        actualChange:p.actualChange || 0,
        volatility:  p.volatility  || 0,
        horizons: {
          h0: {
            reaction:        p.reaction         || '',
            change:          p.change           || 0,
            correctDirection:p.correctDirection || false,
            signedError:     p.signedError      || 0,
            absError:        p.absError         || 0,
            reasoning:       p.reasoning        || '',
          }
        }
      };
    })
    .sort((a, b) => a.videoSeconds - b.videoSeconds);
}

async function loadSessionBundleFromPublicApi(date, modelKey) {
  const qs = new URLSearchParams({ session_date: date, model_key: modelKey });
  const res = await fetch(`${FOMC_API_BASE}/public/fomc/session?${qs.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Public fallback failed (${res.status}): ${body || res.statusText}`);
  }
  return res.json();
}

// ── Chart geometry ─────────────────────────────────────────────────────────────

const CW = 800;
const CH = 480;
const PAD_L = 10;
const PAD_R = 50;
const PAD_T = 24;
const PAD_B = 36;

// ── Panel helpers ───────────────────────────────────────────────────────────────

const HIGHLIGHT_TERMS = [
  { words: ['inflation', 'inflationary', 'price stability'], cls: 'hawk' },
  { words: ['tightening', 'restrictive', 'rate hike', 'hawkish', 'above target'], cls: 'hawk' },
  { words: ['cut', 'easing', 'accommodative', 'pause', 'dovish', 'below target'], cls: 'dove' },
  { words: ['labor market', 'employment', 'unemployment', 'jobs'], cls: 'key' },
  { words: ['growth', 'gdp', 'neutral rate', 'balance sheet', 'mandate'], cls: 'key' },
];

function highlightText(text) {
  const all = HIGHLIGHT_TERMS.flatMap(({ words, cls }) => words.map((w) => ({ w, cls })));
  all.sort((a, b) => b.w.length - a.w.length);
  const escaped = all.map((t) => t.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const term = all.find((t) => t.w.toLowerCase() === part.toLowerCase());
    return term ? <mark key={i} className={`fomc-kw-${term.cls}`}>{part}</mark> : part;
  });
}

function getSignalTags(text) {
  const lower = text.toLowerCase();
  const tags = [];
  if (lower.includes('inflation') || lower.includes('price')) tags.push({ label: 'Inflation Signal', cls: 'hawk' });
  if (lower.includes('labor') || lower.includes('employment') || lower.includes('jobs')) tags.push({ label: 'Labor Market', cls: 'key' });
  if (lower.includes('rate') || lower.includes('policy') || lower.includes('restrictive')) tags.push({ label: 'Policy Tone', cls: 'hawk' });
  if (lower.includes('market') || lower.includes('growth') || lower.includes('gdp')) tags.push({ label: 'Market Impact', cls: 'key' });
  return tags.slice(0, 2);
}

function getNewsCategory(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('fed') || t.includes('federal reserve') || t.includes('fomc') || t.includes('powell')) return 'FED POLICY';
  if (t.includes('inflation') || t.includes('cpi') || t.includes('gdp') || t.includes('unemployment') || t.includes('economy')) return 'MACRO';
  return 'MARKETS';
}

function getNewsProvider(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const known = {
      'reuters.com': 'Reuters', 'bloomberg.com': 'Bloomberg', 'wsj.com': 'WSJ',
      'ft.com': 'FT', 'cnbc.com': 'CNBC', 'nytimes.com': 'NYT',
      'washingtonpost.com': 'WaPo', 'marketwatch.com': 'MarketWatch',
      'barrons.com': 'Barron\'s', 'fortune.com': 'Fortune',
      'thehill.com': 'The Hill', 'apnews.com': 'AP', 'axios.com': 'Axios',
      'politico.com': 'Politico', 'npr.org': 'NPR', 'bbc.com': 'BBC',
      'foxbusiness.com': 'Fox Business', 'usatoday.com': 'USA Today',
      'investopedia.com': 'Investopedia', 'seeking.com': 'Seeking Alpha',
    };
    return known[host] || host.split('.')[0].toUpperCase();
  } catch {
    return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function FOMCDashboard() {
  // ── Date selection ────────────────────────────────────────────────────────
  const [selectedDateId, setSelectedDateId] = useState(0); // Jun 12, 2024
  const selectedSession = FOMC_DATES[selectedDateId];

  // ── Model selection ───────────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState('gpt_5min_news');
  const [compareModel,  setCompareModel]  = useState('gpt_5min_nonews');
  const [compareOn,     setCompareOn]     = useState(false);
  const [comparePredictions, setComparePredictions] = useState([]);
  const [evaluationRows, setEvaluationRows] = useState(() =>
    buildEvaluationRowsForModel('gpt_5min_news')
  );
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const evaluationCacheRef = useRef(new Map());

  // ── Firestore data ────────────────────────────────────────────────────────
  const [sessionMeta, setSessionMeta] = useState(null);
  const [modelMeta,   setModelMeta]   = useState(null);
  const [intervals, setIntervals] = useState([]);   // sorted by videoSeconds
  const [loading, setLoading] = useState(true);

  // ── Active interval (driven by video or timeline) ─────────────────────────
  const [activeInterval, setActiveInterval] = useState(null);

  // ── Video / timeline state ────────────────────────────────────────────────
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [, setYtReady] = useState(false);
  const [ytError, setYtError] = useState(false);
  const ytPlayerRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // ── Mobile tab (bottom row) ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('transcript');

  // ── Auto-play mode ────────────────────────────────────────────────────────
  const [autoPlay, setAutoPlay] = useState(false);
  const isAutoPlayingRef = useRef(false); // ref-mirror so YT sync closure can read it
  useEffect(() => { isAutoPlayingRef.current = autoPlay; }, [autoPlay]);

  // ── Chart hover ───────────────────────────────────────────────────────────
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState(null);
  const chartSvgRef = useRef(null);

  // ── Timeline scrubber ─────────────────────────────────────────────────────
  const timelineRef = useRef(null);
  const transcriptRef = useRef(null);

  // Waveform heights (stable)
  const waveformHeights = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const base = 6 + Math.sin(i * 0.9) * 5 + Math.sin(i * 0.3) * 4;
        const noise = ((i * 2654435761) >>> 0) % 10;
        return Math.max(2, base + noise * 0.6);
      }),
    []
  );

  // ── Load model-specific evaluation table (all sessions) ─────────────────────
  useEffect(() => {
    let cancelled = false;

    const cached = evaluationCacheRef.current.get(selectedModel);
    if (cached) {
      setEvaluationRows(cached);
      setEvaluationLoading(false);
      return () => { cancelled = true; };
    }

    if (selectedModel === 'gpt_5min_news') {
      const rows = buildEvaluationRowsForModel(selectedModel);
      evaluationCacheRef.current.set(selectedModel, rows);
      setEvaluationRows(rows);
      setEvaluationLoading(false);
      return () => { cancelled = true; };
    }

    setEvaluationLoading(true);

    async function load() {
      const pairs = await Promise.all(
        FOMC_DATES.map(async (s) => {
          try {
            const bundle = await loadSessionBundleFromPublicApi(s.date, selectedModel);
            return [s.date, bundle];
          } catch (err) {
            console.warn(`Evaluation fallback failed for ${selectedModel} @ ${s.date}:`, err);
            return [s.date, null];
          }
        })
      );
      if (cancelled) return;
      const byDate = new Map(pairs);
      const rows = buildEvaluationRowsForModel(selectedModel, byDate);
      evaluationCacheRef.current.set(selectedModel, rows);
      setEvaluationRows(rows);
      setEvaluationLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [selectedModel]);

  // ── Load Firestore data when date or model changes ────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIntervals([]);
    setSessionMeta(null);
    setModelMeta(null);
    setActiveInterval(null);
    setVideoSeconds(0);
    setComparePredictions([]);

    async function load() {
      const date = selectedSession.date;
      let fsSessionMeta = null;
      let fsModelMeta = null;
      let fsIntervals = [];
      let fsFailed = false;

      try {
        const sessionSnap = await getDoc(doc(db, 'fomc_sessions', date));
        if (sessionSnap.exists()) fsSessionMeta = sessionSnap.data();
      } catch (err) {
        fsFailed = true;
        console.warn('Session meta read failed:', err);
      }

      if (selectedModel !== 'gpt_5min_news') {
        try {
          const mSnap = await getDoc(doc(db, 'fomc_sessions', date, 'models', selectedModel));
          if (mSnap.exists()) fsModelMeta = mSnap.data();
        } catch (err) {
          fsFailed = true;
          // Do not block interval data if model summary doc is not publicly readable.
          console.warn(`Model meta read failed for ${selectedModel}:`, err);
        }
      }

      try {
        fsIntervals = await loadIntervalsFromFirestore(db, date, selectedModel);
      } catch (err) {
        fsFailed = true;
        console.error(`Intervals read failed for ${selectedModel} @ ${date}:`, err);
      }

      if (cancelled) return;

      const needsFallback =
        fsFailed || (!fsIntervals.length && selectedModel !== 'gpt_5min_news');

      if (needsFallback) {
        try {
          const fallback = await loadSessionBundleFromPublicApi(date, selectedModel);
          if (cancelled) return;
          setSessionMeta(fallback.sessionMeta || fsSessionMeta);
          setModelMeta(fallback.modelMeta || fsModelMeta);
          setIntervals(Array.isArray(fallback.intervals) ? fallback.intervals : []);
          if (Array.isArray(fallback.intervals) && fallback.intervals.length) {
            setActiveInterval(fallback.intervals[0]);
          }
          setLoading(false);
          return;
        } catch (err) {
          console.error(`Public fallback failed for ${selectedModel} @ ${date}:`, err);
        }
      }

      setSessionMeta(fsSessionMeta);
      setModelMeta(fsModelMeta);
      setIntervals(fsIntervals);
      if (fsIntervals.length) setActiveInterval(fsIntervals[0]);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateId, selectedModel]);

  // ── Load compare predictions ───────────────────────────────────────────────
  useEffect(() => {
    if (!compareOn) { setComparePredictions([]); return; }
    let cancelled = false;
    async function loadCompare() {
      try {
        const docs = await loadIntervalsFromFirestore(db, selectedSession.date, compareModel);
        if (!cancelled) setComparePredictions(docs);
      } catch (err) {
        console.error('Compare load (Firestore) error:', err);
        try {
          const fallback = await loadSessionBundleFromPublicApi(selectedSession.date, compareModel);
          if (!cancelled) {
            setComparePredictions(Array.isArray(fallback.intervals) ? fallback.intervals : []);
          }
        } catch (fallbackErr) {
          console.error('Compare load (public fallback) error:', fallbackErr);
          if (!cancelled) setComparePredictions([]);
        }
      }
    }
    loadCompare();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareOn, compareModel, selectedDateId, selectedModel]);

  // ── Find active interval from videoSeconds ────────────────────────────────
  useEffect(() => {
    if (!intervals.length) return;
    // Find the interval whose window contains current videoSeconds
    const found = [...intervals]
      .reverse()
      .find((iv) => videoSeconds >= iv.videoSeconds);
    if (found) setActiveInterval(found);
  }, [videoSeconds, intervals]);

  // ── Auto-scroll transcript within its container only (never scroll the page) ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!transcriptRef.current || !activeInterval) return;
    const container = transcriptRef.current;
    const items = container.querySelectorAll('.fomc-tr-item');
    const idx = intervals.findIndex((iv) => iv.id === activeInterval.id);
    const item = items[idx];
    if (!item) return;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    // Only scroll if item is outside the visible area of the container
    if (itemTop < containerTop || itemBottom > containerBottom) {
      container.scrollTo({ top: itemTop - container.clientHeight / 3, behavior: 'smooth' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInterval]);

  // ── YouTube IFrame API integration ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setYtError(false);
    setYtReady(false);
    if (!selectedSession.videoId || selectedSession.videoId.startsWith('REPLACE')) return;

    // Load YT IFrame API script once
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    function createPlayer() {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
      setYtReady(false);
      setYtError(false);

      ytPlayerRef.current = new window.YT.Player('yt-player', {
        videoId: selectedSession.videoId,
        playerVars: { rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onReady: () => {
            setYtReady(true);
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = setInterval(() => {
              if (ytPlayerRef.current?.getCurrentTime && !isAutoPlayingRef.current) {
                setVideoSeconds(Math.floor(ytPlayerRef.current.getCurrentTime()));
              }
            }, 500);
          },
          onStateChange: (e) => {
            if (e.data === 0) clearInterval(syncIntervalRef.current);
          },
          // Error codes: 2=invalid ID, 5=HTML5 error, 100=not found, 101/150=embedding not allowed
          onError: () => {
            clearInterval(syncIntervalRef.current);
            setYtError(true);
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      clearInterval(syncIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateId]);

  // ── Auto-play: advance one interval every 750ms ──────────────────────────
  useEffect(() => {
    if (!autoPlay || !intervals.length) return;

    // Local index — each effect invocation owns its own counter (fixes StrictMode double-run)
    const startIdx = intervals.findIndex((iv) => iv.id === activeInterval?.id);
    let idx = startIdx >= 0 ? startIdx : 0;
    const ivs = intervals;

    const id = setInterval(() => {
      idx += 1;
      if (idx >= ivs.length) {
        setAutoPlay(false);
        return;
      }
      const secs = ivs[idx].videoSeconds;
      setVideoSeconds(secs);
      if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(secs, true);
    }, 750);

    return () => clearInterval(id);
  }, [autoPlay, intervals]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop auto when date changes
  useEffect(() => { setAutoPlay(false); }, [selectedDateId]);

  // Manual seek — always stops auto
  const manualSeek = useCallback((secs) => {
    setAutoPlay(false);
    setVideoSeconds(secs);
    if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(secs, true);
  }, []);

  // ── Timeline interaction ───────────────────────────────────────────────────
  const totalDuration = intervals.length
    ? intervals[intervals.length - 1].videoSeconds + 60
    : 3000; // ~50 min fallback

  const timelinePos = totalDuration > 0 ? (videoSeconds / totalDuration) * 100 : 0;

  const handleTimelineInteract = useCallback((e) => {
    const el = e.currentTarget || timelineRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX == null) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const newSecs = Math.floor((pct / 100) * totalDuration);
    manualSeek(newSecs);
  }, [totalDuration, manualSeek]);

  const handleTimelineMouseMove = useCallback(
    (e) => { if (e.buttons === 1) handleTimelineInteract(e); },
    [handleTimelineInteract]
  );

  // Timeline label
  const tlTotalSecs = videoSeconds;
  const tlMin = Math.floor(tlTotalSecs / 60);
  const tlSec = String(tlTotalSecs % 60).padStart(2, '0');
  const tlLabel = `${tlMin}:${tlSec}`;

  // Duration label
  const durMin = Math.floor(totalDuration / 60);
  const durSec = String(totalDuration % 60).padStart(2, '0');

  // ── Portfolio simulation (100 shares, strategy: buy open, flip on signal) ──
  const PORTFOLIO_SHARES = 100;
  const PORTFOLIO_START  = 10000; // $100 × 100 shares baseline

  const portfolioHistory = useMemo(() => {
    if (!intervals.length) return [];
    let balance = PORTFOLIO_START;
    let pos = 'FLAT'; // FLAT | LONG | SHORT
    const history = [];
    intervals.forEach((iv, i) => {
      const isFirst = i === 0;
      const isLast  = i === intervals.length - 1;
      const signal  = iv.horizons?.h0?.reaction?.toLowerCase(); // 'positive'|'negative'
      const actual  = iv.actualChange || 0;

      // Decide position
      if (isFirst) {
        pos = 'LONG';
      } else if (isLast) {
        pos = 'FLAT';
      } else if (signal === 'positive') {
        pos = pos === 'SHORT' ? 'LONG' : (pos === 'FLAT' ? 'LONG' : pos);
      } else if (signal === 'negative') {
        pos = pos === 'LONG' ? 'SHORT' : (pos === 'FLAT' ? 'SHORT' : pos);
      }

      // P&L this minute
      let intervalPnl = 0;
      if (pos === 'LONG')  intervalPnl = actual * PORTFOLIO_SHARES;
      if (pos === 'SHORT') intervalPnl = -actual * PORTFOLIO_SHARES;
      balance += intervalPnl;

      history.push({
        id: iv.id,
        videoSeconds: iv.videoSeconds,
        balance,
        intervalPnl,
        position: pos,
        signal,
        actual,
        correct: iv.horizons?.h0?.correctDirection,
      });
    });
    return history;
  }, [intervals]);

  // Portfolio state up to current video position
  const portfolioNow = useMemo(() => {
    if (!portfolioHistory.length) return null;
    const visible = portfolioHistory.filter((h) => h.videoSeconds <= videoSeconds);
    return visible.length ? visible[visible.length - 1] : portfolioHistory[0];
  }, [portfolioHistory, videoSeconds]);

  const portfolioFinal = portfolioHistory.length
    ? portfolioHistory[portfolioHistory.length - 1]
    : null;

  const portfolioVisibleCount = portfolioHistory.filter((h) => h.videoSeconds <= videoSeconds).length;

  // SVG equity curve
  const EQUITY_W = 1200;
  const EQUITY_H = 52;
  const equityCurveD = useMemo(() => {
    if (portfolioHistory.length < 2) return '';
    const vals = portfolioHistory.map((h) => h.balance);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const range = hi - lo || 1;
    const xStep = EQUITY_W / (portfolioHistory.length - 1);
    return portfolioHistory
      .map((h, i) => {
        const x = (i * xStep).toFixed(1);
        const y = (EQUITY_H - 4 - ((h.balance - lo) / range) * (EQUITY_H - 8)).toFixed(1);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [portfolioHistory]);

  // ── Chart data from intervals ─────────────────────────────────────────────
  // Build a cumulative price series from actualChange per interval.
  // Start from a baseline of 100 (percentage-based since we don't have raw price).
  const chartCandles = useMemo(() => {
    if (!intervals.length) return [];
    let price = 100;
    return intervals.map((iv) => {
      const open = price;
      const change = iv.actualChange || 0;
      const close = open + change;
      // Estimate high/low from volatility
      const vol = (iv.volatility || Math.abs(change) * 0.5) * 100;
      const high = Math.max(open, close) + vol * 0.3;
      const low = Math.min(open, close) - vol * 0.3;
      price = close;
      return { t: iv.id, o: open, h: high, l: low, c: close, videoSeconds: iv.videoSeconds };
    });
  }, [intervals]);

  // X geometry — stable, based on total candle count (positions never shift)
  const { slotW, bodyW, candleX } = useMemo(() => {
    if (!chartCandles.length) return {};
    const sW = (CW - PAD_L - PAD_R) / chartCandles.length;
    const bW = Math.max(Math.min(sW * 0.30, 5), 1.5);
    const cX = (i) => PAD_L + i * sW + sW / 2;
    return { slotW: sW, bodyW: bW, candleX: cX };
  }, [chartCandles]);

  // Active candle index + visible count — must be before Y geometry
  const activeCandle = intervals.findIndex((iv) => iv.id === activeInterval?.id);
  const visibleCount = activeCandle >= 0 ? activeCandle + 1 : chartCandles.length;

  // Y geometry — dynamic, only from visible candles so scale auto-adjusts each minute
  const { priceMin, priceMax, priceY } = useMemo(() => {
    const visible = chartCandles.slice(0, Math.max(1, visibleCount));
    if (!visible.length) return {};
    const allPrices = visible.flatMap((c) => [c.h, c.l]);
    const lo = Math.min(...allPrices);
    const hi = Math.max(...allPrices);
    const pad = Math.max((hi - lo) * 0.12, 0.5); // 12% breathing room
    const pMin = lo - pad;
    const pMax = hi + pad;
    const pY = (p) => PAD_T + ((pMax - p) / (pMax - pMin)) * (CH - PAD_T - PAD_B);
    return { priceMin: pMin, priceMax: pMax, priceY: pY };
  }, [chartCandles, visibleCount]);

  // AI prediction path for h0 (same-minute nowcast) — clipped to visibleCount
  const { aiMidD, aiBandD, ai1MidD } = useMemo(() => {
    if (!chartCandles.length || !priceY) return {};
    const vc = visibleCount;

    // h0 — nowcast mid line
    const h0pts = intervals.slice(0, vc)
      .map((iv, i) => iv.horizons?.h0?.change != null
        ? { x: candleX(i), y: priceY(chartCandles[i].o + (iv.horizons.h0.change || 0)) }
        : null)
      .filter(Boolean);

    const midD = h0pts.length
      ? h0pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      : '';

    // confidence band
    const bandPts = intervals.slice(0, vc)
      .map((iv, i) => {
        if (iv.horizons?.h0?.change == null) return null;
        const mid = chartCandles[i].o + (iv.horizons.h0.change || 0);
        const err = iv.horizons.h0.absError || 0.3;
        return { x: candleX(i), hi: priceY(mid + err), lo: priceY(mid - err) };
      })
      .filter(Boolean);

    const bandD = bandPts.length
      ? [
          bandPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.hi.toFixed(1)}`).join(' '),
          bandPts.slice().reverse().map((p) => `L${p.x.toFixed(1)},${p.lo.toFixed(1)}`).join(' '),
          'Z',
        ].join(' ')
      : '';

    // h1 — 1-min ahead forecast
    const h1pts = intervals.slice(0, vc)
      .map((iv, i) => iv.horizons?.h1?.change != null
        ? { x: candleX(i), y: priceY(chartCandles[i].o + (iv.horizons.h1.change || 0)) }
        : null)
      .filter(Boolean);

    const ai1D = h1pts.length
      ? h1pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      : '';

    return { aiMidD: midD, aiBandD: bandD, ai1MidD: ai1D };
  }, [intervals, chartCandles, candleX, priceY, visibleCount]);

  // Active model config
  const activeModelCfg  = MODELS.find(m => m.key === selectedModel)  || MODELS[0];
  const compareModelCfg = MODELS.find(m => m.key === compareModel)   || MODELS[1];
  const displayMeta     = modelMeta || sessionMeta;

  // Compare overlay path — matches compare predictions to primary candle X positions
  const compareAiMidD = useMemo(() => {
    if (!compareOn || !comparePredictions.length || !priceY || !candleX || !chartCandles.length) return '';
    const pts = intervals.slice(0, visibleCount).map((iv, i) => {
      const cp = comparePredictions.reduce((best, c) =>
        Math.abs(c.videoSeconds - iv.videoSeconds) < Math.abs(best.videoSeconds - iv.videoSeconds) ? c : best
      , comparePredictions[0]);
      if (!cp || cp.horizons?.h0?.change == null) return null;
      return { x: candleX(i), y: priceY(chartCandles[i].o + (cp.horizons.h0.change || 0)) };
    }).filter(Boolean);
    return pts.length
      ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      : '';
  }, [compareOn, comparePredictions, intervals, chartCandles, candleX, priceY, visibleCount]);

  // Chart animation key — changes when date changes to re-trigger entry animations
  const chartKey = selectedDateId;

  // Price grid lines
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gridLines = useMemo(() => {
    if (!priceMin || !priceMax || !priceY) return [];
    const range = priceMax - priceMin;
    const step = range > 10 ? 2 : range > 4 ? 1 : 0.5;
    const lines = [];
    for (let p = Math.ceil(priceMin / step) * step; p <= priceMax; p += step) {
      lines.push(p);
    }
    return lines;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMin, priceMax]);

  // ── Chart mouse ────────────────────────────────────────────────────────────
  const handleChartMouseMove = useCallback((e) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * CW;
    const svgY = ((e.clientY - rect.top) / rect.height) * CH;
    setCrosshair({ x: svgX, y: svgY });
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  // ── Chart SVG ──────────────────────────────────────────────────────────────
  const chartSvg = (
    <div className="fomc-chart-wrap">
      {loading ? (
        <div className="fomc-chart-loading">Loading chart data…</div>
      ) : (
        <svg
          key={chartKey}
          ref={chartSvgRef}
          className="fomc-chart-svg"
          viewBox={`0 0 ${CW} ${CH}`}
          preserveAspectRatio="none"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => { setCrosshair(null); setHoveredCandle(null); }}
          style={{ cursor: 'crosshair' }}
        >
          <defs>
            <radialGradient id="chartBg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(20,30,45,0.5)" />
              <stop offset="100%" stopColor="rgba(8,12,20,0)" />
            </radialGradient>
            <filter id="glowDot" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={PAD_L} y={PAD_T} width={CW - PAD_L - PAD_R} height={CH - PAD_T - PAD_B} fill="url(#chartBg)" />

          {/* Grid lines */}
          {gridLines.map((p) => (
            <g key={p}>
              <line x1={PAD_L} y1={priceY(p)} x2={CW - PAD_R} y2={priceY(p)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4,6" />
              <text x={CW - PAD_R + 4} y={priceY(p) + 3.5} fill="rgba(255,255,255,0.28)" fontSize="9" dominantBaseline="middle">
                {p.toFixed(1)}
              </text>
            </g>
          ))}

          {/* FOMC event marker — first interval */}
          {chartCandles.length > 0 && (
            <>
              <line x1={candleX(0)} y1={PAD_T} x2={candleX(0)} y2={CH - PAD_B}
                stroke="rgba(220,80,80,0.35)" strokeWidth="1" strokeDasharray="3,4" />
              <rect x={candleX(0) + 3} y={PAD_T + 2} width={52} height={13} rx="2"
                fill="rgba(220,60,60,0.18)" stroke="rgba(220,80,80,0.35)" strokeWidth="0.5" />
              <text x={candleX(0) + 7} y={PAD_T + 11} fill="rgba(220,100,100,0.85)" fontSize="8" fontWeight="600" letterSpacing="0.4">
                FOMC {selectedSession.label}
              </text>
            </>
          )}

          {/* AI confidence band — fades in */}
          {aiBandD && <path d={aiBandD} fill="rgba(155,140,255,0.06)" className="fomc-band-fade" />}

          {/* h0 nowcast line — draws left to right */}
          {aiMidD && <path d={aiMidD} fill="none" stroke={activeModelCfg.color} strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round" className="fomc-ai-draw" />}

          {/* Compare model overlay — dashed */}
          {compareAiMidD && <path d={compareAiMidD} fill="none" stroke={compareModelCfg.color} strokeWidth="1.2"
            strokeDasharray="5,3" strokeLinejoin="round" strokeLinecap="round" className="fomc-ai-draw" />}

          {/* h1 forecast line — draws left to right, slightly delayed */}
          {ai1MidD && <path d={ai1MidD} fill="none" stroke="rgba(100,200,255,0.7)" strokeWidth="1.2"
            strokeLinejoin="round" strokeLinecap="round" className="fomc-ai-draw fomc-ai-draw-h1" />}

          {/* Candles — progressive reveal, newest flashes in */}
          {chartCandles.slice(0, visibleCount).map((c, i) => {
            const x = candleX(i);
            const bull = c.c >= c.o;
            const col = bull ? '#3fb68b' : '#e05d5d';
            const top = priceY(Math.max(c.o, c.c));
            const bot = priceY(Math.min(c.o, c.c));
            const bh = Math.max(bot - top, 1);
            const isHovered = hoveredCandle === i;
            const isActive = i === activeCandle;
            const isNewest = i === visibleCount - 1 && activeCandle >= 0;
            return (
              <g key={i}
                onMouseEnter={() => setHoveredCandle(i)}
                onMouseLeave={() => setHoveredCandle(null)}
                className={isNewest ? 'fomc-candle-new' : 'fomc-candle-old'}
              >
                {/* Active highlight column */}
                {isActive && (
                  <rect
                    x={x - slotW / 2} y={PAD_T}
                    width={slotW} height={CH - PAD_T - PAD_B}
                    fill="rgba(255,255,255,0.04)"
                    className="fomc-active-col"
                  />
                )}
                {/* Wick */}
                <line
                  x1={x} y1={priceY(c.h)} x2={x} y2={priceY(c.l)}
                  stroke={col} strokeWidth="1"
                  opacity={isHovered || isActive ? 1 : 0.75}
                  className={isNewest ? 'fomc-candle-wick fomc-candle-wick-new' : 'fomc-candle-wick'}
                />
                {/* Body */}
                <rect
                  x={x - bodyW / 2} y={top} width={bodyW} height={bh}
                  fill={col} opacity={isHovered || isActive ? 1 : 0.8}
                  className={isNewest ? 'fomc-candle-body fomc-candle-body-new' : 'fomc-candle-body'}
                  style={{ transformOrigin: `${x}px ${bot}px` }}
                />
                {/* Active candle pulse ring */}
                {isActive && (
                  <rect
                    x={x - bodyW / 2 - 2} y={top - 2}
                    width={bodyW + 4} height={bh + 4}
                    fill="none" stroke={col} strokeWidth="1"
                    className="fomc-candle-pulse"
                    rx="1"
                  />
                )}
              </g>
            );
          })}

          {/* Active interval vertical scan line */}
          {activeCandle >= 0 && candleX && (
            <line
              x1={candleX(activeCandle)} y1={PAD_T}
              x2={candleX(activeCandle)} y2={CH - PAD_B}
              stroke="rgba(255,255,255,0.25)" strokeWidth="1"
              strokeDasharray="3,3"
              pointerEvents="none"
              className="fomc-scan-line"
            />
          )}

          {/* Time axis labels */}
          {chartCandles.map((c, i) => i % Math.max(1, Math.floor(chartCandles.length / 8)) !== 0 ? null : (
            <text key={c.t} x={candleX(i)} y={CH - 6} fill="rgba(255,255,255,0.22)" fontSize="8" textAnchor="middle">
              {c.t}
            </text>
          ))}

          {/* Crosshair */}
          {crosshair && (
            <g pointerEvents="none">
              <line x1={crosshair.x} y1={PAD_T} x2={crosshair.x} y2={CH - PAD_B} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1={PAD_L} y1={crosshair.y} x2={CW - PAD_R} y2={crosshair.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            </g>
          )}
        </svg>
      )}

      {/* Candle tooltip */}
      {hoveredCandle !== null && chartCandles[hoveredCandle] && (() => {
        const c = chartCandles[hoveredCandle];
        const bull = c.c >= c.o;
        return (
          <div className="fomc-tooltip" style={{ position: 'fixed', left: tooltipPos.x + 14, top: tooltipPos.y - 90 }}>
            <div className="fomc-tt-time">{c.t}</div>
            {[['O', c.o.toFixed(2), ''], ['H', c.h.toFixed(2), 'green'], ['L', c.l.toFixed(2), 'red'], ['C', c.c.toFixed(2), bull ? 'green' : 'red']].map(([lbl, val, cls]) => (
              <div key={lbl} className="fomc-tt-row">
                <span className="fomc-tt-lbl">{lbl}</span>
                <span className={cls ? `fomc-tt-${cls}` : ''}>{val}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );

  // ── Active interval data for panels ───────────────────────────────────────
  const activeNews = activeInterval?.news || [];
  const activeH0 = activeInterval?.horizons?.h0 || null;
  const activeH1 = activeInterval?.horizons?.h1 || null;

  // Key drivers — top 3 meaningful sentences extracted from reasoning
  const drivers = useMemo(() => {
    if (!activeH0?.reasoning) return [];
    return activeH0.reasoning
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && s.length < 180)
      .slice(0, 3);
  }, [activeH0]);

  // Sentiment position (0–100) derived from h0 predicted change
  const sentimentPct = activeH0?.change != null
    ? Math.max(0, Math.min(100, 50 + (activeH0.change / 0.6) * 50))
    : 50;

  // Confidence from inverse of absError
  const confidence = activeH0?.absError != null
    ? Math.max(10, Math.min(99, Math.round((1 - Math.min(activeH0.absError, 1)) * 100)))
    : null;

  // Extract key phrases from reasoning (simple heuristic — split sentences, tag hawkish/dovish words)
  const keyPhrases = useMemo(() => {
    if (!activeH0?.reasoning) return [];
    const hawkish = ['rate hike', 'tightening', 'inflation', 'restrictive', 'above target', 'ongoing increases'];
    const dovish = ['pause', 'data-dependent', 'cut', 'accommodative', 'below target', 'meeting by meeting'];
    const text = activeH0.reasoning.toLowerCase();
    const phrases = [];
    hawkish.forEach((kw) => { if (text.includes(kw)) phrases.push({ type: 'HAWKISH', cls: 'hawk', text: `"${kw}"` }); });
    dovish.forEach((kw) => { if (text.includes(kw)) phrases.push({ type: 'DOVISH', cls: 'dove', text: `"${kw}"` }); });
    return phrases.slice(0, 4);
  }, [activeH0]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fomc-db" onClickCapture={(e) => {
      if (autoPlay && !e.target.closest('.fomc-auto-btn')) setAutoPlay(false);
    }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="fomc-hero">
        <div className="fomc-hero-left">
          <span className="fomc-hero-eyebrow">FEDERAL RESERVE · REAL-TIME INTELLIGENCE</span>
          <h1 className="fomc-hero-title">FOMC Intelligence Dashboard</h1>
        </div>
        <div className="fomc-hero-stats">
          <div className="fomc-stat">
            <div className="fomc-stat-lbl">Sessions</div>
            <div className="fomc-stat-val">{FOMC_DATES.length}</div>
          </div>
          <div className="fomc-stat">
            <div className="fomc-stat-lbl">AI Accuracy</div>
            <div className="fomc-stat-val fomc-val-blue">
              {displayMeta?.accuracyPct != null ? `${displayMeta.accuracyPct.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="fomc-stat">
            <div className="fomc-stat-lbl">Intervals</div>
            <div className="fomc-stat-val">{intervals.length || '—'}</div>
          </div>
          <div className="fomc-stat">
            <div className="fomc-stat-lbl">Rate Decision</div>
            <div className={`fomc-stat-val ${selectedSession.rate.startsWith('-') ? 'fomc-val-red' : ''}`}>
              {selectedSession.rate.split('→')[0].trim()}
            </div>
          </div>
        </div>
      </div>

      {/* ── DATE SELECTOR ─────────────────────────────────────────────────── */}
      <div className="fomc-date-bar">
        <span className="fomc-date-label">FOMC Conference Date</span>
        <div className="fomc-date-pills">
          {FOMC_DATES.map((d) => (
            <button
              key={d.id}
              className={`fomc-date-pill${selectedDateId === d.id ? ' active' : ''}`}
              onClick={() => setSelectedDateId(d.id)}
            >
              <span className="fomc-date-pill-date">{d.label}</span>
              <span className="fomc-date-pill-year">{d.year}</span>
            </button>
          ))}
        </div>
        <span className="fomc-date-rate">{selectedSession.rate}</span>
        <button
          className={`fomc-auto-btn${autoPlay ? ' active' : ''}`}
          onClick={() => setAutoPlay((v) => !v)}
          title="Auto-advance through intervals at 0.75s each"
        >
          {autoPlay ? '■ STOP' : '▶ AUTO'}
        </button>
      </div>

      {/* ── MODEL SELECTOR ────────────────────────────────────────────────── */}
      <div className="fomc-model-bar">
        <span className="fomc-model-label">MODEL</span>
        <div className="fomc-model-pills">
          {MODELS.map(m => (
            <button
              key={m.key}
              className={`fomc-model-pill${selectedModel === m.key ? ' active' : ''}`}
              style={selectedModel === m.key ? { borderColor: m.color, color: m.color } : {}}
              onClick={() => { setSelectedModel(m.key); setCompareOn(false); }}
            >
              <span className="fomc-model-pill-name">{m.label}</span>
              <span className="fomc-model-pill-sub">{m.sub}</span>
            </button>
          ))}
        </div>
        <div className="fomc-compare-ctrl">
          <button
            className={`fomc-compare-toggle${compareOn ? ' on' : ''}`}
            onClick={() => setCompareOn(v => !v)}
          >
            {compareOn ? '◈ Compare ON' : '◇ Compare'}
          </button>
          {compareOn && (
            <select
              className="fomc-compare-select"
              value={compareModel}
              onChange={e => setCompareModel(e.target.value)}
            >
              {MODELS.filter(m => m.key !== selectedModel).map(m => (
                <option key={m.key} value={m.key}>{m.label} {m.sub}</option>
              ))}
            </select>
          )}
          {compareOn && (
            <span className="fomc-compare-legend">
              <span style={{ color: activeModelCfg.color }}>— {activeModelCfg.sub}</span>
              <span style={{ color: compareModelCfg.color, marginLeft: 10 }}>-- {compareModelCfg.sub}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── ROW 2: Portfolio Trading Desk + Timeline ──────────────────────── */}
      <div className="fomc-panel fomc-tl-panel fomc-portfolio-panel">

        {/* ── Top bar: balance + stats ────────────────────────────────────── */}
        <div className="fomc-port-topbar">
          <div className="fomc-port-left">
            <span className="fomc-panel-ttl">TRADING DESK · {selectedSession.label} {selectedSession.year}</span>
            <span className="fomc-port-sub">100 shares SPY · Paper trading · Buys open, flips on signal</span>
          </div>
          <div className="fomc-port-stats">
            {/* Current balance */}
            <div className="fomc-port-stat fomc-port-balance">
              <span className="fomc-port-stat-lbl">PORTFOLIO VALUE</span>
              <span className={`fomc-port-stat-val fomc-port-big ${portfolioNow && portfolioNow.balance >= PORTFOLIO_START ? 'fomc-port-green' : 'fomc-port-red'}`}>
                ${portfolioNow ? portfolioNow.balance.toFixed(2) : PORTFOLIO_START.toFixed(2)}
              </span>
            </div>
            {/* Total P&L */}
            <div className="fomc-port-stat">
              <span className="fomc-port-stat-lbl">TOTAL P&amp;L</span>
              <span className={`fomc-port-stat-val ${portfolioNow && portfolioNow.balance - PORTFOLIO_START >= 0 ? 'fomc-port-green' : 'fomc-port-red'}`}>
                {portfolioNow
                  ? `${portfolioNow.balance - PORTFOLIO_START >= 0 ? '+' : ''}$${(portfolioNow.balance - PORTFOLIO_START).toFixed(2)}`
                  : '$0.00'}
              </span>
            </div>
            {/* This minute */}
            <div className="fomc-port-stat">
              <span className="fomc-port-stat-lbl">THIS MINUTE</span>
              <span className={`fomc-port-stat-val ${portfolioNow && portfolioNow.intervalPnl >= 0 ? 'fomc-port-green' : 'fomc-port-red'}`}>
                {portfolioNow
                  ? `${portfolioNow.intervalPnl >= 0 ? '+' : ''}$${portfolioNow.intervalPnl.toFixed(2)}`
                  : '—'}
              </span>
            </div>
            {/* Position */}
            <div className="fomc-port-stat">
              <span className="fomc-port-stat-lbl">POSITION</span>
              <span className={`fomc-port-stat-val fomc-port-pos fomc-port-pos-${(portfolioNow?.position || 'FLAT').toLowerCase()}`}>
                {portfolioNow?.position === 'LONG'  ? '▲ LONG'  :
                 portfolioNow?.position === 'SHORT' ? '▼ SHORT' : '■ FLAT'}
              </span>
            </div>
            {/* Session P&L */}
            <div className="fomc-port-stat">
              <span className="fomc-port-stat-lbl">SESSION FINAL</span>
              <span className={`fomc-port-stat-val ${portfolioFinal && portfolioFinal.balance - PORTFOLIO_START >= 0 ? 'fomc-port-green' : 'fomc-port-red'}`}>
                {portfolioFinal
                  ? `${portfolioFinal.balance - PORTFOLIO_START >= 0 ? '+' : ''}$${(portfolioFinal.balance - PORTFOLIO_START).toFixed(2)}`
                  : '—'}
              </span>
            </div>
            {/* AI accuracy */}
            {displayMeta && (
              <div className="fomc-port-stat">
                <span className="fomc-port-stat-lbl">AI ACCURACY</span>
                <span className="fomc-port-stat-val fomc-port-blue">
                  {displayMeta.accuracyPct?.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Equity curve SVG ────────────────────────────────────────────── */}
        <div className="fomc-port-curve-wrap">
          <svg
            className="fomc-port-curve-svg"
            viewBox={`0 0 ${EQUITY_W} ${EQUITY_H}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(63,182,139,0.25)" />
                <stop offset="100%" stopColor="rgba(63,182,139,0)" />
              </linearGradient>
              <linearGradient id="eqGradRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(224,93,93,0)" />
                <stop offset="100%" stopColor="rgba(224,93,93,0.25)" />
              </linearGradient>
            </defs>
            {/* Baseline */}
            <line
              x1="0" y1={EQUITY_H / 2} x2={EQUITY_W} y2={EQUITY_H / 2}
              stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="4,6"
            />
            {/* Clipped equity line up to current video position */}
            {equityCurveD && (
              <>
                <clipPath id="eqClip">
                  <rect
                    x="0" y="0"
                    width={portfolioHistory.length > 1
                      ? `${(portfolioVisibleCount / portfolioHistory.length) * EQUITY_W}`
                      : 0}
                    height={EQUITY_H}
                  />
                </clipPath>
                <path
                  d={equityCurveD}
                  fill="none"
                  stroke={portfolioNow && portfolioNow.balance >= PORTFOLIO_START
                    ? 'rgba(63,182,139,0.9)'
                    : 'rgba(224,93,93,0.9)'}
                  strokeWidth="1.5"
                  clipPath="url(#eqClip)"
                />
              </>
            )}
          </svg>
        </div>

        {/* ── Interval tick strip ──────────────────────────────────────────── */}
        <div className="fomc-tl-wrap">
          <div
            className="fomc-tl-track fomc-port-track"
            onClick={handleTimelineInteract}
            onMouseMove={handleTimelineMouseMove}
          >
            <div className="fomc-tl-zone-pre" style={{ width: '100%' }} />
            {portfolioHistory.map((h) => {
              const pct = (h.videoSeconds / totalDuration) * 100;
              const isActive = h.id === activeInterval?.id;
              const madeMoney = h.intervalPnl > 0;
              const lostMoney = h.intervalPnl < 0;
              const color = madeMoney
                ? 'rgba(63,182,139,0.75)'
                : lostMoney
                ? 'rgba(224,93,93,0.75)'
                : 'rgba(255,255,255,0.15)';
              const isFuture = h.videoSeconds > videoSeconds;
              return (
                <div
                  key={h.id}
                  title={`${h.intervalPnl >= 0 ? '+' : ''}$${h.intervalPnl.toFixed(2)} · ${h.position} · Signal: ${h.signal || '—'}`}
                  className={`fomc-tl-iv-mark fomc-port-mark${isActive ? ' active' : ''}${isFuture ? ' fomc-port-future' : ''}`}
                  style={{ left: `${pct}%`, background: isFuture ? 'rgba(255,255,255,0.08)' : color }}
                  onClick={(e) => { e.stopPropagation(); manualSeek(h.videoSeconds); }}
                />
              );
            })}
            {/* P&L label above active marker */}
            {portfolioNow && (
              <div
                className="fomc-port-pnl-bubble"
                style={{ left: `${(portfolioNow.videoSeconds / totalDuration) * 100}%` }}
              >
                {portfolioNow.intervalPnl >= 0 ? '+' : ''}${portfolioNow.intervalPnl.toFixed(2)}
              </div>
            )}
            <div className="fomc-slider" style={{ left: `${timelinePos}%` }}>
              <div className="fomc-sl-line" />
              <div className="fomc-sl-thumb" />
              <div className="fomc-sl-lbl">{tlLabel}</div>
            </div>
          </div>
          {/* Legend */}
          <div className="fomc-port-legend">
            <span className="fomc-port-leg fomc-port-leg-green">▲ Profit interval</span>
            <span className="fomc-port-leg fomc-port-leg-red">▼ Loss interval</span>
            <span className="fomc-port-leg fomc-port-leg-dim">· No position</span>
            <span className="fomc-port-leg fomc-port-leg-future">░ Not yet played</span>
          </div>
        </div>

      </div>

      {/* ── ROW 1: Video (50%) + Chart (50%) ─────────────────────────────── */}
      <div className="fomc-row1">

        {/* Video */}
        <div className="fomc-panel">
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">PRESS CONFERENCE FEED</span>
            <div className="fomc-live-badge"><span className="fomc-live-dot" /> LIVE</div>
          </div>
          <div className="fomc-video-body">
            {selectedSession.videoId && !selectedSession.videoId.startsWith('REPLACE') && !ytError ? (
              <div className="fomc-screen-outer">
                <div className="fomc-yt-wrap">
                  <div id="yt-player" />
                </div>
                {activeInterval && (() => {
                  const reaction = activeInterval.horizons?.h0?.reaction?.toLowerCase();
                  const isBull = reaction === 'positive';
                  const isBear = reaction === 'negative';
                  return (
                    <div className="fomc-nlp-stack">
                      <span className={`fomc-nlp-chip ${isBull ? 'fomc-nlp-chip-bull' : isBear ? 'fomc-nlp-chip-bear' : ''}`}>
                        {isBull ? '▲ BULLISH' : isBear ? '▼ BEARISH' : '● NEUTRAL'}
                      </span>
                      {confidence != null && (
                        <span className="fomc-nlp-chip">{confidence}% CONF</span>
                      )}
                      <span className="fomc-nlp-chip">{activeInterval.id}</span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="fomc-screen">
                {activeInterval && (() => {
                  const reaction = activeInterval.horizons?.h0?.reaction?.toLowerCase();
                  const isBull = reaction === 'positive';
                  const isBear = reaction === 'negative';
                  return (
                    <div className="fomc-nlp-stack">
                      <span className={`fomc-nlp-chip ${isBull ? 'fomc-nlp-chip-bull' : isBear ? 'fomc-nlp-chip-bear' : ''}`}>
                        {isBull ? '▲ BULLISH' : isBear ? '▼ BEARISH' : '● NEUTRAL'}
                      </span>
                      {confidence != null && (
                        <span className="fomc-nlp-chip">{confidence}% CONF</span>
                      )}
                    </div>
                  );
                })()}
                <div className="fomc-screen-inner">
                  <div className="fomc-screen-text">
                    <div className="fomc-screen-org">FEDERAL RESERVE</div>
                    <div className="fomc-screen-event">FOMC Press Conference</div>
                    <div className="fomc-screen-date">{selectedSession.label} {selectedSession.year}</div>
                  </div>
                  {ytError && (
                    <a
                      className="fomc-yt-link"
                      href={`https://www.youtube.com/watch?v=${selectedSession.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ▶ Watch on YouTube
                    </a>
                  )}
                </div>
                <div className="fomc-screen-lower">
                  <div className="fomc-screen-name">JEROME H. POWELL</div>
                  <div className="fomc-screen-role">Chair, Federal Reserve</div>
                </div>
              </div>
            )}
            <div className="fomc-waveform">
              {waveformHeights.map((h, i) => {
                const barSecs = (i / waveformHeights.length) * totalDuration;
                const played = barSecs <= videoSeconds;
                return (
                  <div
                    key={i}
                    className="fomc-wave-bar"
                    style={{
                      height: `${h}px`,
                      background: played ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.08)',
                    }}
                  />
                );
              })}
            </div>
            <div className="fomc-controls">
              {ytError && (
                <div className="fomc-manual-hint">Drag to sync panels with video →</div>
              )}
              <div className="fomc-prog-track"
                ref={timelineRef}
                onClick={handleTimelineInteract}
                onMouseMove={handleTimelineMouseMove}
              >
                <div className="fomc-prog-fill" style={{ width: `${timelinePos}%` }} />
                <div className="fomc-prog-thumb" style={{ left: `${timelinePos}%` }} />
              </div>
              <div className="fomc-time-lbl">{tlLabel} / {durMin}:{durSec}</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="fomc-panel fomc-chart-panel">
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">
              SPX · 1-MIN · {selectedSession.label.toUpperCase()} {selectedSession.year}
            </span>
            <div className="fomc-chart-hd-right">
              <div className="fomc-chart-legend-ai">
                <div className="fomc-ai-line-demo" style={{ background: activeModelCfg.color }} />
                <span style={{ color: activeModelCfg.color }}>{activeModelCfg.sub}</span>
              </div>
              {compareOn && compareAiMidD && (
                <div className="fomc-chart-legend-ai fomc-legend-h1">
                  <div className="fomc-ai-line-demo fomc-ai-line-dashed" style={{ background: compareModelCfg.color }} />
                  <span style={{ color: compareModelCfg.color }}>{compareModelCfg.sub}</span>
                </div>
              )}
              {selectedModel === 'gpt_5min_news' && ai1MidD && !compareOn && (
                <div className="fomc-chart-legend-ai fomc-legend-h1">
                  <div className="fomc-ai-line-demo fomc-ai-line-h1" /> H1
                </div>
              )}
            </div>
          </div>
          {chartSvg}
        </div>
      </div>

      {/* ── MOBILE TAB NAV (hidden on desktop) ───────────────────────────── */}
      <div className="fomc-mobile-tabs">
        {[
          { id: 'transcript', label: 'Transcript' },
          { id: 'news',       label: 'News' },
          { id: 'reasoning',  label: 'Reasoning' },
        ].map((t) => (
          <button
            key={t.id}
            className={`fomc-mtab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {/* ── ROW 3: Transcript + News + Reasoning ──────────────────────────── */}
      <div className="fomc-row3">

        {/* Transcript */}
        <div className={`fomc-panel fomc-tr-panel${activeTab === 'transcript' ? ' fomc-tab-active' : ''}`}>
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">SPEECH TRANSCRIPT</span>
            {activeInterval && (
              <span className="fomc-tr-ts">{activeInterval.id}</span>
            )}
          </div>
          <div className="fomc-tr-list" ref={transcriptRef}>
            {loading ? (
              <div className="fomc-loading-msg">Loading transcript…</div>
            ) : intervals.length === 0 ? (
              <div className="fomc-loading-msg">No data — run import script first</div>
            ) : (
              intervals.map((iv, i) => {
                const isActive = iv.id === activeInterval?.id;
                const h0 = iv.horizons?.h0;
                return (
                  <div
                    key={iv.id}
                    className={['fomc-tr-item', isActive ? 'active' : ''].filter(Boolean).join(' ')}
                    onClick={() => manualSeek(iv.videoSeconds)}
                  >
                    <div className="fomc-tr-meta">
                      <span className="fomc-tr-spk fomc-spk-powell">POWELL</span>
                      <span className="fomc-tr-time">{iv.id}</span>
                      {h0 && (
                        <span className={`fomc-tr-reaction ${h0.reaction?.toLowerCase() === 'positive' ? 'pos' : 'neg'}`}>
                          {h0.reaction} {h0.change != null ? `(${h0.change > 0 ? '+' : ''}${h0.change.toFixed(2)})` : ''}
                        </span>
                      )}
                    </div>
                    <p className="fomc-tr-text">{highlightText(iv.speech?.substring(0, 200) || '')}…</p>
                    {isActive && getSignalTags(iv.speech || '').length > 0 && (
                      <div className="fomc-sig-tags">
                        {getSignalTags(iv.speech || '').map((t) => (
                          <span key={t.label} className={`fomc-sig-tag fomc-st-${t.cls}`}>{t.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Market News */}
        <div className={`fomc-panel${activeTab === 'news' ? ' fomc-tab-active' : ''}`}>
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">MARKET NEWS</span>
            {activeInterval && <span className="fomc-tr-ts">{activeInterval.id}</span>}
          </div>
          <div className="fomc-news-list">
            {loading ? (
              <div className="fomc-loading-msg">Loading news…</div>
            ) : activeNews.length === 0 ? (
              <div className="fomc-loading-msg">No news for this interval</div>
            ) : (
              activeNews.slice(0, 5).map((n, i) => (
                <div key={i} className="fomc-news-item">
                  <div className="fomc-news-top">
                    <span className="fomc-news-tag">#{n.rank}</span>
                    <span className={`fomc-news-cat fomc-nc-${getNewsCategory(n.title).toLowerCase().replace(/\s+/g, '-')}`}>
                      {getNewsCategory(n.title)}
                    </span>
                    <span className="fomc-news-score">{(n.score * 100).toFixed(0)}%</span>
                    {getNewsProvider(n.url) && (
                      <span className="fomc-news-provider">{getNewsProvider(n.url)}</span>
                    )}
                    <span className="fomc-news-time">{n.date?.substring(0, 10)}</span>
                  </div>
                  <p className="fomc-news-hl">
                    {n.url ? <a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a> : n.title}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Model Reasoning */}
        <div className={`fomc-panel${activeTab === 'reasoning' ? ' fomc-tab-active' : ''}`}>
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">MODEL REASONING</span>
            {activeInterval && <span className="fomc-tr-ts">{activeInterval.id}</span>}
          </div>
          <div className="fomc-reason-body">

            {/* Prediction direction */}
            {(activeH0 || activeH1) && (
              <div className="fomc-reason-sec fomc-reason-sec-first">
                <div className="fomc-reason-sec-ttl">PREDICTION</div>
                <div className="fomc-pred-row">
                  {activeH0 && (
                    <div className={`fomc-pred-box ${activeH0.reaction?.toLowerCase()}`}>
                      <div className="fomc-pred-horizon">H0 NOWCAST</div>
                      <div className="fomc-pred-reaction-row">
                        <span className={`fomc-pred-dir ${activeH0.reaction?.toLowerCase()}`}>
                          {activeH0.reaction?.toLowerCase() === 'positive' ? '▲' : '▼'}
                        </span>
                        <span className="fomc-pred-reaction">{activeH0.reaction}</span>
                      </div>
                      <div className="fomc-pred-change">{activeH0.change != null ? `${activeH0.change > 0 ? '+' : ''}${activeH0.change.toFixed(2)}` : '—'}</div>
                      {activeH0.correctDirection != null && (
                        <div className={`fomc-pred-outcome ${activeH0.correctDirection ? 'correct' : 'wrong'}`}>
                          {activeH0.correctDirection ? '✓ Correct' : '✗ Wrong'}
                        </div>
                      )}
                    </div>
                  )}
                  {activeH1 && (
                    <div className={`fomc-pred-box ${activeH1.reaction?.toLowerCase()}`}>
                      <div className="fomc-pred-horizon">H1 FORECAST</div>
                      <div className="fomc-pred-reaction-row">
                        <span className={`fomc-pred-dir ${activeH1.reaction?.toLowerCase()}`}>
                          {activeH1.reaction?.toLowerCase() === 'positive' ? '▲' : '▼'}
                        </span>
                        <span className="fomc-pred-reaction">{activeH1.reaction}</span>
                      </div>
                      <div className="fomc-pred-change">{activeH1.change != null ? `${activeH1.change > 0 ? '+' : ''}${activeH1.change.toFixed(2)}` : '—'}</div>
                      {activeH1.correctDirection != null && (
                        <div className={`fomc-pred-outcome ${activeH1.correctDirection ? 'correct' : 'wrong'}`}>
                          {activeH1.correctDirection ? '✓ Correct' : '✗ Wrong'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sentiment + confidence */}
            {activeH0 && (
              <div className="fomc-reason-sec">
                <div className="fomc-reason-sec-ttl">SENTIMENT SCORE</div>
                <div className="fomc-sentiment-wrap">
                  <span className="fomc-sent-lbl">Bearish</span>
                  <div className="fomc-sent-track">
                    <div className="fomc-sent-thumb" style={{ left: `${sentimentPct}%` }} />
                  </div>
                  <span className="fomc-sent-lbl">Bullish</span>
                </div>
                {confidence != null && (
                  <div className="fomc-conf-row">
                    <span className="fomc-conf-lbl">Confidence</span>
                    <div className="fomc-conf-track">
                      <div className="fomc-conf-fill" style={{ width: `${confidence}%` }} />
                    </div>
                    <span className="fomc-conf-val">{confidence}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Key drivers */}
            {drivers.length > 0 && (
              <div className="fomc-reason-sec">
                <div className="fomc-reason-sec-ttl">KEY DRIVERS</div>
                <ul className="fomc-drivers-list">
                  {drivers.map((d, i) => (
                    <li key={i} className="fomc-driver-item">{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key signals */}
            {keyPhrases.length > 0 && (
              <div className="fomc-reason-sec">
                <div className="fomc-reason-sec-ttl">KEY SIGNALS</div>
                <div className="fomc-phrase-list">
                  {keyPhrases.map((p) => (
                    <div key={p.text} className={`fomc-phrase fomc-ph-${p.cls}`}>
                      <span className="fomc-ph-type">{p.type}</span>
                      <span className="fomc-ph-text">{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!activeH0 && !loading && (
              <div className="fomc-loading-msg">No reasoning for this interval</div>
            )}
          </div>
        </div>

      </div>

      {/* ── ROW 4: Historical Analogues ────────────────────────────────────── */}
      {activeInterval?.historical?.length > 0 && (
        <div className="fomc-panel fomc-historical-panel">
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">HISTORICAL ANALOGUES · RAG TOP-5</span>
            <span className="fomc-tl-accuracy">Most similar past FOMC moments</span>
          </div>
          <div className="fomc-hist-list">
            {activeInterval.historical.map((h, i) => (
              <div key={i} className="fomc-hist-item">
                <div className="fomc-hist-meta">
                  <span className="fomc-hist-date">{h.date}</span>
                  <span className="fomc-hist-score">Similarity: {(h.score * 100).toFixed(1)}%</span>
                  <span className={`fomc-hist-change ${h.actualChange >= 0 ? 'pos' : 'neg'}`}>
                    {h.actualChange >= 0 ? '+' : ''}{h.actualChange?.toFixed(3)}
                  </span>
                </div>
                <p className="fomc-hist-speech">{h.speech}…</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROW 5-6: Evaluation + API Access (70/30) ─────────────────────── */}
      <div className="fomc-dev-grid">
        <div className="fomc-panel fomc-ew-panel">
          <div className="fomc-panel-hd">
            <span className="fomc-panel-ttl">Model Evaluation — Per FOMC Session</span>
            <span className="fomc-tl-accuracy">Held-out test results per session. POS/NEG = predicted direction counts from h0 nowcast.</span>
          </div>
          <div className="fomc-ew-table-wrap">
            <table className="fomc-ew-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TEST DATE</th>
                  <th>RATE DECISION</th>
                  <th>INTERVALS</th>
                  <th>PRED POS</th>
                  <th>PRED NEG</th>
                  <th>DIRECTIONAL<br/>ACCURACY</th>
                  <th>MAE</th>
                  <th>MEAN<br/>SIGNED ERR</th>
                </tr>
              </thead>
              <tbody>
                {evaluationLoading ? (
                  <tr>
                    <td colSpan={9} className="fomc-loading-msg" style={{ textAlign: 'center', padding: '14px 10px' }}>
                      Loading model evaluation…
                    </td>
                  </tr>
                ) : evaluationRows.map((row) => {
                  const hasIntervals = row.totalIntervals != null;
                  const hasPos = row.pos != null;
                  const hasNeg = row.neg != null;
                  const hasAcc = row.accuracy != null;
                  const hasMae = row.mae != null;
                  const hasMse = row.mse != null;
                  const accColor = !hasAcc
                    ? 'rgba(255,255,255,0.45)'
                    : row.accuracy >= 65 ? '#3fb68b' : row.accuracy >= 55 ? '#e8c34a' : '#e05d5d';
                  const mseColor = !hasMse
                    ? 'rgba(255,255,255,0.45)'
                    : row.mse >= 0 ? '#3fb68b' : '#e05d5d';
                  return (
                    <tr key={row.testDate}>
                      <td className="fomc-ew-num">{row.num}</td>
                      <td className="fomc-ew-date">{row.testDate}</td>
                      <td className="fomc-ew-range">{row.rate}</td>
                      <td className="fomc-ew-num">{hasIntervals ? row.totalIntervals : '—'}</td>
                      <td className="fomc-ew-pos">{hasPos ? row.pos : '—'}</td>
                      <td className="fomc-ew-neg">{hasNeg ? row.neg : '—'}</td>
                      <td className="fomc-ew-acc" style={{ color: accColor }}>{hasAcc ? `${row.accuracy.toFixed(2)}%` : '—'}</td>
                      <td className="fomc-ew-cyan">{hasMae ? row.mae.toFixed(4) : '—'}</td>
                      <td style={{ color: mseColor, textAlign: 'right', padding: '9px 10px' }}>{hasMse ? row.mse.toFixed(4) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <FOMCApiAccessPanel />
      </div>

    </div>
  );
}
