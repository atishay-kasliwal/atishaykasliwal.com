import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiCard from "../components/KpiCard";
import Spinner from "../components/Spinner";
import {
  createJob,
  createReferral,
  getDashboardSummary,
  type DashboardSummary,
} from "../lib/api";

const defaultSummary: DashboardSummary = {
  kpis: { jobs: 0, referrals: 0, pending: 0 },
  dailyTrend: [],
  referralTrend: [],
  weeklyTrend: [],
  responseStatusTrend: [],
  oaStatusTrend: [],
  monthlyTrend: [],
};

const CHART_COLORS = {
  trendLine: "#2dd4bf",
  trendGradientTop: "rgba(45, 212, 191, 0.55)",
  trendGradientBottom: "rgba(45, 212, 191, 0)",
  bar: ["#22d3ee", "#e4a853", "#a78bfa", "#34d399", "#f472b6", "#94a3b8"],
  grid: "rgba(255,255,255,0.06)",
  tooltipBg: "#18181b",
  tooltipBorder: "rgba(255,255,255,0.08)",
  axis: "#a1a1aa",
};

/** 12 distinct colors for Jan–Dec (easy to tell apart) */
const MONTH_COLORS = [
  "#67e8f9", "#22d3ee", "#2dd4bf", "#34d399", "#4ade80", "#a3e635",
  "#84cc16", "#65a30d", "#16a34a", "#059669", "#0d9488", "#14b8a6",
];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDay(day: string) {
  try {
    const d = new Date(day);
    return isNaN(d.getTime()) ? day : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
  } catch {
    return day;
  }
}

function formatDayShort(day: string) {
  try {
    const d = new Date(day);
    if (isNaN(d.getTime())) return day;
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = String(d.getDate()).padStart(2, "0");
    return `${m}/${dayNum}`;
  } catch {
    return day;
  }
}

function formatWeek(week: string) {
  try {
    const d = new Date(week);
    return isNaN(d.getTime()) ? week : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return week;
  }
}

function formatMonth(month: string) {
  try {
    const [y, m] = month.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return isNaN(d.getTime()) ? month : d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return month;
  }
}

