import React, { useState } from 'react';
import './PolicyFabric.css';

// ── Canvas geometry ────────────────────────────────────────────────────────────
const CW = 900, CH = 540;
const PL = 16, PW = 175, PH = 52, PG = 10;
const IL = 244, IW = 234, IH = 300;
const IT = (CH - IH) / 2;   // 120
const IRE = IL + IW;          // 478
const ICY = CH / 2;           // 270
const OL = 530, OW = 190, OH = 260;
const OT = (CH - OH) / 2;   // 140
const OCY = CH / 2;           // 270
// 8*52 + 7*10 = 486 → PS = (540-486)/2 = 27
const PS = (CH - (8 * PH + 7 * PG)) / 2;
const pY  = i => PS + i * (PH + PG);
const pCY = i => pY(i) + PH / 2;

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

const STEPS = [
  {
    title: 'Consumer Sends Request',
    narration: 'A user requests a personalized insurance policy quote. The Consumer node initiates a data request to PolicyFabric, specifying their contract tier.',
    activeNodes: ['consumer'],
    activeEdges: [],
    insStage: null,
    log: null,
  },
  {
    title: 'Insurance Node Receives',
    narration: 'The request arrives at the Insurance Node. It parses the contract tier and begins orchestrating parallel data fetches from all 8 registered providers.',
    activeNodes: ['consumer', 'insurance'],
    activeEdges: [],
    insStage: null,
    log: '→ Parsing contract tier: Basic',
  },
  {
    title: 'Provider Discovery',
    narration: '8 data providers are registered in the system. The Insurance Node maps each provider to the fields it can supply, ranked by contract tier eligibility.',
    activeNodes: ['insurance', ...PROVIDERS.map(p => p.id)],
    activeEdges: [],
    insStage: 'aggregator',
    log: '→ 8 providers discovered',
  },
  {
    title: 'Health Data Fetched',
    narration: 'Health Records API responds in 120ms. Medical History returns via FHIR Gateway in 89ms. Both payloads are queued in the Aggregator.',
    activeNodes: ['health-api', 'med-history', 'insurance'],
    activeEdges: ['health-api', 'med-history'],
    insStage: 'aggregator',
    log: '→ Health payloads merged',
  },
  {
    title: 'Telematics Fetched',
    narration: 'Driving Score returns at 340ms — flagged stale (3h old). Telematics Hub responds fresh at 78ms. The Validator queues a staleness warning for driving data.',
    activeNodes: ['driving', 'telematics', 'insurance'],
    activeEdges: ['driving', 'telematics'],
    insStage: 'aggregator',
    log: '⚠ Stale flag: drive_score',
  },
  {
    title: 'Financial Data Fetched',
    narration: 'Credit Bureau returns a financial score in 156ms. Under Basic tier, raw income and credit details are policy-blocked — only the aggregate score index passes through.',
    activeNodes: ['financial', 'insurance'],
    activeEdges: ['financial'],
    insStage: 'aggregator',
    log: '→ Financial score queued',
  },
  {
    title: 'PII Access Blocked',
    narration: 'Location Service is marked RESTRICTED. No query is dispatched. The Contract Engine logs a policy block and marks geolocation fields unavailable for this request.',
    activeNodes: ['location', 'insurance'],
    activeEdges: [],
    blockedEdges: ['location'],
    insStage: 'contract',
    log: '✕ PII block logged: location',
  },
  {
    title: 'Behavioral & Claims',
    narration: 'Behavioral Data is still pending at 445ms. Claims History returns from the internal DB instantly at 190ms. Aggregator marks behavioral as pending.',
    activeNodes: ['behavioral', 'claims', 'insurance'],
    activeEdges: ['behavioral', 'claims'],
    insStage: 'aggregator',
    log: '→ Claims merged; behavioral pending',
  },
  {
    title: 'Aggregation Complete',
    narration: '7 providers returned data. 1 blocked (PII). 1 stale (telematics). The unified data object advances to the Contract Engine for policy evaluation.',
    activeNodes: ['insurance'],
    activeEdges: [],
    insStage: 'aggregator',
    log: '→ Aggregation complete: 7/8',
  },
  {
    title: 'Contract Enforcement',
    narration: 'The Contract Engine applies tier rules field-by-field. Basic tier strips 5 of 9 fields. Premium tier allows 7 of 9. Every decision is logged immutably.',
    activeNodes: ['insurance'],
    activeEdges: [],
    insStage: 'contract',
    log: '→ 5 fields stripped (Basic tier)',
  },
  {
    title: 'Validation & Signing',
    narration: 'The Validator confirms schema compliance, checks for restricted data leaks, and signs the response with a policy hash before releasing it downstream.',
    activeNodes: ['insurance'],
    activeEdges: [],
    insStage: 'validator',
    log: '→ Signature: 0x4fa3…c2d1',
  },
  {
    title: 'Response Delivered',
    narration: 'The signed, filtered payload is delivered to the Consumer. Basic tier receives 4 of 9 fields. Each blocked field returns a policy reason code instead of data.',
    activeNodes: ['insurance', 'consumer'],
    activeEdges: ['out'],
    insStage: 'validator',
    log: '→ Response dispatched: 4/9 fields',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function edgePath(i) {
  const cy = pCY(i);
  return `M${PL + PW},${cy} C${PL + PW + 55},${cy} ${IL - 55},${ICY} ${IL},${ICY}`;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ── EdgeSVG ───────────────────────────────────────────────────────────────────
function EdgeSVG({ step }) {
  const { activeEdges = [], blockedEdges = [] } = step;

  return (
    <svg className="pf-edge-layer" viewBox={`0 0 ${CW} ${CH}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pfgb" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {PROVIDERS.map((p, i) => (
          <path key={`pp-${p.id}`} id={`pp-${p.id}`} d={edgePath(i)} fill="none" />
        ))}
        <path id="pp-out" d={`M${IRE},${ICY} L${OL},${OCY}`} fill="none" />
      </defs>

      {PROVIDERS.map((p, i) => {
        const isActive  = activeEdges.includes(p.id);
        const isBlocked = blockedEdges.includes(p.id);
        if (!isActive && !isBlocked) return null;

        return (
          <g key={p.id}>
            {isActive && (
              <>
                <path d={edgePath(i)} stroke={p.color} strokeWidth="5"
                  fill="none" opacity="0.06" filter="url(#pfgb)" />
                <path d={edgePath(i)} stroke={p.color} strokeWidth="1.2"
                  fill="none" opacity="0.45" strokeDasharray="6 18" className="pf-flow" />
                <circle r="2.5" fill={p.color} filter="url(#pfgb)" opacity="0.85">
                  <animateMotion dur="1.1s" begin="0s" repeatCount="indefinite">
                    <mpath href={`#pp-${p.id}`} />
                  </animateMotion>
                </circle>
                <circle r="2.5" fill={p.color} filter="url(#pfgb)" opacity="0.85">
                  <animateMotion dur="1.1s" begin="0.37s" repeatCount="indefinite">
                    <mpath href={`#pp-${p.id}`} />
                  </animateMotion>
                </circle>
              </>
            )}
            {isBlocked && (
              <>
                <path d={edgePath(i)} stroke="#ef4444" strokeWidth="1"
                  fill="none" opacity="0.35" strokeDasharray="3 6" />
                <text x={PL + PW + 20} y={pCY(i) + 4}
                  fontSize="8" fill="#ef4444" opacity="0.65" fontFamily="monospace" letterSpacing="0.5">
                  BLOCKED
                </text>
              </>
            )}
          </g>
        );
      })}

      {activeEdges.includes('out') && (
        <g>
          <path d={`M${IRE},${ICY} L${OL},${OCY}`}
            stroke="#22c55e" strokeWidth="5" fill="none" opacity="0.07" filter="url(#pfgb)" />
          <path d={`M${IRE},${ICY} L${OL},${OCY}`}
            stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.7"
            strokeDasharray="6 16" className="pf-flow" />
          {[0, 0.5].map((off, idx) => (
            <circle key={idx} r="3" fill="#22c55e" filter="url(#pfgb)" opacity="0.9">
              <animateMotion dur="0.75s" begin={`${0.75 * off}s`} repeatCount="indefinite">
                <mpath href="#pp-out" />
              </animateMotion>
            </circle>
          ))}
        </g>
      )}
    </svg>
  );
}

