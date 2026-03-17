import React, { useState } from 'react';
import './PolicyFabric.css';

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 870;
const CANVAS_H = 680;

const PROV_W = 192;
const PROV_H = 62;
const PROV_GAP = 12;
const PROV_L = 16;

const INS_L = 264;
const INS_W = 280;
const INS_H = 400;
const INS_T = 140; // (680 - 400) / 2
const INS_RE = 544; // INS_L + INS_W
const INS_CY = 340; // INS_T + INS_H / 2

const CON_L = 600;
const CON_W = 205;
const CON_H = 250;
const CON_T = 215; // (680 - 250) / 2
const CON_CY = 340;

// Provider Y: startY = (680 - (8*62 + 7*12)) / 2 = (680 - 580) / 2 = 50
const PROV_START_Y = 50;
const provY = (i) => PROV_START_Y + i * (PROV_H + PROV_GAP);
const provCY = (i) => provY(i) + PROV_H / 2;

// ── Data ─────────────────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'health-api',  label: 'Health Records API', sub: 'EHR System',      status: 'active',     lat: '120ms', color: '#4f8ef7', tag: 'HEALTH'    },
  { id: 'driving',     label: 'Driving Score',       sub: 'Telematics Feed', status: 'stale',      lat: '340ms', color: '#f59e0b', tag: 'TELEMATIC' },
  { id: 'med-history', label: 'Medical History',     sub: 'FHIR Gateway',    status: 'active',     lat: '89ms',  color: '#4f8ef7', tag: 'HEALTH'    },
  { id: 'location',    label: 'Location Service',    sub: 'Geo / PII',       status: 'restricted', lat: '210ms', color: '#ef4444', tag: 'PII'       },
  { id: 'financial',   label: 'Financial Score',     sub: 'Credit Bureau',   status: 'active',     lat: '156ms', color: '#8b5cf6', tag: 'FINANCIAL' },
  { id: 'behavioral',  label: 'Behavioral Data',     sub: 'Analytics API',   status: 'processing', lat: '445ms', color: '#06b6d4', tag: 'ANALYTICS' },
  { id: 'telematics',  label: 'Telematics Hub',      sub: 'IoT Gateway',     status: 'active',     lat: '78ms',  color: '#22c55e', tag: 'IOT'       },
  { id: 'claims',      label: 'Claims History',      sub: 'Internal DB',     status: 'active',     lat: '190ms', color: '#f97316', tag: 'INSURANCE' },
];

