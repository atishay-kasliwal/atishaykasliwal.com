import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import SiteHeader from '../SiteHeader';
import '../styles/atriveo.css';

// ─── Pipeline terminal ───────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { t: '03:00:01', text: 'scrape linkedin · greenhouse · lever', tail: '214 new postings' },
  { t: '03:00:47', text: 'score against skills profile', tail: '38 above threshold' },
  { t: '03:01:12', text: 'enqueue compile jobs → mongo', tail: '12 queued' },
  { t: '03:01:58', text: 'jd gate · engineering relevance', tail: 'PASS' },
  { t: '03:02:14', text: 'fingerprint 8f3a…c21b', tail: 'CACHE MISS · compiling' },
  { t: '03:02:41', text: 'compose 15 bullets · beam width 6', tail: '161 ACs considered' },
  { t: '03:03:05', text: 'global optimize · hill climb', tail: '+11.4 info gain' },
  { t: '03:03:22', text: 'render tectonic → latex → pdf', tail: 'ATS-safe ✓' },
  { t: '03:03:29', text: 'Atishay Kasliwal.pdf', tail: 'written · replayable' },
];

function PipelineTerminal() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => (c >= TERMINAL_LINES.length ? 0 : c + 1));
    }, 950);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="atv-terminal" aria-hidden="true">
      <div className="atv-terminal-bar">
        <span className="atv-term-dot" style={{ background: '#ff5f57' }} />
        <span className="atv-term-dot" style={{ background: '#febc2e' }} />
        <span className="atv-term-dot" style={{ background: '#28c840' }} />
        <span className="atv-terminal-title">com.atriveo.tailor-worker — while you sleep</span>
      </div>
      <div className="atv-terminal-body">
        {TERMINAL_LINES.slice(0, count).map(l => (
          <div className="atv-term-line" key={l.t}>
            <span className="atv-term-time">{l.t}</span>
            <span className="atv-term-text">{l.text}</span>
            <span className="atv-term-tail">{l.tail}</span>
          </div>
        ))}
        <div className="atv-term-cursor" />
      </div>
    </div>
  );
}

// ─── Compile stage stepper ───────────────────────────────────────────────────
const STAGES = ['JD in', 'Gate', 'Compose', 'Optimize', 'Render', 'PDF out'];

