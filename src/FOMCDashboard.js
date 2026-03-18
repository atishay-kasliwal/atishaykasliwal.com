import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './FOMCDashboard.css';

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

  // ── Firestore data ────────────────────────────────────────────────────────
  const [sessionMeta, setSessionMeta] = useState(null);
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

  // ── Load Firestore data when date changes ─────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIntervals([]);
    setSessionMeta(null);
    setActiveInterval(null);
    setVideoSeconds(0);

    async function load() {
      const date = selectedSession.date;
      try {
        // Session metadata
        const sessionSnap = await getDoc(doc(db, 'fomc_sessions', date));
        if (cancelled) return;
        if (sessionSnap.exists()) setSessionMeta(sessionSnap.data());

        // All intervals
        const intSnap = await getDocs(collection(db, 'fomc_sessions', date, 'intervals'));
        if (cancelled) return;
        const docs = intSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.videoSeconds - b.videoSeconds);
        setIntervals(docs);
        if (docs.length) setActiveInterval(docs[0]);
      } catch (err) {
        console.error('Firestore load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateId]);

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
          {aiMidD && <path d={aiMidD} fill="none" stroke="rgba(210,195,255,1)" strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round" className="fomc-ai-draw" />}

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
            <div className="fomc-stat-val">6</div>
          </div>
          <div className="fomc-stat">
            <div className="fomc-stat-lbl">AI Accuracy</div>
            <div className="fomc-stat-val fomc-val-blue">
              {sessionMeta?.accuracyPct != null ? `${sessionMeta.accuracyPct.toFixed(1)}%` : '—'}
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
                <div className="fomc-ai-line-demo" /> H0
              </div>
              <div className="fomc-chart-legend-ai fomc-legend-h1">
                <div className="fomc-ai-line-demo fomc-ai-line-h1" /> H1
              </div>
            </div>
          </div>
          {chartSvg}
        </div>
      </div>

      {/* ── ROW 2: Timeline (full width) ──────────────────────────────────── */}
      <div className="fomc-panel fomc-tl-panel">
        <div className="fomc-tl-hd">
          <span className="fomc-panel-ttl">TIMELINE · {selectedSession.label} {selectedSession.year}</span>
          {sessionMeta && (
            <span className="fomc-tl-accuracy">
              AI Accuracy: <strong>{sessionMeta.accuracyPct?.toFixed(1)}%</strong>
              &nbsp;·&nbsp; MAE: <strong>{sessionMeta.mae?.toFixed(3)}</strong>
            </span>
          )}
        </div>
        <div className="fomc-tl-wrap">
          <div className="fomc-tl-track"
            onClick={handleTimelineInteract}
            onMouseMove={handleTimelineMouseMove}
          >
            <div className="fomc-tl-zone-pre" style={{ width: '100%' }} />
            {/* Interval markers */}
            {intervals.map((iv) => {
              const pct = (iv.videoSeconds / totalDuration) * 100;
              const isActive = iv.id === activeInterval?.id;
              const correct = iv.horizons?.h0?.correctDirection;
              const color = correct === true ? 'rgba(63,182,139,0.5)' : correct === false ? 'rgba(224,93,93,0.5)' : 'rgba(255,255,255,0.15)';
              return (
                <div
                  key={iv.id}
                  className={`fomc-tl-iv-mark${isActive ? ' active' : ''}`}
                  style={{ left: `${pct}%`, background: color }}
                  onClick={(e) => { e.stopPropagation(); manualSeek(iv.videoSeconds); }}
                />
              );
            })}
            <div className="fomc-slider" style={{ left: `${timelinePos}%` }}>
              <div className="fomc-sl-line" />
              <div className="fomc-sl-thumb" />
              <div className="fomc-sl-lbl">{tlLabel}</div>
            </div>
          </div>
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

    </div>
  );
}