const CONTRACTS = {
  basic: {
    label: 'Basic Tier',
    groups: [
      { name: 'Health',    fields: [{ n: 'age', ok: true }, { n: 'condition', ok: true }, { n: 'bmi', ok: false }] },
      { name: 'Telematic', fields: [{ n: 'drive_score', ok: true }, { n: 'violations', ok: false }] },
      { name: 'Financial', fields: [{ n: 'credit', ok: false }, { n: 'income', ok: false }] },
      { name: 'Claims',    fields: [{ n: 'prior_claims', ok: false }, { n: 'incidents', ok: false }] },
    ],
  },
  premium: {
    label: 'Premium Tier',
    groups: [
      { name: 'Health',    fields: [{ n: 'age', ok: true }, { n: 'condition', ok: true }, { n: 'bmi', ok: true }] },
      { name: 'Telematic', fields: [{ n: 'drive_score', ok: true }, { n: 'violations', ok: true }] },
      { name: 'Financial', fields: [{ n: 'credit', ok: true }, { n: 'income', ok: false }] },
      { name: 'Claims',    fields: [{ n: 'prior_claims', ok: true }, { n: 'incidents', ok: false }] },
    ],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function edgePath(i) {
  const cy = provCY(i);
  return `M${PROV_L + PROV_W},${cy} C${PROV_L + PROV_W + 80},${cy} ${INS_L - 60},${INS_CY} ${INS_L},${INS_CY}`;
}

function pulseDur(status) {
  if (status === 'stale') return '2.2s';
  if (status === 'processing') return '1.8s';
  return '1.4s';
}

// ── EdgeSVG ──────────────────────────────────────────────────────────────────

function EdgeSVG({ contract }) {
  return (
    <svg
      className="pf-edge-layer"
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Blur glow for provider edges */}
        <filter id="pfgb" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger glow for output edge */}
        <filter id="pfgo" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Hidden motion paths — one per provider */}
        {PROVIDERS.map((p, i) => (
          <path
            key={`pp-${p.id}`}
            id={`pp-${p.id}`}
            d={edgePath(i)}
            fill="none"
          />
        ))}

        {/* Output motion path */}
        <path id="pp-out" d={`M${INS_RE},${INS_CY} L${CON_L},${CON_CY}`} fill="none" />
      </defs>

      {/* Provider → Insurance edges */}
      {PROVIDERS.map((p, i) => {
        const path = edgePath(i);
        const isRestricted = p.status === 'restricted';
        const isStale = p.status === 'stale';
        const dur = pulseDur(p.status);
        const dur2 = parseFloat(dur) * 0.33 + 's';
        const dur3 = parseFloat(dur) * 0.66 + 's';

        return (
          <g key={p.id}>
            {/* Glow backing */}
            <path
              d={path}
              stroke={p.color}
              strokeWidth="5"
              fill="none"
              opacity="0.08"
              filter="url(#pfgb)"
            />

            {/* Animated flow line */}
            <path
              d={path}
              stroke={p.color}
              strokeWidth="1.2"
              fill="none"
              opacity={isRestricted ? 0.2 : 0.5}
              strokeDasharray={isStale || isRestricted ? '5 4' : '6 30'}
              className="pf-flow"
            />

            {/* Pulse dots — skip restricted */}
            {!isRestricted && (
              <>
                <circle r="3" fill={p.color} filter="url(#pfgb)" opacity="0.9">
                  <animateMotion dur={dur} begin="0s" repeatCount="indefinite">
                    <mpath href={`#pp-${p.id}`} />
                  </animateMotion>
                </circle>
                <circle r="3" fill={p.color} filter="url(#pfgb)" opacity="0.9">
                  <animateMotion dur={dur} begin={dur2} repeatCount="indefinite">
                    <mpath href={`#pp-${p.id}`} />
                  </animateMotion>
                </circle>
                <circle r="3" fill={p.color} filter="url(#pfgb)" opacity="0.9">
                  <animateMotion dur={dur} begin={dur3} repeatCount="indefinite">
                    <mpath href={`#pp-${p.id}`} />
                  </animateMotion>
                </circle>
              </>
            )}
          </g>
        );
      })}

      {/* Insurance → Consumer output edge */}
      <g>
        {/* Thick glow */}
        <path
          d={`M${INS_RE},${INS_CY} L${CON_L},${CON_CY}`}
          stroke="#22c55e"
          strokeWidth="6"
          fill="none"
          opacity="0.1"
          filter="url(#pfgo)"
        />
        {/* Line */}
        <path
          d={`M${INS_RE},${INS_CY} L${CON_L},${CON_CY}`}
          stroke="#22c55e"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
          strokeDasharray="6 30"
          className="pf-flow"
        />
        {/* Pulse dots */}
        {[0, 0.33, 0.66].map((offset, idx) => (
          <circle key={idx} r="3.5" fill="#22c55e" filter="url(#pfgo)" opacity="0.9">
            <animateMotion dur="0.9s" begin={`${(0.9 * offset).toFixed(2)}s`} repeatCount="indefinite">
              <mpath href="#pp-out" />
            </animateMotion>
          </circle>
        ))}
      </g>
    </svg>
  );
}

// ── ProviderCard ─────────────────────────────────────────────────────────────