// ── ProviderCard ──────────────────────────────────────────────────────────────
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

// ── InsuranceNode ─────────────────────────────────────────────────────────────
const INS_STAGES = [
  { id: 'aggregator', label: 'Aggregator',      color: '#4f8ef7' },
  { id: 'contract',   label: 'Contract Engine', color: '#8b5cf6' },
  { id: 'validator',  label: 'Validator',        color: '#22c55e' },
];

function InsuranceNode({ step }) {
  const dim = !step.activeNodes.includes('insurance');
  const { insStage, log } = step;

  return (
    <div className={`pf-ins${dim ? ' pf-dim' : ''}`}>
      <div className="pf-ins-head">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <polygon
            points="6.5,1 11.5,3.75 11.5,9.25 6.5,12 1.5,9.25 1.5,3.75"
            stroke="#4f8ef7" strokeWidth="1.1" fill="rgba(79,142,247,0.12)"
          />
        </svg>
        <span className="pf-ins-title">Insurance Node</span>
      </div>

      <div className="pf-ins-rule" />

      <div className="pf-ins-stages">
        {INS_STAGES.map(s => (
          <div
            key={s.id}
            className={`pf-stage${insStage === s.id ? ' pf-stage--on' : ''}`}
            style={{ '--sc': s.color, '--sc-rgb': hexToRgb(s.color) }}
          >
            <span className={`pf-stage-led${insStage === s.id ? ' pf-stage-led--on' : ''}`} />
            <span className="pf-stage-name">{s.label}</span>
            {insStage === s.id && <span className="pf-stage-pill">active</span>}
          </div>
        ))}
      </div>

      {log && (
        <>
          <div className="pf-ins-rule" />
          <div className="pf-ins-log">{log}</div>
        </>
      )}
    </div>
  );
}