function DailyTrendTooltip({
  active,
  payload,
  label: _label,
  todayLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: { day: string; total: number; label: string } }>;
  label?: string;
  todayLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const dateStr = p.day ? formatDay(p.day) : "";
  const title = p.label === todayLabel ? `Today — ${dateStr}` : dateStr;
  return (
    <div
      className="recharts-default-tooltip"
      style={{
        background: CHART_COLORS.tooltipBg,
        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{title}</p>
      <p style={{ margin: 0, color: CHART_COLORS.axis }}>Applications: {p.total}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    role: "",
    company: "",
    location_raw: "",
    job_link: "",
    referral_status: "",
    notes: "",
  });
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  async function loadSummary() {
    try {
      setError("");
      const sum = await getDashboardSummary();
      setSummary(sum);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function onCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) return;
    if (form.referral_status === "Requested" || form.referral_status === "Pending") {
      if (!form.role.trim()) return;
      try {
        setIsSaving(true);
        await createReferral({
          company: form.company.trim(),
          request_log: form.role.trim(),
          request_date: new Date().toISOString().slice(0, 10),
          request_link: form.job_link.trim() || undefined,
          referral_received: form.referral_status,
          comment: form.notes.trim() || undefined,
        });
        setForm({ role: "", company: "", location_raw: "", job_link: "", referral_status: "", notes: "" });
        setShowQuickAdd(false);
        await loadSummary();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsSaving(false);
      }
      return;
    }
    if (!form.role.trim()) return;
    try {
      setIsSaving(true);
      await createJob({
        ...form,
        job_link: form.job_link.trim() || undefined,
        referral_status: form.referral_status.trim() || undefined,
      });
      setForm({ role: "", company: "", location_raw: "", job_link: "", referral_status: "", notes: "" });
      setShowQuickAdd(false);
      await loadSummary();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const trendData = useMemo(() => {
    const raw = summary.dailyTrend ?? [];
    return raw.map((row) => {
      const d = new Date(row.day);
      const month = isNaN(d.getTime()) ? 0 : d.getMonth();
      const dayOfMonth = isNaN(d.getTime()) ? 0 : d.getDate();
      const label = `${MONTH_NAMES[month]} ${dayOfMonth}`;
      return { ...row, label, month, dayOfMonth };
    });
  }, [summary.dailyTrend]);

  const todayLabel = useMemo(() => {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;
  }, []);

  const dailyTrendTicks = useMemo(() => {
    const labels = new Set<string>();
    trendData.forEach((row) => {
      if (row.dayOfMonth === 1) labels.add(row.label);
    });
    if (trendData.some((row) => row.label === todayLabel)) labels.add(todayLabel);
    return trendData
      .filter((row) => labels.has(row.label))
      .map((row) => row.label)
      .filter((l, i, arr) => arr.indexOf(l) === i);
  }, [trendData, todayLabel]);

  const showTodayLine = trendData.some((row) => row.label === todayLabel);

  if (isLoading) {
    return (
      <div className="card">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div className="error">
          {error}
          {error.includes("Unauthorized") && (
            <p className="error-hint">
              Token in .env: {import.meta.env.VITE_API_TOKEN ? "set" : "missing"} · Restart dev server after editing
              apps/web/.env
            </p>
          )}
        </div>
      ) : null}

      <section className="kpi-grid">
        <KpiCard label="Total Jobs" value={summary.kpis.jobs} />
        <KpiCard label="Referral Entries" value={summary.kpis.referrals} />
        <KpiCard label="Pending Items" value={summary.kpis.pending} />
      </section>

      <section className="chart-grid chart-grid-trend">
        <div className="card card-chart-trend">
          <div className="chart-header-row">
            <div>
              <h2>Daily Application Trend</h2>
              <p className="chart-subtitle">From Jan 1 this year — x-axis: calendar day (Jan 1–31, Feb 1–28, …). Bar color = month (see legend below).</p>
            </div>
            <button
              type="button"
              className="quick-add-btn"
              onClick={() => setShowQuickAdd(true)}
            >
              Quick Add Job
            </button>
          </div>
          <ResponsiveContainer width="100%" height={520}>
            <ComposedChart data={trendData} margin={{ top: 20, right: 20, left: 12, bottom: 20 }}>
              <defs>
                <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.trendLine} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART_COLORS.trendLine} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
                ticks={dailyTrendTicks.length > 0 ? dailyTrendTicks : undefined}
                interval={0}
                height={24}
              />
              <YAxis
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                allowDecimals={false}
                width={32}
              />
              <Tooltip content={(props) => <DailyTrendTooltip {...props} todayLabel={todayLabel} />} />
              {showTodayLine ? (
                <ReferenceLine x={todayLabel} stroke="#f472b6" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Today", fill: CHART_COLORS.axis, fontSize: 10 }} />
              ) : null}
              <Area
                type="monotone"
                dataKey="total"
                stroke="none"
                fill="url(#trendAreaGradient)"
              />
              <Bar dataKey="total" fillOpacity={0.6} radius={[3, 3, 0, 0]} label={{ position: "top", fill: CHART_COLORS.axis, fontSize: 10 }}>
                {trendData.map((row, i) => (
                  <Cell key={row.day ?? i} fill={MONTH_COLORS[row.month]} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="total"
                stroke={CHART_COLORS.trendLine}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: CHART_COLORS.trendLine, stroke: "#0a0a0c", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {MONTH_NAMES.map((name, i) => (
              <span key={name} className="chart-legend-item">
                <span className="chart-legend-swatch" style={{ background: MONTH_COLORS[i] }} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="chart-grid chart-grid-two">
        <div className="card">
          <h2>Weekly Applications</h2>
          <p className="chart-subtitle">Last 12 weeks</p>
          {(summary.weeklyTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.weeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
                  tickFormatter={formatWeek}
                />
                <YAxis stroke={CHART_COLORS.axis} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip
                  contentStyle={{ background: CHART_COLORS.tooltipBg, border: `1px solid ${CHART_COLORS.tooltipBorder}`, borderRadius: 8 }}
                  labelFormatter={formatWeek}
                  formatter={(value: number) => [`${value}`, "Applications"]}
                />
                <Bar dataKey="total" fill={CHART_COLORS.trendLine} radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.axis, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No applications in the last 12 weeks</div>
          )}
        </div>
        <div className="card">
          <h2>Applications by Month</h2>
          <p className="chart-subtitle">Last 12 months</p>
          {(summary.monthlyTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
                  tickFormatter={formatMonth}
                />
                <YAxis stroke={CHART_COLORS.axis} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip
                  contentStyle={{ background: CHART_COLORS.tooltipBg, border: `1px solid ${CHART_COLORS.tooltipBorder}`, borderRadius: 8 }}
                  labelFormatter={formatMonth}
                  formatter={(value: number) => [`${value}`, "Applications"]}
                />
                <Bar dataKey="total" fill="#e4a853" radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.axis, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No applications in the last 12 months</div>
          )}
        </div>
      </section>

      <section className="chart-grid chart-grid-three">
        <div className="card card-chart-small">
          <h2>Referral (from job added)</h2>
          <p className="chart-subtitle">Yes / No / Pending</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.referralTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="referral_status"
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
              />
              <YAxis stroke={CHART_COLORS.axis} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} allowDecimals={false} width={28} />
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.tooltipBg,
                  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                  borderRadius: 8,
                }}
                formatter={(value: number) => [`${value} jobs`, "Count"]}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.axis, fontSize: 10 }}>
                {summary.referralTrend.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.bar[i % CHART_COLORS.bar.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2>Response Status</h2>
          <p className="chart-subtitle">By outcome</p>
          {(summary.responseStatusTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.responseStatusTrend} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis type="number" stroke={CHART_COLORS.axis} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="response_status" stroke={CHART_COLORS.axis} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ background: CHART_COLORS.tooltipBg, border: `1px solid ${CHART_COLORS.tooltipBorder}`, borderRadius: 8 }}
                  formatter={(value: number) => [`${value}`, "Jobs"]}
                />
                <Bar dataKey="total" fill="#a78bfa" radius={[0, 4, 4, 0]} label={{ position: "right", fill: CHART_COLORS.axis, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Add jobs and set response status to see breakdown</div>
          )}
        </div>
        <div className="card">
          <h2>OA Status</h2>
          <p className="chart-subtitle">Online assessment</p>
          {(summary.oaStatusTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.oaStatusTrend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="oa_status"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
                />
                <YAxis stroke={CHART_COLORS.axis} tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} allowDecimals={false} width={28} />
                <Tooltip
                  contentStyle={{ background: CHART_COLORS.tooltipBg, border: `1px solid ${CHART_COLORS.tooltipBorder}`, borderRadius: 8 }}
                  formatter={(value: number) => [`${value}`, "Jobs"]}
                />
                <Bar dataKey="total" fill="#34d399" radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.axis, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Add jobs with OA status to see breakdown</div>
          )}
        </div>
      </section>

      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowQuickAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Quick Add Job</h3>
            <form className="form" onSubmit={onCreateJob}>
              <input
                placeholder="Role *"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              />
              <input
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              />
              <input
                placeholder="Location"
                value={form.location_raw}
                onChange={(e) => setForm((p) => ({ ...p, location_raw: e.target.value }))}
              />
              <input
                placeholder="Job link (URL)"
                type="url"
                value={form.job_link}
                onChange={(e) => setForm((p) => ({ ...p, job_link: e.target.value }))}
              />
              <div className="form-row">
                <label className="form-label">Referral</label>
                <select
                  value={form.referral_status}
                  onChange={(e) => setForm((p) => ({ ...p, referral_status: e.target.value }))}
                  className="form-select"
                >
                  <option value="">—</option>
                  <option value="Requested">Requested</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Pending">Pending</option>
                  <option value="Applied without referral">Applied without referral</option>
                </select>
              </div>
              {(form.referral_status === "Requested" || form.referral_status === "Pending") && (
                <p className="referral-hint">
                  This will add an entry on the <Link to="/referrals" className="table-link">Referrals</Link> page. Change its status there to create a job.
                </p>
              )}
              {form.referral_status === "Yes" && (
                <p className="referral-hint">
                  Add a referral for this company on the <Link to="/referrals" className="table-link">Referrals</Link> page to keep track.
                </p>
              )}
              <textarea
                placeholder="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => !isSaving && setShowQuickAdd(false)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !form.company.trim() || !form.role.trim()}>
                  {isSaving ? "Saving..." : "Add Job"}
                </button>
              </div>
            </form>
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              View and search all jobs on the <Link to="/jobs" className="table-link">Jobs</Link> page.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
