import React, { useState, useEffect, useCallback } from 'react';
import './PolicyFabric.css';

// ── Config ──────────────────────────────────────────────────────────────────

const CONTRACTS = {
  basic: {
    label: 'Basic Tier',
    health:  [
      { field: 'age',       allowed: true  },
      { field: 'condition', allowed: true  },
      { field: 'location',  allowed: false, reason: 'PII restricted' },
    ],
    driving: [
      { field: 'score',      allowed: true  },
      { field: 'violations', allowed: false, reason: 'Contract rule' },
      { field: 'raw_logs',   allowed: false, reason: 'Contract rule' },
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
      { field: 'raw_logs',   allowed: false, reason: 'Requires Enterprise tier' },
    ],
  },
};

const STAGES = ['Validate', 'Aggregate', 'Enforce Policy', 'Transform', 'Respond'];

function ts() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
}

// ── Story Flow Graph (Sequence Diagram) ─────────────────────────────────────
//
//  Columns:  Consumer (CX)  |  Insurance Node (IX)  |  Providers (PX)
//  Story reads top → bottom as events unfold in time.

const CX = 44, IX = 138, PX = 232;

// Which sequence step each pipeline stage lights up
const STAGE_TO_STEP = { 0: 1, 1: 2, 2: 4, 3: 4, 4: 5 };

function Arrowhead({ x, y, dir = 'right', color = 'blue' }) {
  const COLORS = {
    blue:   'rgba(79,142,247,0.85)',
    green:  'rgba(34,197,94,0.85)',
    orange: 'rgba(245,158,11,0.85)',
  };
  const fill = COLORS[color];
  // Small 6×5 triangle pointing right; flipped via scaleX for left-pointing
  const pts = dir === 'right'
    ? `${x},${y-3} ${x+6},${y} ${x},${y+3}`
    : `${x},${y-3} ${x-6},${y} ${x},${y+3}`;
  return <polygon points={pts} fill={fill} />;
}

function SeqStep({ lit, done, children }) {
  const cls = lit ? 'pf-seq--lit' : done ? 'pf-seq--done' : 'pf-seq--idle';
  return <g className={`pf-seq ${cls}`}>{children}</g>;
}