// ─── System map data ─────────────────────────────────────────────────────────
// Coordinates are percentages of the map canvas (center of each node).
const NODES = [
  {
    id: 'ext',
    repo: 'https://github.com/atishay-kasliwal/Atriveo',
    label: 'Chrome Extension',
    sub: 'Capture',
    x: 14, y: 18,
    status: 'Live · 5.0★',
    statusKind: 'live',
    desc: 'One-click capture from 20+ ATS platforms. Detects career pages, extracts job metadata, and logs the application before the confirmation tab closes.',
    tech: ['Chrome MV3', 'Content scripts', 'Service worker'],
    link: 'https://github.com/atishay-kasliwal/Atriveo',
  },
  {
    id: 'dock',
    repo: 'https://github.com/atishay-kasliwal/atriveo-dock',
    label: 'macOS Dock',
    sub: 'Native companion',
    x: 14, y: 50,
    status: 'In development',
    statusKind: 'dev',
    desc: 'A native desktop companion that lives beside the browser all day — surfacing 800+ live job matches with AI scores. Keyboard-first, Raycast-fast, never intrusive.',
    tech: ['Tauri 2', 'Rust', 'React'],
    link: 'https://github.com/atishay-kasliwal/atriveo-dock',
  },
  {
    id: 'agent',
    repo: 'https://github.com/atishay-kasliwal/atriveo-capture-agent',
    label: 'Capture Agent',
    sub: 'Edge capture',
    x: 14, y: 82,
    status: 'In development',
    statusKind: 'dev',
    desc: 'Cross-platform edge agent: device enrollment, capture plugins, local analytics, sync, and fleet health. The productionization of the Cortex research.',
    tech: ['TypeScript', 'ScreenPipe', 'launchd / systemd'],
    link: 'https://github.com/atishay-kasliwal/atriveo-capture-agent',
  },
  {
    id: 'platform',
    repo: 'https://github.com/atishay-kasliwal/Atriveo',
    label: 'Edge Platform',
    sub: 'API · Auth · Data',
    x: 50, y: 34,
    status: 'Live · 99.9% uptime',
    statusKind: 'live',
    desc: 'The core API on Cloudflare Workers: auth, jobs, assessments, referrals, the social graph, media, and daily digest crons. 36 ordered SQL migrations and counting.',
    tech: ['Hono', 'Cloudflare Workers', 'Neon Postgres', 'R2'],
    link: 'https://github.com/atishay-kasliwal/Atriveo',
  },
  {
    id: 'scraper',
    repo: 'https://github.com/atishay-kasliwal/Atriveo-JD-Extractor',
    label: 'Job Pipeline',
    sub: 'Hourly ingest',
    x: 50, y: 66,
    status: 'Live · hourly',
    statusKind: 'live',
    desc: 'Scrapes LinkedIn, Greenhouse, and Lever every hour, scores each role against a skills profile, and queues the best matches for resume compilation.',
    tech: ['Python', 'JobSpy', 'MongoDB'],
    link: 'https://github.com/atishay-kasliwal/Atriveo-JD-Extractor',
  },
  {
    id: 'dashboard',
    repo: 'https://github.com/atishay-kasliwal/Atriveo',
    label: 'Web Dashboard',
    sub: 'atriveo.com',
    x: 86, y: 18,
    status: 'Live · 100+ users',
    statusKind: 'live',
    desc: 'Tracks applications, online assessments, referrals, and follow-ups in one place — with trend analytics, monthly targets, and a permissioned social layer.',
    tech: ['React', 'Vite', 'Recharts'],
    link: 'https://atriveo.com',
  },
  {
    id: 'compiler',
    repo: 'https://github.com/atishay-kasliwal/atriveo-app',
    label: 'Resume Compiler',
    sub: 'Evidence → PDF',
    x: 86, y: 50,
    status: 'Live',
    statusKind: 'live',
    desc: 'Not a resume generator — a compiler. 161 evidence-backed accomplishment cards, a global 15-bullet optimizer, and deterministic LaTeX output. One ATS-safe PDF per job.',
    tech: ['Node', 'Beam search', 'Tectonic LaTeX'],
    link: 'https://github.com/atishay-kasliwal/atriveo-app',
  },
  {
    id: 'cortex',
    repo: 'https://github.com/atishay-kasliwal/atriveo-cortex',
    label: 'Cortex',
    sub: 'Working memory',
    x: 86, y: 82,
    status: 'Research',
    statusKind: 'research',
    desc: 'AI working memory built on ScreenPipe. Compresses screen and audio evidence into projects, commitments, and ideas. North star: "What am I forgetting?"',
    tech: ['Next.js', 'Ollama', 'SQLite'],
    link: 'https://github.com/atishay-kasliwal/atriveo-cortex',
  },
];

// Edges are computed from the real DOM positions of the node cards, so the
// lines anchor exactly to card edges at any container size.
const EDGE_SPECS = [
  { id: 'e1', from: 'ext', to: 'platform', dur: '3.2s' },
  { id: 'e2', from: 'dock', to: 'platform', dur: '3.8s' },
  { id: 'e3', from: 'agent', to: 'cortex', dur: '4.2s' },
  { id: 'e4', from: 'platform', to: 'dashboard', dur: '3.4s' },
  { id: 'e5', from: 'scraper', to: 'compiler', dur: '3.6s' },
  { id: 'e6', from: 'scraper', to: 'platform', dur: '2.8s', vertical: true },
];

const STATS = [
  { num: '100+', label: 'Active users' },
  { num: '2K+', label: 'Daily queries' },
  { num: '5.0★', label: 'Chrome Web Store' },
  { num: '99.9%', label: 'Uptime' },
];

const TIMELINE = [
  {
    period: 'Jan 2026',
    title: 'Atriveo begins',
    desc: 'Started as a personal fix: job applications scattered across spreadsheets, notes apps, and email.',
  },
  {
    period: 'Mar 2026',
    title: 'v1 ships at atriveo.com',
    desc: 'Chrome extension, dashboard, and edge API go live on Cloudflare Workers. First real users.',
  },
  {
    period: 'Apr 2026',
    title: 'The compiler pivot',
    desc: 'Resumes stop being generated text and become compiled output from a structured evidence graph — deterministic, provable, repeatable.',
  },
  {
    period: 'Jun 2026',
    title: 'Open source & new surfaces',
    desc: 'Self-hosted backend at application.atriveo.com. Cortex working-memory research. Native macOS Dock enters development.',
  },
  {
    period: 'Now',
    title: 'Autonomous pipeline',
    desc: 'Scrape → score → queue → compile, every hour, without a browser tab open. The system runs while you sleep.',
  },
];

