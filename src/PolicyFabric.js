import React, { useState } from 'react';
import './PolicyFabric.css';

// ── Canvas geometry ────────────────────────────────────────────────────────────
// 5 columns:  Providers | Aggregator | Contract Engine | Validator | Consumer
const CW = 1080, CH = 640;

// Col 1 — Providers
const PL = 16, PW = 155, PH = 52, PG = 10;
// 8 providers: 8*52 + 7*10 = 486 → PS = (640-486)/2 = 77
const PS  = (CH - (8 * PH + 7 * PG)) / 2;
const pY  = i => PS + i * (PH + PG);
const pCY = i => pY(i) + PH / 2;
const PR  = PL + PW;   // 171

// Col 2 — Aggregator
const AGL = 222, AGW = 162, AGH = 340, AGT = (CH - AGH) / 2;   // top=150
const AGR = AGL + AGW;                                           // 384
const AGCY = CH / 2;                                             // 320

// Col 3 — Contract Engine
const CTL = 432, CTW = 162, CTH = 320, CTT = (CH - CTH) / 2;   // top=160
const CTR = CTL + CTW;                                           // 594
const CTCY = CH / 2;                                             // 320

// Col 4 — Validator
const VL = 642, VW = 155, VH = 300, VT = (CH - VH) / 2;        // top=170
const VR  = VL + VW;                                             // 797
const VCY = CH / 2;                                              // 320

// Col 5 — Consumer
const OL = 848, OW = 168, OH = 340, OT = (CH - OH) / 2;        // top=150
const OCY = CH / 2;                                              // 320

// ── Data ──────────────────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: 'health-api',  label: 'Health Records',  sub: 'EHR · FHIR',       status: 'active',     lat: '120ms', color: '#4f8ef7' },
  { id: 'driving',     label: 'Driving Score',   sub: 'Telematics Feed',   status: 'stale',      lat: '340ms', color: '#f59e0b' },
  { id: 'med-history', label: 'Medical History', sub: 'FHIR Gateway',      status: 'active',     lat: '89ms',  color: '#4f8ef7' },
  { id: 'location',    label: 'Location',        sub: 'Geo / PII',         status: 'restricted', lat: '—',     color: '#ef4444' },
  { id: 'financial',   label: 'Financial Score', sub: 'Credit Bureau',     status: 'active',     lat: '156ms', color: '#8b5cf6' },
  { id: 'behavioral',  label: 'Behavioral',      sub: 'Analytics API',     status: 'processing', lat: '445ms', color: '#06b6d4' },
  { id: 'telematics',  label: 'Telematics Hub',  sub: 'IoT Gateway',       status: 'active',     lat: '78ms',  color: '#22c55e' },
  { id: 'claims',      label: 'Claims History',  sub: 'Internal DB',       status: 'active',     lat: '190ms', color: '#f97316' },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
