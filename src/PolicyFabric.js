import React, { useState } from 'react';
import './PolicyFabric.css';

// ── Config ──────────────────────────────────────────────────────────────────

const CONTRACTS = {
  basic: {
    label: 'Basic Tier',
    health:  [
      { field: 'age',       allowed: true  },
      { field: 'condition', allowed: true  },
      { field: 'location',  allowed: false },
    ],
    driving: [
      { field: 'score',      allowed: true  },
      { field: 'violations', allowed: false },
      { field: 'raw_logs',   allowed: false },
    ],
  },
  premium: {
    label: 'Premium Tier',
    health:  [
      { field: 'age',       allowed: true },
      { field: 'condition', allowed: true },
      { field: 'location',  allowed: true },
    ],
    driving: [
      { field: 'score',      allowed: true  },
      { field: 'violations', allowed: true  },
      { field: 'raw_logs',   allowed: false },
    ],
  },
};

// ── Horizontal Story Graph ───────────────────────────────────────────────────
//
//  Three swim lanes (rows), five event columns flowing left → right.
//
//   Consumer     ─────●──────────────────────────────────────●─────
//                      ↓ ① REQUEST              ⑤ RESPOND ↑
//   Insurance    ──────●──────●────────●──────[POLICY]──────●─────
//                       ↓ ② FETCH   ↑ ③ DATA IN
//   Providers    ───────────────●────●─────────────────────────────