function ProviderCard({ p, i }) {
  return (
    <div
      className={`pf-pcard pf-pcard--${p.status}`}
      style={{ top: provY(i), '--c': p.color }}
    >
      <div className="pf-pcard-accent" />
      <div className="pf-pcard-body">
        <div className="pf-pcard-top">
          <span className="pf-pcard-name">{p.label}</span>
          <span className={`pf-tag pf-tag--${p.tag}`}>{p.tag}</span>
        </div>
        <div className="pf-pcard-bot">
          <span className="pf-pcard-sub">{p.sub}</span>
          <div className="pf-pcard-meta">
            <span className={`pf-dot pf-dot--${p.status}`} />
            <span className="pf-pcard-status">{p.status}</span>
            <span className="pf-pcard-lat">{p.lat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── InsuranceNode ─────────────────────────────────────────────────────────────

function InsuranceNode({ contract }) {
  const c = CONTRACTS[contract];
  const allFields = c.groups.flatMap(g => g.fields);
  const allowed = allFields.filter(f => f.ok).length;
  const total = allFields.length;

  return (
    <div className="pf-ins">
      <div className="pf-ins-head">
        <div className="pf-ins-icon">
          {/* Hexagon SVG */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polygon
              points="8,1 14.5,4.5 14.5,11.5 8,15 1.5,11.5 1.5,4.5"
              stroke="#4f8ef7"
              strokeWidth="1.2"
              fill="rgba(79,142,247,0.15)"
            />
            <polygon
              points="8,4.5 11.5,6.5 11.5,10 8,12 4.5,10 4.5,6.5"
              fill="#4f8ef7"
              opacity="0.4"
            />
          </svg>
        </div>
        <div>
          <div className="pf-ins-title">Insurance Node</div>
          <div className="pf-ins-sub">Aggregation · Contract Engine · Validator</div>
        </div>
      </div>

      <div className="pf-ins-rule" />

      <div className="pf-ins-systems">
        <div className="pf-sys pf-sys--ok">
          <span className="pf-sys-led pf-sys-led--green" />
          <span className="pf-sys-name">Aggregator</span>
          <span className="pf-sys-badge">running</span>
        </div>
        <div className="pf-sys pf-sys--active">
          <span className="pf-sys-led pf-sys-led--pulse" />
          <span className="pf-sys-name">Contract Engine</span>
          <span className="pf-sys-badge pf-sys-badge--active">enforcing</span>
        </div>
        <div className="pf-sys pf-sys--warn">
          <span className="pf-sys-led pf-sys-led--warn" />
          <span className="pf-sys-name">Validator</span>
          <span className="pf-sys-badge pf-sys-badge--warn">stale check</span>
        </div>
      </div>

      <div className="pf-ins-rule" />

      <div className="pf-ins-logs">
        <div className="pf-ilog pf-ilog--ok">
          <span>✔</span>
          <span>Contract applied — {c.label}</span>
        </div>
        <div className="pf-ilog pf-ilog--warn">
          <span>⚠</span>
          <span>Provider B stale (3h old)</span>
        </div>
        <div className="pf-ilog pf-ilog--ok">
          <span>✔</span>
          <span>Response sent — {allowed}/{total} fields</span>
        </div>
      </div>
    </div>
  );
}

// ── ConsumerNode ──────────────────────────────────────────────────────────────

function ConsumerNode({ contract }) {
  const c = CONTRACTS[contract];
  const allFields = c.groups.flatMap(g => g.fields);
  const allowed = allFields.filter(f => f.ok).length;
  const total = allFields.length;

  return (
    <div className="pf-consumer">
      <div className="pf-consumer-head">
        <span className="pf-consumer-arrow">→</span>
        <div>
          <div className="pf-consumer-title">Consumer</div>
          <div className="pf-consumer-tier">{c.label}</div>
        </div>
      </div>

      <div className="pf-consumer-rule" />

      <div className="pf-consumer-body">
        {c.groups.map(g => (
          <div key={g.name} className="pf-cgroup">
            <div className="pf-cgroup-label">{g.name}</div>
            {g.fields.map(f => (
              <div key={f.n} className={`pf-cf pf-cf--${f.ok ? 'ok' : 'no'}`}>
                <span className="pf-cf-dot" />
                {f.n}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pf-consumer-foot">{allowed} of {total} fields</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PolicyFabric() {
  const [contract, setContract] = useState('basic');

  const c = CONTRACTS[contract];
  const allFields = c.groups.flatMap(g => g.fields);
  const allowed = allFields.filter(f => f.ok).length;
  const total = allFields.length;

  return (
    <div className="pf-page project-detail-page">

      {/* Page Header */}
      <div className="pf-header">
        <div className="pf-header-text">
          <h1 className="pf-header-title">PolicyFabric</h1>
          <p className="pf-header-subtitle">
            Real-time distributed architecture with contract-based access control,
            8 live data providers, and policy enforcement at the insurance node.
          </p>
        </div>
        <div className="pf-header-badges">
          <span className="pf-header-badge">Providers: 8</span>
          <span className="pf-header-badge">Contracts: 2</span>
          <span className="pf-header-badge">Fields: {allowed}/{total}</span>
          <span className="pf-header-badge pf-header-badge--live">● Live</span>
        </div>
      </div>

      {/* Controls Topbar */}
      <div className="pf-topbar">
        <div className="pf-logo">
          <svg className="pf-logo-icon" viewBox="0 0 20 20" fill="none">
            <polygon
              points="10,1 18.66,6 18.66,14 10,19 1.34,14 1.34,6"
              stroke="#4f8ef7"
              strokeWidth="1.5"
              fill="rgba(79,142,247,0.08)"
            />
            <polygon
              points="10,5 15,7.5 15,12.5 10,15 5,12.5 5,7.5"
              fill="#4f8ef7"
              opacity="0.5"
            />
          </svg>
          <span className="pf-logo-text">PolicyFabric</span>
        </div>

        <div className="pf-topbar-center">
          <select
            className="pf-selector"
            value={contract}
            onChange={e => setContract(e.target.value)}
          >
            <option value="basic">Basic Tier</option>
            <option value="premium">Premium Tier</option>
          </select>
        </div>

        <div className="pf-topbar-right">
          <span className="pf-live-dot" />
          <span className="pf-live-lbl">Live</span>
          <span className="pf-metrics-pill">8 providers · {allowed}/{total} fields</span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="pf-canvas-wrap">
        <div className="pf-canvas">
          <EdgeSVG contract={contract} />
          {PROVIDERS.map((p, i) => (
            <ProviderCard key={p.id} p={p} i={i} />
          ))}
          <InsuranceNode contract={contract} />
          <ConsumerNode contract={contract} />
        </div>
      </div>

    </div>
  );
}