function NetworkGraph({ isStale, active, activeStage }) {
  const lit  = (step) => active && STAGE_TO_STEP[activeStage] === step;
  const done = (step) => active && STAGE_TO_STEP[activeStage] > step;

  // contract from parent isn't passed, but we can show generic field names
  return (
    <svg viewBox="0 0 276 388" className="pf-svg" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="pfgb" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pfgw" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Actor headers ───────────────────────────── */}
      {/* Consumer */}
      <rect x={CX-28} y={6} width={56} height={24} rx={5} className="pf-actor" />
      <text x={CX} y={22} textAnchor="middle" className="pf-actor-lbl">Consumer</text>

      {/* Insurance Node */}
      <rect x={IX-44} y={6} width={88} height={24} rx={5}
        className="pf-actor pf-actor--ins" style={{ filter: 'url(#pfgb)' }} />
      <text x={IX} y={22} textAnchor="middle" className="pf-actor-lbl pf-actor-lbl--ins">Insurance Node</text>

      {/* Providers */}
      <rect x={PX-30} y={6} width={60} height={24} rx={5} className="pf-actor" />
      <text x={PX} y={18} textAnchor="middle" className="pf-actor-lbl" style={{ fontSize: '6.5px' }}>Provider A</text>
      <text x={PX} y={27} textAnchor="middle" className="pf-actor-sub">Provider B</text>

      {/* ── Lifelines ───────────────────────────────── */}
      <line x1={CX} y1={30} x2={CX} y2={378} className="pf-lifeline" />
      <line x1={IX} y1={30} x2={IX} y2={378} className="pf-lifeline pf-lifeline--ins" />
      <line x1={PX} y1={30} x2={PX} y2={378} className="pf-lifeline" />

      {/* Insurance activation box (taller when running) */}
      {active && (
        <rect x={IX-5} y={40} width={10} height={330} rx={2} className="pf-activation" />
      )}

      {/* ── Step ① — Consumer sends request ─────────── y≈70 */}
      <SeqStep lit={lit(1)} done={done(1)}>
        {/* Step label */}
        <text x={CX - 6} y={58} textAnchor="end" className="pf-snum">①</text>
        <text x={(CX + IX) / 2} y={57} textAnchor="middle" className="pf-sphase">REQUEST</text>
        {/* Arrow: Consumer → Insurance */}
        <line x1={CX + 2} y1={66} x2={IX - 8} y2={66} className="pf-sarrow pf-sarrow--req" />
        <Arrowhead x={IX - 8} y={66} dir="right" color="blue" />
        <text x={(CX + IX) / 2} y={77} textAnchor="middle" className="pf-sdesc">send data request</text>
      </SeqStep>

      {/* ── Step ② — Insurance fetches from providers ─ y≈116 */}
      <SeqStep lit={lit(2)} done={done(2)}>
        <text x={IX - 6} y={108} textAnchor="end" className="pf-snum">②</text>
        <text x={(IX + PX) / 2} y={107} textAnchor="middle" className="pf-sphase">FETCH</text>
        {/* Arrow: Insurance → Providers (fetch health) */}
        <line x1={IX + 8} y1={115} x2={PX - 8} y2={115} className="pf-sarrow pf-sarrow--fetch" />
        <Arrowhead x={PX - 8} y={115} dir="right" color="blue" />
        <text x={(IX + PX) / 2} y={126} textAnchor="middle" className="pf-sdesc">health data (120ms)</text>
        {/* Arrow: Insurance → Providers (fetch driving) */}
        <line x1={IX + 8} y1={141} x2={PX - 8} y2={141} className="pf-sarrow pf-sarrow--fetch" strokeDasharray="4 3" />
        <Arrowhead x={PX - 8} y={141} dir="right" color="blue" />
        <text x={(IX + PX) / 2} y={152} textAnchor="middle" className="pf-sdesc">driving data (340ms)</text>
      </SeqStep>

      {/* ── Step ③ — Providers return data ─────────── y≈186 */}
      <SeqStep lit={lit(3)} done={done(3)}>
        <text x={PX + 6} y={178} textAnchor="start" className="pf-snum">③</text>
        <text x={(IX + PX) / 2} y={177} textAnchor="middle" className="pf-sphase">DATA IN</text>
        {/* Health data return */}
        <line x1={PX - 8} y1={186} x2={IX + 8} y2={186} className="pf-sarrow pf-sarrow--data" />
        <Arrowhead x={IX + 8} y={186} dir="left" color="green" />
        <text x={(IX + PX) / 2} y={197} textAnchor="middle" className="pf-sdesc">age · condition · location</text>
        {/* Driving data return — stale or fresh */}
        <line x1={PX - 8} y1={212} x2={IX + 8} y2={212}
          className={`pf-sarrow ${isStale ? 'pf-sarrow--stale' : 'pf-sarrow--data'}`} />
        <Arrowhead x={IX + 8} y={212} dir="left" color={isStale ? 'orange' : 'green'} />
        <text x={(IX + PX) / 2} y={222} textAnchor="middle"
          className={`pf-sdesc ${isStale ? 'pf-sdesc--warn' : ''}`}>
          {isStale ? '⚠ score only · stale 3h' : 'score · violations · logs'}
        </text>
      </SeqStep>

      {/* ── Step ④ — Policy enforced ────────────────── y≈250 */}
      <SeqStep lit={lit(4)} done={done(4)}>
        <text x={IX - 6} y={244} textAnchor="end" className="pf-snum">④</text>
        {/* Policy box on Insurance lifeline */}
        <rect x={IX - 46} y={248} width={92} height={26} rx={4} className="pf-policy-box" />
        <text x={IX} y={265} textAnchor="middle" className="pf-policy-lbl">Policy Enforced</text>
        {/* Field breakdown */}
        <text x={IX} y={285} textAnchor="middle" className="pf-sdesc">
          <tspan fill="rgba(34,197,94,0.8)">age ✓  score ✓</tspan>
          <tspan>  </tspan>
          <tspan fill="rgba(239,68,68,0.65)">location ✗  violations ✗</tspan>
        </text>
      </SeqStep>

      {/* ── Step ⑤ — Consumer receives filtered response ─ y≈320 */}
      <SeqStep lit={lit(5)} done={done(5)}>
        <text x={IX - 6} y={312} textAnchor="end" className="pf-snum">⑤</text>
        <text x={(CX + IX) / 2} y={311} textAnchor="middle" className="pf-sphase pf-sphase--resp">RESPOND</text>
        {/* Arrow: Insurance → Consumer */}
        <line x1={IX - 8} y1={320} x2={CX + 2} y2={320} className="pf-sarrow pf-sarrow--resp" />
        <Arrowhead x={CX + 2} y={320} dir="left" color="green" />
        <text x={(CX + IX) / 2} y={332} textAnchor="middle" className="pf-sdesc pf-sdesc--resp">
          3 of 5 fields shared
        </text>
        {/* End marker dots on lifelines */}
        <circle cx={CX} cy={348} r={4} className="pf-lifeline-end" />
        <circle cx={IX} cy={348} r={4} className="pf-lifeline-end pf-lifeline-end--ins" />
        <circle cx={PX} cy={348} r={4} className="pf-lifeline-end" />
      </SeqStep>
    </svg>
  );
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

function Pipeline({ activeStage, logs }) {
  return (
    <div className="pf-pipeline">
      <div className="pf-stages">
        {STAGES.map((s, i) => {
          const st = activeStage === -1 ? 'idle'
            : i < activeStage  ? 'done'
            : i === activeStage ? 'active'
            : 'wait';
          return (
            <React.Fragment key={s}>
              <div className={`pf-stage pf-stage--${st}`}>
                <div className="pf-stage-dot">
                  {st === 'done' && <span className="pf-stage-check">✓</span>}
                </div>
                <span className="pf-stage-lbl">{s}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`pf-conn ${i < activeStage ? 'done' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="pf-live-logs">
        {logs.length === 0 && (
          <span className="pf-live-logs-empty">Pipeline idle — press Send Payload to run</span>
        )}
        {logs.map((l, i) => (
          <div key={i} className={`pf-llog pf-llog--${l.type}`}>
            <span className="pf-llog-icon">{l.type === 'warn' ? '⚠' : '✔'}</span>
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Contract Panel ───────────────────────────────────────────────────────────

function FieldRow({ field, allowed, reason }) {
  const [tip, setTip] = useState(false);
  return (
    <div className={`pf-frow ${allowed ? 'pf-frow--ok' : 'pf-frow--no'}`}>
      <span className="pf-ficon">{allowed ? '✅' : '❌'}</span>
      <span className="pf-fname">{field}</span>
      {!allowed && (
        <span className="pf-tip-wrap"
          onMouseEnter={() => setTip(true)}
          onMouseLeave={() => setTip(false)}>
          <span className="pf-tip-icon">ⓘ</span>
          {tip && (
            <div className="pf-tip">Access denied due to contract rule: {reason}</div>
          )}
        </span>
      )}
    </div>
  );
}

function ContractPanel({ contract }) {
  const c = CONTRACTS[contract];
  return (
    <div className="pf-contract">
      <div className="pf-contract-meta">
        <span className="pf-contract-badge">ACTIVE CONTRACT</span>
        <h3 className="pf-contract-name">{c.label}</h3>
      </div>

      <div className="pf-csection">
        <div className="pf-csection-lbl">HEALTH DATA</div>
        {c.health.map(f => <FieldRow key={f.field} {...f} />)}
      </div>

      <div className="pf-cdivider" />

      <div className="pf-csection">
        <div className="pf-csection-lbl">DRIVING DATA</div>
        {c.driving.map(f => <FieldRow key={f.field} {...f} />)}
      </div>

      <div className="pf-contract-note">
        Fields marked as restricted require Premium access
      </div>
    </div>
  );
}

// ── Bottom Drawer ────────────────────────────────────────────────────────────

const BASE_TABLE = [
  { field: 'Name',          owner: 'Alice', basic: 'Alice',       premium: 'Alice'  },
  { field: 'Age',           owner: '34',    basic: 'Hidden',      premium: '34'     },
  { field: 'Condition',     owner: 'Good',  basic: 'Hidden',      premium: 'Good'   },
  { field: 'Driving Score', owner: '82',    basic: '82 (Cached)', premium: '82'     },
  { field: 'Location',      owner: 'NYC',   basic: 'Hidden',      premium: 'NYC'    },
];

function BottomDrawer({ open, onToggle, systemLogs, contract }) {
  const [tab, setTab]         = useState('logs');
  const [viewMode, setViewMode] = useState('consumer');

  const rows = BASE_TABLE.map(r => ({
    ...r,
    consumer: r[contract],
  }));
  const visible = rows.filter(r => r.consumer !== 'Hidden').length;

  return (
    <div className={`pf-drawer ${open ? 'pf-drawer--open' : ''}`}>
      <button className="pf-drawer-handle" onClick={onToggle}>
        <span className="pf-drawer-handle-label">System Logs &amp; Data View</span>
        <span className="pf-drawer-handle-chevron">{open ? '▾' : '▴'}</span>
      </button>

      <div className="pf-drawer-body">
        <div className="pf-tabs">
          <button className={`pf-tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>Logs</button>
          <button className={`pf-tab ${tab === 'data' ? 'active' : ''}`} onClick={() => setTab('data')}>Data View</button>
        </div>

        {tab === 'logs' && (
          <div className="pf-log-list">
            {systemLogs.map((l, i) => (
              <div key={i} className={`pf-log pf-log--${l.type}`}>
                <span className="pf-log-ts">[{l.time}]</span>
                <span className="pf-log-msg">{l.msg}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'data' && (
          <div className="pf-data">
            <div className="pf-data-toggle">
              <button className={`pf-dtog ${viewMode === 'consumer' ? 'active' : ''}`}
                onClick={() => setViewMode('consumer')}>Consumer</button>
              <button className={`pf-dtog ${viewMode === 'owner' ? 'active' : ''}`}
                onClick={() => setViewMode('owner')}>Owner</button>
            </div>
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Owner</th>
                  <th>Consumer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.field} className={r.consumer === 'Hidden' ? 'pf-tr--hidden' : ''}>
                    <td>{r.field}</td>
                    <td className="pf-td-owner">
                      {viewMode === 'owner' ? r.owner : <span className="pf-td-redact">—</span>}
                    </td>
                    <td className={r.consumer === 'Hidden' ? 'pf-td-hidden' : 'pf-td-ok'}>
                      {r.consumer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pf-data-summary">
              Consumer sees {visible} of {rows.length} fields
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PolicyFabric() {
  const [contract,    setContract]    = useState('basic');
  const [isStale,     setIsStale]     = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [running,     setRunning]     = useState(false);
  const [inlineLogs,  setInlineLogs]  = useState([]);
  const [systemLogs,  setSystemLogs]  = useState([
    { time: '12:01:02', msg: 'Request received',   type: 'info' },
    { time: '12:01:02', msg: 'Contract validated', type: 'ok'   },
  ]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const c = CONTRACTS[contract];
  const allowed = [...c.health, ...c.driving].filter(f => f.allowed).length;
  const total   = c.health.length + c.driving.length;

  const addLog = useCallback((msg, type) => {
    const t = ts();
    setSystemLogs(prev => [...prev, { time: t, msg, type }]);
    setInlineLogs(prev => [...prev.slice(-5), { msg, type }]);
  }, []);

  // Update logs when contract switches
  useEffect(() => {
    addLog(`Contract switched to ${CONTRACTS[contract].label}`, 'info');
    setInlineLogs([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  // Update logs when stale toggles
  useEffect(() => {
    if (isStale) addLog('Provider B marked stale (3h old)', 'warn');
    else         addLog('Provider B recovered — data fresh', 'ok');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStale]);

  const sendPayload = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setInlineLogs([]);

    const steps = [
      { delay: 480, msg: 'Contract validated',                              type: 'ok'   },
      { delay: 420, msg: isStale ? 'Provider B stale (3h old)' : 'Providers healthy', type: isStale ? 'warn' : 'ok' },
      { delay: 560, msg: 'Policy enforced',                                 type: 'ok'   },
      { delay: 380, msg: 'Response transformed',                            type: 'ok'   },
      { delay: 480, msg: `Response generated (${allowed} fields)`,          type: 'ok'   },
    ];

    for (let i = 0; i < steps.length; i++) {
      setActiveStage(i);
      await new Promise(r => setTimeout(r, steps[i].delay));
      addLog(steps[i].msg, steps[i].type);
    }

    setActiveStage(steps.length); // all done
    await new Promise(r => setTimeout(r, 700));
    setActiveStage(-1);
    setRunning(false);
  }, [running, isStale, allowed, addLog]);

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

      {/* ── Top bar ── */}
      <div className="pf-topbar">
        <div className="pf-logo">
          <svg className="pf-logo-icon" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 18.66,6 18.66,14 10,19 1.34,14 1.34,6" stroke="#4f8ef7" strokeWidth="1.5" fill="rgba(79,142,247,0.08)" />
            <polygon points="10,5 15,7.5 15,12.5 10,15 5,12.5 5,7.5" fill="#4f8ef7" opacity="0.5" />
          </svg>
          <span className="pf-logo-text">PolicyFabric</span>
        </div>

        <div className="pf-topbar-center">
          <select className="pf-selector" value={contract} onChange={e => setContract(e.target.value)}>
            <option value="basic">Basic Tier</option>
            <option value="premium">Premium Tier</option>
          </select>
        </div>

        <div className="pf-topbar-right">
          <span className="pf-live-dot" />
          <span className="pf-live-lbl">Live</span>
          <span className="pf-metrics-pill">Latency: 320ms | Fields: {allowed}/{total}</span>
        </div>
      </div>

      {/* ── Three panels ── */}
      <div className="pf-layout">
        {/* LEFT — Topology */}
        <div className="pf-panel pf-panel--left">
          <div className="pf-panel-head">Data Flow Story</div>
          <NetworkGraph isStale={isStale} active={running} activeStage={activeStage} />
          <label className="pf-stale-ctrl">
            <input type="checkbox" checked={isStale} onChange={e => setIsStale(e.target.checked)} />
            <span className="pf-stale-ctrl-lbl">Simulate Stale Provider B</span>
          </label>
        </div>

        {/* CENTER — Pipeline */}
        <div className="pf-panel pf-panel--center">
          <div className="pf-panel-head">Request Pipeline</div>
          <button
            className={`pf-cta ${running ? 'pf-cta--busy' : ''}`}
            onClick={sendPayload}
            disabled={running}
          >
            {running
              ? <><span className="pf-spinner" /> Processing…</>
              : 'Send Payload'
            }
          </button>
          <Pipeline activeStage={activeStage} logs={inlineLogs} />
        </div>

        {/* RIGHT — Contract */}
        <div className="pf-panel pf-panel--right">
          <div className="pf-panel-head">Active Contract</div>
          <ContractPanel contract={contract} />
        </div>
      </div>

      {/* ── Bottom drawer ── */}
      <BottomDrawer
        open={drawerOpen}
        onToggle={() => setDrawerOpen(v => !v)}
        systemLogs={systemLogs}
        contract={contract}
      />
    </div>
  );
}