function StoryGraph({ isStale, contract }) {
  const c       = CONTRACTS[contract];
  const allowed = [...c.health, ...c.driving].filter(f => f.allowed);
  const total   = c.health.length + c.driving.length;
  const n       = allowed.length;

  // Lane Y centers
  const CY = 42, IY = 118, PY = 192;

  // Event X centers
  const X1 = 172, X2 = 330, X3 = 488, X4 = 638, X5 = 786;

  // Colors
  const B  = 'rgba(79,142,247,0.85)';
  const G  = 'rgba(34,197,94,0.85)';
  const O  = 'rgba(245,158,11,0.85)';

  // Mid-Y helpers
  const mid = (a, b) => (a + b) / 2;

  return (
    <svg viewBox="0 0 896 235" className="pf-hg">
      <defs>
        <filter id="pfgb2" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pfgw2" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── ACTOR LABELS ── */}

      {/* Consumer */}
      <rect x={4} y={CY-15} width={90} height={28} rx={5}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x={49} y={CY+5} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="7.5" fontWeight="600"
        fill="rgba(255,255,255,0.75)">Consumer</text>

      {/* Insurance Node */}
      <rect x={4} y={IY-15} width={90} height={28} rx={5}
        fill="rgba(79,142,247,0.09)" stroke="rgba(79,142,247,0.38)" strokeWidth="1"
        filter="url(#pfgb2)" />
      <text x={49} y={IY+5} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="7" fontWeight="700"
        fill="rgba(79,142,247,0.95)">Insurance Node</text>

      {/* Providers */}
      <rect x={4} y={PY-15} width={90} height={28} rx={5}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x={49} y={PY-3} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="7" fontWeight="600"
        fill="rgba(255,255,255,0.7)">Provider A</text>
      <text x={49} y={PY+8} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="5.5"
        fill="rgba(255,255,255,0.32)">Provider B</text>

      {/* ── LIFELINES ── */}
      <line x1={98} y1={CY} x2={875} y2={CY}
        stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 6" />
      <line x1={98} y1={IY} x2={875} y2={IY}
        stroke="rgba(79,142,247,0.2)" strokeWidth="1.5" />
      <line x1={98} y1={PY} x2={875} y2={PY}
        stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 6" />

      {/* Subtle time axis label */}
      <text x={875} y={228} textAnchor="end"
        fontFamily="Inter,sans-serif" fontSize="6" letterSpacing="0.08em"
        fill="rgba(255,255,255,0.12)">TIME →</text>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP ① — Consumer sends request to Insurance                   */}
      {/* ─────────────────────────────────────────────────────────────── */}

      {/* Step number + phase label above Consumer lane */}
      <text x={X1} y={CY-20} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700"
        fill="rgba(79,142,247,0.65)">①</text>
      <text x={X1} y={CY-10} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="5.5" fontWeight="700"
        letterSpacing="0.1em" fill="rgba(255,255,255,0.22)">REQUEST</text>

      {/* Dot on Consumer lifeline */}
      <circle cx={X1} cy={CY} r={4.5}
        fill="none" stroke={B} strokeWidth="1.5" />

      {/* Vertical arrow: Consumer → Insurance */}
      <line x1={X1} y1={CY+6} x2={X1} y2={IY-10}
        stroke={B} strokeWidth="1.5" strokeLinecap="round" />
      {/* Arrowhead ↓ */}
      <polygon points={`${X1-5},${IY-12} ${X1+5},${IY-12} ${X1},${IY-4}`} fill={B} />

      {/* Edge label */}
      <text x={X1+11} y={mid(CY,IY)+3}
        fontFamily="SF Mono,Fira Code,monospace" fontSize="6.5" fontWeight="500"
        fill="rgba(255,255,255,0.45)">send data request</text>

      {/* Dot on Insurance lifeline */}
      <circle cx={X1} cy={IY} r={4.5} fill={B} opacity="0.55" />

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP ② — Insurance fetches from Providers                      */}
      {/* ─────────────────────────────────────────────────────────────── */}

      <text x={X2} y={IY-20} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700"
        fill="rgba(79,142,247,0.65)">②</text>
      <text x={X2} y={IY-10} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="5.5" fontWeight="700"
        letterSpacing="0.1em" fill="rgba(255,255,255,0.22)">FETCH</text>

      <circle cx={X2} cy={IY} r={4.5}
        fill="none" stroke={B} strokeWidth="1.5" />

      <line x1={X2} y1={IY+6} x2={X2} y2={PY-10}
        stroke={B} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 3" />
      {/* Arrowhead ↓ */}
      <polygon points={`${X2-5},${PY-12} ${X2+5},${PY-12} ${X2},${PY-4}`} fill={B} />

      <text x={X2+11} y={mid(IY,PY)+3}
        fontFamily="SF Mono,Fira Code,monospace" fontSize="6.5" fontWeight="500"
        fill="rgba(255,255,255,0.45)">health + driving</text>

      <circle cx={X2} cy={PY} r={4.5} fill={B} opacity="0.4" />

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP ③ — Providers return data to Insurance                    */}
      {/* ─────────────────────────────────────────────────────────────── */}

      <text x={X3} y={PY+24} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700"
        fill="rgba(79,142,247,0.65)">③</text>
      <text x={X3} y={PY+33} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="5.5" fontWeight="700"
        letterSpacing="0.1em" fill="rgba(255,255,255,0.22)">DATA IN</text>

      <circle cx={X3} cy={PY} r={4.5}
        fill="none" stroke={isStale ? O : G} strokeWidth="1.5" />

      <line x1={X3} y1={PY-6} x2={X3} y2={IY+10}
        stroke={isStale ? O : G} strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray={isStale ? "5 3" : undefined} />
      {/* Arrowhead ↑ */}
      <polygon points={`${X3-5},${IY+12} ${X3+5},${IY+12} ${X3},${IY+4}`}
        fill={isStale ? O : G} />

      <text x={X3+11} y={mid(IY,PY)+3}
        fontFamily="SF Mono,Fira Code,monospace" fontSize="6.5" fontWeight="500"
        fill={isStale ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.45)"}>
        {isStale ? '⚠ stale  3h old' : 'age · condition · score'}
      </text>

      <circle cx={X3} cy={IY} r={4.5}
        fill={isStale ? O : G} opacity="0.6" />

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP ④ — Policy enforced on Insurance Node                     */}
      {/* ─────────────────────────────────────────────────────────────── */}

      <text x={X4} y={CY-20} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700"
        fill="rgba(79,142,247,0.65)">④</text>
      <text x={X4} y={CY-10} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="5.5" fontWeight="700"
        letterSpacing="0.1em" fill="rgba(255,255,255,0.22)">POLICY</text>

      {/* Policy box on Insurance lifeline */}
      <rect x={X4-52} y={IY-19} width={104} height={38} rx={5}
        fill="rgba(79,142,247,0.08)" stroke="rgba(79,142,247,0.28)" strokeWidth="1" />
      <text x={X4} y={IY-6} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="6" fontWeight="700"
        letterSpacing="0.08em" fill="rgba(79,142,247,0.9)">POLICY ENFORCED</text>
      {/* Allowed fields */}
      <text x={X4} y={IY+5} textAnchor="middle"
        fontFamily="SF Mono,Fira Code,monospace" fontSize="5.5">
        {allowed.map((f, i) => (
          <tspan key={f.field} fill="rgba(34,197,94,0.85)">{f.field}{i < allowed.length - 1 ? '  ' : ''}</tspan>
        ))}
      </text>
      {/* Denied fields */}
      <text x={X4} y={IY+15} textAnchor="middle"
        fontFamily="SF Mono,Fira Code,monospace" fontSize="5.5">
        {[...c.health, ...c.driving].filter(f => !f.allowed).map((f, i, arr) => (
          <tspan key={f.field} fill="rgba(239,68,68,0.55)">{f.field}✗{i < arr.length - 1 ? '  ' : ''}</tspan>
        ))}
      </text>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* STEP ⑤ — Insurance sends filtered response to Consumer         */}
      {/* ─────────────────────────────────────────────────────────────── */}

      <text x={X5} y={IY+24} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="8" fontWeight="700"
        fill="rgba(34,197,94,0.75)">⑤</text>
      <text x={X5} y={IY+33} textAnchor="middle"
        fontFamily="Inter,sans-serif" fontSize="5.5" fontWeight="700"
        letterSpacing="0.1em" fill="rgba(34,197,94,0.35)">RESPOND</text>

      <circle cx={X5} cy={IY} r={4.5}
        fill="none" stroke={G} strokeWidth="1.5" />

      <line x1={X5} y1={IY-6} x2={X5} y2={CY+10}
        stroke={G} strokeWidth="2" strokeLinecap="round" />
      {/* Arrowhead ↑ */}
      <polygon points={`${X5-5},${CY+12} ${X5+5},${CY+12} ${X5},${CY+4}`} fill={G} />

      {/* Field count label — to the LEFT so it doesn't clip */}
      <text x={X5-11} y={mid(CY,IY)+3} textAnchor="end"
        fontFamily="SF Mono,Fira Code,monospace" fontSize="7" fontWeight="700"
        fill="rgba(34,197,94,0.85)">{n} of {total} fields</text>

      {/* Consumer receives — glowing dot */}
      <circle cx={X5} cy={CY} r={6} fill={G} opacity="0.18" filter="url(#pfgb2)" />
      <circle cx={X5} cy={CY} r={4.5} fill={G} opacity="0.75" />
    </svg>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PolicyFabric() {
  const [contract, setContract] = useState('basic');
  const [isStale,  setIsStale]  = useState(false);

  const c       = CONTRACTS[contract];
  const allowed = [...c.health, ...c.driving].filter(f => f.allowed).length;
  const total   = c.health.length + c.driving.length;

  return (
    <div className="pf-page project-detail-page">

      {/* ── Page Header ── */}
      <div className="pf-header">
        <div className="pf-header-text">
          <h1 className="pf-header-title">PolicyFabric</h1>
          <p className="pf-header-subtitle">Real-time distributed systems with contract-based access control and policy enforcement</p>
        </div>
        <div className="pf-header-badges">
          <span className="pf-header-badge">Nodes: 4</span>
          <span className="pf-header-badge">Contracts: 2</span>
          <span className="pf-header-badge">Pipeline Stages: 5</span>
          <span className="pf-header-badge pf-header-badge--live">● Live</span>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="pf-topbar">
        <div className="pf-logo">
          <svg className="pf-logo-icon" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 18.66,6 18.66,14 10,19 1.34,14 1.34,6"
              stroke="#4f8ef7" strokeWidth="1.5" fill="rgba(79,142,247,0.08)" />
            <polygon points="10,5 15,7.5 15,12.5 10,15 5,12.5 5,7.5"
              fill="#4f8ef7" opacity="0.5" />
          </svg>
          <span className="pf-logo-text">PolicyFabric</span>
        </div>

        <div className="pf-topbar-center">
          <select className="pf-selector" value={contract}
            onChange={e => setContract(e.target.value)}>
            <option value="basic">Basic Tier</option>
            <option value="premium">Premium Tier</option>
          </select>
        </div>

        <div className="pf-topbar-right">
          <label className="pf-stale-ctrl">
            <input type="checkbox" checked={isStale}
              onChange={e => setIsStale(e.target.checked)} />
            <span>Simulate Stale Provider B</span>
          </label>
          <span className="pf-divider-v" />
          <span className="pf-live-dot" />
          <span className="pf-live-lbl">Live</span>
          <span className="pf-metrics-pill">
            Latency: 320ms | Fields: {allowed}/{total}
          </span>
        </div>
      </div>

      {/* ── Full-width graph ── */}
      <div className="pf-main">
        <StoryGraph isStale={isStale} contract={contract} />
      </div>

    </div>
  );
}