// ── ConsumerNode ──────────────────────────────────────────────────────────────
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
  const waiting = !delivered && step.activeNodes.includes('consumer');

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
            A distributed data architecture with contract-based access control.
            Step through the full request lifecycle — from consumer request to filtered payload delivery.
          </p>
        </div>
        <div className="pf-header-badges">
          <span className="pf-header-badge">8 Providers</span>
          <span className="pf-header-badge">12 Steps</span>
          <span className="pf-header-badge pf-header-badge--live">● Live</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="pf-canvas-wrap">
        <div className="pf-canvas">
          <EdgeSVG step={s} />
          {PROVIDERS.map((p, i) => (
            <ProviderCard
              key={p.id} p={p} i={i}
              dim={!s.activeNodes.includes(p.id)}
            />
          ))}
          <InsuranceNode step={s} />
          <ConsumerNode step={s} />
        </div>
      </div>

      {/* Step Panel */}
      <div className="pf-step-panel">
        <div className="pf-progress">
          <div
            className="pf-progress-bar"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
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
              <button
                key={i}
                className={`pf-dot-btn${i === step ? ' pf-dot-btn--on' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
          <button
            className="pf-btn pf-btn--primary"
            onClick={next}
            disabled={step === STEPS.length - 1}
          >
            {step === STEPS.length - 1 ? 'Done' : 'Continue →'}
          </button>
        </div>
      </div>

    </div>
  );
}