// activeEdges: provider IDs fan into aggregator, 'agg-ct', 'ct-val', 'val-con'
// blockedEdges: provider IDs shown with red BLOCKED line
const STEPS = [
  {
    title: 'Consumer Sends Request',
    narration: 'A user requests a personalized insurance policy quote. The Consumer node initiates a data request to PolicyFabric, specifying their contract tier.',
    activeNodes: ['consumer'],
    activeEdges: [],
    blockedEdges: [],
    aggInfo:  null,
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Request Reaches Aggregator',
    narration: 'The request is routed to the Aggregator. It parses the contract tier, identifies 8 registered providers, and begins dispatching parallel data fetches.',
    activeNodes: ['consumer', 'aggregator'],
    activeEdges: ['val-con'],
    blockedEdges: [],
    aggInfo:  'Parsing request · 8 providers queued',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Providers Discovered',
    narration: '8 data providers are registered and mapped by data type. The Aggregator opens connections to all of them simultaneously.',
    activeNodes: ['aggregator', ...PROVIDERS.map(p => p.id)],
    activeEdges: [],
    blockedEdges: [],
    aggInfo:  '8 providers discovered',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Health Data Fetched',
    narration: 'Health Records API responds in 120ms. Medical History returns via FHIR Gateway in 89ms. Both payloads are queued for merging.',
    activeNodes: ['health-api', 'med-history', 'aggregator'],
    activeEdges: ['health-api', 'med-history'],
    blockedEdges: [],
    aggInfo:  '2 / 8 received',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Telematics Fetched',
    narration: 'Driving Score returns at 340ms — data is 3 hours old, flagged stale. Telematics Hub responds fresh at 78ms. Staleness warning queued.',
    activeNodes: ['driving', 'telematics', 'aggregator'],
    activeEdges: ['driving', 'telematics'],
    blockedEdges: [],
    aggInfo:  '4 / 8 received · 1 stale',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Financial Data Fetched',
    narration: 'Credit Bureau returns a financial score in 156ms. Raw income and credit details are noted — contract policy will decide which fields pass.',
    activeNodes: ['financial', 'aggregator'],
    activeEdges: ['financial'],
    blockedEdges: [],
    aggInfo:  '5 / 8 received',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'PII Access Blocked',
    narration: 'Location Service is marked RESTRICTED at the provider level. No query is dispatched. The Aggregator logs this as a policy block.',
    activeNodes: ['location', 'aggregator'],
    activeEdges: [],
    blockedEdges: ['location'],
    aggInfo:  '5 / 8 received · 1 blocked',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Behavioral & Claims',
    narration: 'Behavioral Data is still pending at 445ms. Claims History returns from the internal DB instantly. Aggregator marks behavioral as pending.',
    activeNodes: ['behavioral', 'claims', 'aggregator'],
    activeEdges: ['behavioral', 'claims'],
    blockedEdges: [],
    aggInfo:  '7 / 8 received · 1 pending',
    ctInfo:   null,
    valInfo:  null,
  },
  {
    title: 'Aggregation Complete',
    narration: '7 of 8 providers responded. 1 blocked. 1 stale. All data is merged into a unified payload and forwarded to the Contract Engine.',
    activeNodes: ['aggregator', 'contract'],
    activeEdges: ['agg-ct'],
    blockedEdges: [],
    aggInfo:  '7 / 8 merged · forwarding',
    ctInfo:   'Payload received · evaluating',
    valInfo:  null,
  },
  {
    title: 'Contract Enforcement',
    narration: 'The Contract Engine applies Basic Tier rules field-by-field. 5 of 9 fields are blocked. Each decision is logged immutably with a reason code.',
    activeNodes: ['contract'],
    activeEdges: [],
    blockedEdges: [],
    aggInfo:  null,
    ctInfo:   'Basic Tier · 4 allowed · 5 blocked',
    valInfo:  null,
  },
  {
    title: 'Validation & Signing',
    narration: 'The filtered payload moves to the Validator. Schema compliance is confirmed, restricted data is checked for leaks, and the response is signed.',
    activeNodes: ['contract', 'validator'],
    activeEdges: ['ct-val'],
    blockedEdges: [],
    aggInfo:  null,
    ctInfo:   'Enforcement complete',
    valInfo:  'Schema pass · signing…',
  },
  {
    title: 'Response Delivered',
    narration: 'The signed payload is released to the Consumer. Basic tier receives 4 of 9 fields. Each blocked field carries a policy reason code.',
    activeNodes: ['validator', 'consumer'],
    activeEdges: ['val-con'],
    blockedEdges: [],
    aggInfo:  null,
    ctInfo:   null,
    valInfo:  'Signed · 0x4fa3…c2d1',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fanPath(i) {
  const cy = pCY(i);
  return `M${PR},${cy} C${PR + 26},${cy} ${AGL - 15},${AGCY} ${AGL},${AGCY}`;
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ].join(',');
}

// ── EdgeSVG ───────────────────────────────────────────────────────────────────
const H_EDGES = [
  { id: 'agg-ct',  x1: AGR, y1: AGCY, x2: CTL, y2: CTCY },
  { id: 'ct-val',  x1: CTR, y1: CTCY, x2: VL,  y2: VCY  },
  { id: 'val-con', x1: VR,  y1: VCY,  x2: OL,  y2: OCY  },
];

function EdgeSVG({ step }) {
  const { activeEdges = [], blockedEdges = [] } = step;

  return (
    <svg className="pf-edge-layer" viewBox={`0 0 ${CW} ${CH}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pfgb" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Provider fan paths */}
        {PROVIDERS.map((p, i) => (
          <path key={`pp-${p.id}`} id={`pp-${p.id}`} d={fanPath(i)} fill="none" />
        ))}
        {/* Horizontal segment paths */}
        {H_EDGES.map(e => (
          <path key={`pp-${e.id}`} id={`pp-${e.id}`}
            d={`M${e.x1},${e.y1} L${e.x2},${e.y2}`} fill="none" />
        ))}
      </defs>

      {/* Provider fan edges */}
      {PROVIDERS.map((p, i) => {
        const isActive  = activeEdges.includes(p.id);
        const isBlocked = blockedEdges.includes(p.id);
        if (!isActive && !isBlocked) return null;
        return (
          <g key={p.id}>
            {isActive && (
              <>
                <path d={fanPath(i)} stroke={p.color} strokeWidth="5"
                  fill="none" opacity="0.05" filter="url(#pfgb)" />
                <path d={fanPath(i)} stroke={p.color} strokeWidth="1.2"
                  fill="none" opacity="0.45" strokeDasharray="5 16" className="pf-flow" />
                {[0, 0.4].map((off, idx) => (
                  <circle key={idx} r="2.5" fill={p.color} filter="url(#pfgb)" opacity="0.85">
                    <animateMotion dur="0.9s" begin={`${0.9 * off}s`} repeatCount="indefinite">
                      <mpath href={`#pp-${p.id}`} />
                    </animateMotion>
                  </circle>
                ))}
              </>
            )}
            {isBlocked && (
              <>
                <path d={fanPath(i)} stroke="#ef4444" strokeWidth="1"
                  fill="none" opacity="0.3" strokeDasharray="3 5" />
                <text x={PR + 14} y={pCY(i) + 4}
                  fontSize="8" fill="#ef4444" opacity="0.6" fontFamily="monospace">
                  BLOCKED
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Horizontal segment edges */}
      {H_EDGES.map(e => {
        if (!activeEdges.includes(e.id)) return null;
        const len = e.x2 - e.x1;
        return (
          <g key={e.id}>
            <path d={`M${e.x1},${e.y1} L${e.x2},${e.y2}`}
              stroke="#4f8ef7" strokeWidth="5" fill="none" opacity="0.06" filter="url(#pfgb)" />
            <path d={`M${e.x1},${e.y1} L${e.x2},${e.y2}`}
              stroke="#4f8ef7" strokeWidth="1.5" fill="none" opacity="0.55"
              strokeDasharray="5 14" className="pf-flow" />
            {[0, 0.5].map((off, idx) => (
              <circle key={idx} r="2.8" fill="#4f8ef7" filter="url(#pfgb)" opacity="0.9">
                <animateMotion
                  dur={`${(len / 80).toFixed(2)}s`}
                  begin={`${(len / 80) * off}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#pp-${e.id}`} />
                </animateMotion>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── Provider Card ─────────────────────────────────────────────────────────────
function ProviderCard({ p, i, dim }) {
  return (
    <div
      className={`pf-pcard pf-pcard--${p.status}${dim ? ' pf-dim' : ''}`}
      style={{ top: pY(i), '--c': p.color }}
    >
      <div className="pf-pcard-accent" />
      <div className="pf-pcard-body">
        <div className="pf-pcard-name">{p.label}</div>
        <div className="pf-pcard-foot">
          <span className="pf-pcard-sub">{p.sub}</span>
          <span className="pf-pcard-lat">{p.lat}</span>
        </div>
      </div>
    </div>
  );
}

// ── Schema data ───────────────────────────────────────────────────────────────
const AGG_SCHEMA = [
  { k: 'name',        v: '"Atishay Kasliwal"', t: 'str' },
  { k: 'age',         v: '34',                 t: 'num' },
  { k: 'condition',   v: '"T2D"',              t: 'str' },
  { k: 'bmi',         v: '24.8',               t: 'num' },
  { k: 'drive_score', v: '82',                 t: 'num' },
  { k: 'violations',  v: '1',                  t: 'num' },
  { k: 'credit',      v: '712',                t: 'num' },
  { k: 'location',    v: '[28.6, 77.2]',       t: 'arr' },
  { k: 'behavior',    v: '{pending}',           t: 'obj' },
];

const CT_SCHEMA = [
  { k: 'age',          pass: true,  note: ''           },
  { k: 'condition',    pass: true,  note: ''           },
  { k: 'bmi',          pass: false, note: 'blocked'    },
  { k: 'drive_score',  pass: true,  note: ''           },
  { k: 'violations',   pass: false, note: 'blocked'    },
  { k: 'credit',       pass: false, note: 'raw block'  },
  { k: 'income',       pass: false, note: 'n/a'        },
  { k: 'location',     pass: false, note: 'restricted' },
  { k: 'behavior_raw', pass: false, note: 'blocked'    },
];

const VAL_SCHEMA = [
  { k: 'age',           v: '34',            t: 'num' },
  { k: 'condition',     v: '"T2D"',         t: 'str' },
  { k: 'drive_score',   v: '82',            t: 'num' },
  { k: 'credit_idx',    v: '0.74',          t: 'num' },
  { k: '// 5 redacted', v: null,            t: 'dim' },
  { k: 'sig',           v: '0x4fa3…c2d1',   t: 'sig' },
];

// ── Shared mid-column node ────────────────────────────────────────────────────
function MidNode({ className, dim, icon, title, info, badge, children }) {
  return (
    <div className={`pf-mid ${className}${dim ? ' pf-dim' : ''}`}>
      <div className="pf-mid-head">
        <span className="pf-mid-icon">{icon}</span>
        <div className="pf-mid-head-text">
          <span className="pf-mid-title">{title}</span>
          {!dim && badge && <span className="pf-mid-badge">{badge}</span>}
        </div>
      </div>
      <div className="pf-mid-rule" />
      <div className="pf-mid-status">
        {info
          ? <span className="pf-mid-info">{info}</span>
          : <span className="pf-mid-idle">Idle</span>
        }
      </div>
      <div className="pf-mid-rule" />
      <div className="pf-mid-schema">
        {children}
      </div>
    </div>
  );
}

// ── Consumer Node ─────────────────────────────────────────────────────────────
const CONSUMER_FIELDS = [
  { n: 'age',          ok: true  },
  { n: 'condition',    ok: true  },
  { n: 'drive_score',  ok: true  },
  { n: 'credit_idx',   ok: true  },
  { n: 'bmi',          ok: false },
  { n: 'violations',   ok: false },
  { n: 'income',       ok: false },
  { n: 'location',     ok: false },
  { n: 'behavior_raw', ok: false },
];

function ConsumerNode({ step }) {
  const dim = !step.activeNodes.includes('consumer');
  const delivered = step.title === 'Response Delivered';
  const waiting   = !delivered && step.activeNodes.includes('consumer');

  return (
    <div className={`pf-consumer${dim ? ' pf-dim' : ''}`}>
      <div className="pf-consumer-head">
        <span className="pf-consumer-title">Consumer</span>
        <span className="pf-consumer-tier">Basic Tier</span>
      </div>
      <div className="pf-consumer-rule" />
      <div className="pf-consumer-body">
        {delivered ? (
          <div className="pf-consumer-fields">
            {CONSUMER_FIELDS.map(f => (
              <div key={f.n} className={`pf-cf pf-cf--${f.ok ? 'ok' : 'no'}`}>
                <span className="pf-cf-dot" />{f.n}
              </div>
            ))}
          </div>
        ) : (
          <div className="pf-consumer-idle">
            {waiting ? 'Awaiting response…' : 'Idle'}
          </div>
        )}
      </div>
      {delivered && (
        <div className="pf-consumer-foot">4 / 9 fields permitted</div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PolicyFabric() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  const prev = () => setStep(i => Math.max(0, i - 1));
  const next = () => setStep(i => Math.min(STEPS.length - 1, i + 1));

  return (
    <div className="pf-page project-detail-page">

      {/* Header */}
      <div className="pf-header">
        <div className="pf-header-text">
          <h1 className="pf-header-title">PolicyFabric</h1>
          <p className="pf-header-subtitle">
            A distributed data pipeline with contract-based access control.
            Step through the full lifecycle — from consumer request to filtered payload delivery.
          </p>
        </div>
        <div className="pf-header-badges">
          <span className="pf-header-badge">8 Providers</span>
          <span className="pf-header-badge">5 Columns</span>
          <span className="pf-header-badge">12 Steps</span>
          <span className="pf-header-badge pf-header-badge--live">● Live</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="pf-canvas-wrap">
        <div className="pf-canvas">
          <EdgeSVG step={s} />

          {/* Col 1 — Providers */}
          {PROVIDERS.map((p, i) => (
            <ProviderCard key={p.id} p={p} i={i}
              dim={!s.activeNodes.includes(p.id)} />
          ))}

          {/* Col labels */}
          <div className="pf-col-labels">
            <span style={{ left: PL, width: PW }}>Providers</span>
            <span style={{ left: AGL, width: AGW }}>Aggregator</span>
            <span style={{ left: CTL, width: CTW }}>Contract Engine</span>
            <span style={{ left: VL, width: VW }}>Validator</span>
            <span style={{ left: OL, width: OW }}>Consumer</span>
          </div>

          {/* Col 2 — Aggregator */}
          <MidNode
            className="pf-agg"
            dim={!s.activeNodes.includes('aggregator')}
            icon="⬡"
            title="Aggregator"
            info={s.aggInfo}
            badge={s.aggInfo ? 'collecting' : null}
          >
            {AGG_SCHEMA.map(f => (
              <div key={f.k} className="pf-sr">
                <span className="pf-sr-k">{f.k}</span>
                <span className={`pf-sr-v pf-sr-v--${f.t}`}>{f.v}</span>
              </div>
            ))}
          </MidNode>

          {/* Col 3 — Contract Engine */}
          <MidNode
            className="pf-ct"
            dim={!s.activeNodes.includes('contract')}
            icon="◈"
            title="Contract Engine"
            info={s.ctInfo}
            badge={s.ctInfo ? 'enforcing' : null}
          >
            {CT_SCHEMA.map(f => (
              <div key={f.k} className={`pf-sr pf-sr--ct${f.pass ? ' pf-sr--pass' : ' pf-sr--fail'}`}>
                <span className="pf-sr-mark">{f.pass ? '✓' : '✗'}</span>
                <span className="pf-sr-k">{f.k}</span>
                {f.note && <span className="pf-sr-note">{f.note}</span>}
              </div>
            ))}
          </MidNode>

          {/* Col 4 — Validator */}
          <MidNode
            className="pf-val"
            dim={!s.activeNodes.includes('validator')}
            icon="◉"
            title="Validator"
            info={s.valInfo}
            badge={s.valInfo ? 'active' : null}
          >
            {VAL_SCHEMA.map(f => (
              <div key={f.k} className="pf-sr">
                <span className="pf-sr-k">{f.k}</span>
                {f.v !== null
                  ? <span className={`pf-sr-v pf-sr-v--${f.t}`}>{f.v}</span>
                  : null
                }
              </div>
            ))}
          </MidNode>

          {/* Col 5 — Consumer */}
          <ConsumerNode step={s} />
        </div>
      </div>

      {/* Step Panel */}
      <div className="pf-step-panel">
        <div className="pf-progress">
          <div className="pf-progress-bar"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="pf-step-content">
          <span className="pf-step-num">{String(step + 1).padStart(2, '0')} / {STEPS.length}</span>
          <h2 className="pf-step-title">{s.title}</h2>
          <p className="pf-step-narration">{s.narration}</p>
        </div>
        <div className="pf-step-controls">
          <button className="pf-btn" onClick={prev} disabled={step === 0}>← Back</button>
          <div className="pf-step-dots">
            {STEPS.map((_, i) => (
              <button key={i}
                className={`pf-dot-btn${i === step ? ' pf-dot-btn--on' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
          <button className="pf-btn pf-btn--primary" onClick={next}
            disabled={step === STEPS.length - 1}>
            {step === STEPS.length - 1 ? 'Done' : 'Continue →'}
          </button>
        </div>
      </div>

    </div>
  );
}