export default function AtriveoPage() {
  const [active, setActive] = useState('platform');
  const node = NODES.find(n => n.id === active);

  const mapRef = useRef(null);
  const nodeEls = useRef({});
  const [edgePaths, setEdgePaths] = useState([]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const compute = () => {
      // On mobile the map stacks into a list and the lines are hidden.
      if (window.matchMedia('(max-width: 860px)').matches) {
        setEdgePaths([]);
        return;
      }
      const mapRect = map.getBoundingClientRect();
      const rects = {};
      for (const [id, el] of Object.entries(nodeEls.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rects[id] = {
          left: r.left - mapRect.left,
          right: r.right - mapRect.left,
          top: r.top - mapRect.top,
          bottom: r.bottom - mapRect.top,
          cx: r.left - mapRect.left + r.width / 2,
          cy: r.top - mapRect.top + r.height / 2,
        };
      }
      const next = [];
      for (const spec of EDGE_SPECS) {
        const s = rects[spec.from];
        const t = rects[spec.to];
        if (!s || !t) continue;
        let d;
        if (spec.vertical) {
          d = `M ${Math.round(s.cx)} ${Math.round(s.top - 4)} L ${Math.round(t.cx)} ${Math.round(t.bottom + 4)}`;
        } else {
          const sx = Math.round(s.right + 4);
          const sy = Math.round(s.cy);
          const ex = Math.round(t.left - 4);
          const ey = Math.round(t.cy);
          const mx = Math.round((sx + ex) / 2);
          d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
        }
        next.push({ id: spec.id, d, dur: spec.dur });
      }
      setEdgePaths(next);
    };

    compute();
    // Re-measure after layout/fonts settle (and after HMR-style reflows).
    const raf = requestAnimationFrame(compute);
    const late = setTimeout(compute, 400);
    const ro = new ResizeObserver(compute);
    ro.observe(map);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(late);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Atriveo — A Job Search Operating System | Atishay Kasliwal</title>
        <meta
          name="description"
          content="Atriveo: a job search operating system built end-to-end by one engineer. Chrome extension, edge platform, hourly scraping pipeline, and a resume compiler — 100+ active users."
        />
        <link rel="canonical" href="https://atishaykasliwal.com/atriveo" />
      </Helmet>

      <div className="page-content" translate="no">
        <SiteHeader />

        {/* ── Hero ── */}
        <section className="atv-hero">
          <div className="atv-hero-badge">
            <span className="atv-live-dot" /> Live product
          </div>
          <h1 className="atv-wordmark">Atriveo</h1>
          <p className="atv-tagline">
            A job search operating system.
            <br />
            <span className="atv-tagline-dim">Built end-to-end by one engineer.</span>
          </p>

          <div className="atv-stats">
            {STATS.map(s => (
              <div className="atv-stat" key={s.label}>
                <span className="atv-stat-num">{s.num}</span>
                <span className="atv-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Problem ── */}
        <section className="atv-problem">
          <p>
            Job searching at scale is broken. Applications live in spreadsheets, lost tabs, and
            email threads. Every resume is generic. Every follow-up is remembered too late.
            <span className="atv-problem-em"> Atriveo turns the whole thing into a system.</span>
          </p>
        </section>

        {/* ── System map ── */}
        <section className="atv-map-section">
          <div className="atv-section-head">
            <span className="atv-eyebrow">The system</span>
            <h2>One platform, seven moving parts</h2>
            <p className="atv-section-sub">Click any node to explore it.</p>
          </div>

          <div className="atv-map" role="group" aria-label="Atriveo system architecture map" ref={mapRef}>
            <svg className="atv-map-lines" aria-hidden="true">
              {edgePaths.map(e => (
                <g key={e.id}>
                  <path className="atv-edge" d={e.d} />
                  <circle className="atv-edge-dot" r="3.5">
                    <animateMotion dur={e.dur} repeatCount="indefinite" path={e.d} />
                  </circle>
                </g>
              ))}
            </svg>

            {NODES.map(n => (
              <div
                key={n.id}
                ref={el => { nodeEls.current[n.id] = el; }}
                role="button"
                tabIndex={0}
                className={`atv-node${active === n.id ? ' is-active' : ''}`}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                onClick={() => setActive(n.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(n.id); }
                }}
              >
                <span className={`atv-node-status atv-node-status--${n.statusKind}`} />
                <span className="atv-node-label">{n.label}</span>
                <span className="atv-node-sub">{n.sub}</span>
                <a
                  className="atv-node-gh"
                  href={n.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${n.label} on GitHub`}
                  onClick={e => e.stopPropagation()}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {node && (
            <div className="atv-detail" key={node.id}>
              <div className="atv-detail-head">
                <h3>{node.label}</h3>
                <span className={`atv-badge atv-badge--${node.statusKind}`}>{node.status}</span>
              </div>
              <p className="atv-detail-desc">{node.desc}</p>
              <div className="atv-detail-foot">
                <div className="atv-tech-row">
                  {node.tech.map(t => (
                    <span className="atv-tech" key={t}>{t}</span>
                  ))}
                </div>
                <a href={node.link} target="_blank" rel="noopener noreferrer" className="atv-detail-link">
                  {node.link.includes('github.com') ? 'View source' : 'Visit'} →
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ── Compiler deep-dive ── */}
        <section className="atv-compiler">
          <div className="atv-section-head">
            <span className="atv-eyebrow">The novel part</span>
            <h2>The resume as compiled output</h2>
          </div>

          <div className="atv-stepper" aria-hidden="true">
            {STAGES.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className="atv-step-link" style={{ animationDelay: `${i * 0.9 - 0.45}s` }} />}
                <span className="atv-step" style={{ animationDelay: `${i * 0.9}s` }}>
                  {s}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="atv-compiler-grid">
            <div className="atv-compiler-card">
              <span className="atv-compiler-num">01</span>
              <h4>Evidence graph</h4>
              <p>
                161 accomplishment cards — each a proof-backed unit of work with metrics, tech,
                and a wow score. No free-form text generation, no hallucinated claims.
              </p>
            </div>
            <div className="atv-compiler-card">
              <span className="atv-compiler-num">02</span>
              <h4>Global optimizer</h4>
              <p>
                A job description gates in, then a 15-bullet hill climb jointly optimizes
                information gain across the whole page — not bullet by bullet.
              </p>
            </div>
            <div className="atv-compiler-card">
              <span className="atv-compiler-num">03</span>
              <h4>Deterministic output</h4>
              <p>
                LaTeX → ATS-safe PDF with a compile fingerprint. Same inputs, same resume —
                every build is replayable and diffable.
              </p>
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section className="atv-timeline-section">
          <div className="atv-section-head">
            <span className="atv-eyebrow">Evolution</span>
            <h2>From spreadsheet to operating system</h2>
          </div>
          <div className="atv-timeline">
            {TIMELINE.map(t => (
              <div className="atv-tl-item" key={t.period}>
                <div className="atv-tl-marker" />
                <div className="atv-tl-body">
                  <span className="atv-tl-period">{t.period}</span>
                  <h4>{t.title}</h4>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── While you sleep ── */}
        <section className="atv-terminal-section">
          <div className="atv-section-head">
            <span className="atv-eyebrow">3:00 AM</span>
            <h2>The system runs while you sleep</h2>
            <p className="atv-section-sub">
              Hourly LaunchAgents: scrape → score → queue → compile. No browser tab required.
            </p>
          </div>
          <PipelineTerminal />
        </section>

        {/* ── CTA ── */}
        <section className="atv-cta">
          <h2>See it running</h2>
          <div className="atv-cta-row">
            <a href="https://atriveo.com" target="_blank" rel="noopener noreferrer" className="atv-btn atv-btn--primary">
              atriveo.com →
            </a>
            <a href="https://application.atriveo.com" target="_blank" rel="noopener noreferrer" className="atv-btn">
              Self-hosted version
            </a>
            <a href="https://github.com/atishay-kasliwal/atriveo-app" target="_blank" rel="noopener noreferrer" className="atv-btn">
              GitHub
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
