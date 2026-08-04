import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSystemPanel.css';

/* ── Fig. A — the right half of the hero ──────────────────────────────────
   Every node below is a real piece of Atriveo, taken from the system map on
   /atriveo. Nothing here is invented filler: if a recruiter clicks through,
   the diagram they just read is the one they land on. */

/* Same uuid the FOMC card uses in projectsData — HighlightDetail keys the live
   dashboard off it, so this lands on the interactive build, not a stub. */
const FOMC_HREF = '/highlights/d4e5f6a7-b8c9-4012-d345-6789abcdef01';

const STAGES = [
  {
    id: 'capture',
    label: 'Capture',
    nodes: [
      { name: 'Chrome Extension', meta: 'MV3 · 20+ ATS' },
      { name: 'Job Pipeline', meta: 'Python · hourly' },
      { name: 'Capture Agent', meta: 'TypeScript · edge' },
    ],
  },
  {
    id: 'core',
    label: 'Core',
    nodes: [
      { name: 'Edge Platform', meta: 'Hono · CF Workers' },
      { name: 'Neon Postgres', meta: '36 migrations' },
      { name: 'Resume Compiler', meta: 'Beam search · LaTeX' },
    ],
  },
  {
    id: 'surface',
    label: 'Surface',
    nodes: [
      { name: 'Web Dashboard', meta: 'React · Recharts' },
      { name: 'macOS Dock', meta: 'Tauri 2 · Rust' },
      { name: 'ATS-safe PDF', meta: 'Deterministic' },
    ],
  },
];

function HeroSystemPanel() {
  return (
    <aside className="hsp" aria-labelledby="hsp-title" translate="no">
      <div className="hsp-head" translate="no">
        <span className="spec-label spec-label--accent" id="hsp-title">
          <span className="hsp-head-mark" aria-hidden="true" />
          Fig. A / System Architecture / Atriveo
        </span>
        <Link to="/atriveo" className="hsp-head-link" data-cta-position="hero_atriveo">
          Explore
          <svg width="11" height="11" fill="none" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* ── Architecture plate ── */}
      <div className="hsp-plate hsp-plate--diagram" translate="no">
        <div className="hsp-plate-head" translate="no">
          <span className="spec-label">Data Flow</span>
          <span className="hsp-status" translate="no">
            <span className="hsp-status-dot" aria-hidden="true" />
            Operational
          </span>
        </div>

        <div className="hsp-diagram" translate="no">
          {STAGES.map((stage, i) => (
            <div className="hsp-stage" key={stage.id} translate="no">
              {/* Connector lives in the column gap, where nothing can cover it */}
              {i > 0 && (
                <span className="hsp-wire" aria-hidden="true">
                  <span className="hsp-packet" />
                </span>
              )}
              <span className="spec-label hsp-stage-label">{stage.label}</span>
              <ul className="hsp-nodes" translate="no">
                {stage.nodes.map((node) => (
                  <li className="hsp-node" key={node.name} translate="no">
                    <span className="hsp-node-name">{node.name}</span>
                    <span className="hsp-node-meta">{node.meta}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="hsp-readout" translate="no">
          <span className="hsp-prompt" aria-hidden="true">$</span>
          <span className="hsp-cmd">atriveo --status</span>
          <span className="hsp-ok">99.9% uptime · 100+ users · 2K+ queries/day</span>
        </p>
      </div>

      {/* ── Featured project — the research side, so the two plates aren't
             both Atriveo ── */}
      <Link
        to={FOMC_HREF}
        className="hsp-plate hsp-featured"
        data-cta-position="hero_featured_fomc"
        translate="no"
      >
        <div className="hsp-featured-text" translate="no">
          <span className="spec-label spec-label--accent">Featured Project</span>
          <h2 className="hsp-featured-title" translate="no">FOMC Intelligence</h2>
          <p className="hsp-featured-desc" translate="no">
            An NLP pipeline that reads Fed press conferences minute by minute. Five models
            backtested across 13 rate decisions, scored on accuracy, MAE and MSE. There is a
            public API behind it.
          </p>
          <span className="hsp-featured-cta" translate="no">
            Open the dashboard
            <svg width="13" height="13" fill="none" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <span className="hsp-featured-shot" aria-hidden="true" translate="no">
          <img
            src="/fomc-preview.jpg"
            alt=""
            width="560"
            height="311"
            decoding="async"
            translate="no"
          />
        </span>
      </Link>
    </aside>
  );
}

export default HeroSystemPanel;
