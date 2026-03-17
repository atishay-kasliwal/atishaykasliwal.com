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

// ── SVG Network Graph ────────────────────────────────────────────────────────

const NODES = {
  insurance: { x: 150, y: 152, r: 28, label: 'Insurance Node', sub: 'Core',        latency: '45ms'  },
  providerA: { x: 64,  y: 68,  r: 20, label: 'Provider A',     sub: 'Health Data',  latency: '120ms' },
  providerB: { x: 236, y: 68,  r: 20, label: 'Provider B',     sub: 'Driving Data', latency: '340ms' },
  consumer:  { x: 150, y: 240, r: 20, label: 'Consumer',       sub: 'Requester',    latency: '80ms'  },
};

const EDGES = [
  { id: 'a',   from: 'providerA', to: 'insurance' },
  { id: 'b',   from: 'providerB', to: 'insurance' },
  { id: 'out', from: 'insurance', to: 'consumer'  },
];

function NetworkGraph({ isStale, active }) {
  return (
    <svg viewBox="0 0 300 310" className="pf-svg">
      <defs>
        <filter id="pfgb" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pfgw" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Hidden paths for animateMotion */}
      {EDGES.map(e => {
        const f = NODES[e.from], t = NODES[e.to];
        return <path key={`hp-${e.id}`} id={`pf-ep-${e.id}`} d={`M${f.x} ${f.y} L${t.x} ${t.y}`} fill="none" stroke="none" />;
      })}

      {/* Visible edges */}
      {EDGES.map(e => {
        const f = NODES[e.from], t = NODES[e.to];
        const stale = e.id === 'b' && isStale;
        return (
          <line key={e.id} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
            className={`pf-edge ${stale ? 'pf-edge--stale' : 'pf-edge--live'}`} />
        );
      })}

      {/* Animated pulses */}
      {active && EDGES.map(e => {
        const stale = e.id === 'b' && isStale;
        const dur = stale ? 2.2 : 1.6;
        return [0, 0.35, 0.7].map((off, oi) => (
          <circle key={`${e.id}-${oi}`} r="3.5"
            className={`pf-pulse ${stale ? 'pf-pulse--stale' : 'pf-pulse--live'}`}>
            <animateMotion dur={`${dur}s`} begin={`${off * dur}s`} repeatCount="indefinite">
              <mpath href={`#pf-ep-${e.id}`} />
            </animateMotion>
          </circle>
        ));
      })}

      {/* Nodes */}
      {Object.entries(NODES).map(([key, n]) => {
        const core  = key === 'insurance';
        const stale = key === 'providerB' && isStale;
        const cls   = stale ? 'stale' : core ? 'core' : 'norm';
        return (
          <g key={key}>
            <circle cx={n.x} cy={n.y} r={n.r + 9} className={`pf-ring pf-ring--${cls}`} />
            <circle cx={n.x} cy={n.y} r={n.r}     className={`pf-body pf-body--${cls}`} />
            <text x={n.x} y={n.y - 4}  textAnchor="middle" className="pf-nlabel">{n.label}</text>
            <text x={n.x} y={n.y + 7}  textAnchor="middle" className="pf-nsub">{n.sub}</text>
            {/* Latency badge */}
            <rect x={n.x + n.r - 2} y={n.y - n.r - 15} width="34" height="13" rx="4" className="pf-badge-bg" />
            <text x={n.x + n.r + 15}  y={n.y - n.r - 6}  textAnchor="middle" className="pf-badge-txt">{n.latency}</text>
            {/* Status dot */}
            <circle cx={n.x - n.r + 4} cy={n.y - n.r + 4} r="4"
              className={`pf-status-dot pf-status-dot--${cls}`} />
            {stale && (
              <text x={n.x} y={n.y + n.r + 15} textAnchor="middle" className="pf-stale-lbl">
                Stale Data (3h old)
              </text>
            )}
          </g>
        );
      })}
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
          <div className="pf-panel-head">System Topology</div>
          <NetworkGraph isStale={isStale} active={running} />
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
