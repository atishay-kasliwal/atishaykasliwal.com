import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import KpiCard from "../components/KpiCard";
import Spinner from "../components/Spinner";
import PendingList from "../components/PendingList";
import PendingPreview from "../components/PendingPreview";
import ReferralsPreview from "../components/ReferralsPreview";
import NotesPreview from "../components/NotesPreview";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../lib/api";

const defaultSummary: DashboardSummary = {
  kpis: {
    jobs: 0,
    referrals: 0,
    pending: 0,
    rejected: 0,
    jobsThisMonth: 0,
    jobsThisWeek: 0,
    jobsToday: 0,
    jobsWithReferral: 0,
  },
  dailyTrend: [],
  referralTrend: [],
  weeklyTrend: [],
  responseStatusTrend: [],
  oaStatusTrend: [],
  monthlyTrend: [],
};

// Executive-level chart design: muted bluish colors, clean typography, minimal noise
const CHART_COLORS = {
  // Main trend chart
  trendLine: "#60a5fa", // muted blue
  trendGradientTop: "rgba(96, 165, 250, 0.15)",
  trendGradientBottom: "rgba(96, 165, 250, 0)",
  // Different colors for different chart types
  weeklyBar: "#60a5fa", // muted blue for weekly
  monthlyBar: "#3b82f6", // darker blue for monthly
  referralBar: ["#60a5fa", "#818cf8", "#a78bfa"], // blue, indigo, purple
  responseBar: "#818cf8", // indigo for response status
  oaBar: "#a78bfa", // purple for OA status
  bar: ["#60a5fa", "#3b82f6", "#818cf8", "#a78bfa", "#c084fc", "#94a3b8"], // bluish palette
  grid: "rgba(255,255,255,0.12)", // 12% opacity horizontal gridlines
  tooltipBg: "#18181b",
  tooltipBorder: "rgba(255,255,255,0.12)",
  axis: "#71717a", // subtle axis color
  text: "#e4e4e7", // primary text
  textSecondary: "#a1a1aa", // secondary text (tick labels)
};

/** 12 distinct muted bluish colors for Jan–Dec */
const MONTH_COLORS = [
  "#60a5fa", "#3b82f6", "#818cf8", "#a78bfa", "#c084fc", "#94a3b8",
  "#60a5fa", "#3b82f6", "#818cf8", "#a78bfa", "#c084fc", "#94a3b8",
];

const TREND_COLORS = {
  high: "#22c55e",   // green
  mid: "#facc15",    // yellow
  low: "#ef4444",    // red
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseIsoDay(day: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const d = Number(m[3]);
  if (!y || month < 1 || month > 12 || d < 1 || d > 31) return null;
  return { y, m: month, d };
}

function utcDateFromIsoDay(day: string): Date | null {
  const p = parseIsoDay(day);
  if (!p) return null;
  return new Date(Date.UTC(p.y, p.m - 1, p.d));
}

function isoDayAddDays(day: string, deltaDays: number): string {
  const d = utcDateFromIsoDay(day);
  if (!d) return day;
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function formatDay(day: string) {
  try {
    const d = utcDateFromIsoDay(day);
    if (!d || isNaN(d.getTime())) return day;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "2-digit",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return day;
  }
}

function formatDayShort(day: string) {
  try {
    const p = parseIsoDay(day);
    if (!p) return day;
    return `${String(p.m).padStart(2, "0")}/${String(p.d).padStart(2, "0")}`;
  } catch {
    return day;
  }
}

function formatWeek(week: string) {
  try {
    const d = utcDateFromIsoDay(week);
    if (!d || isNaN(d.getTime())) return week;
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
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
        borderRadius: 6,
        padding: "10px 14px",
      }}
    >
      <p style={{ margin: "0 0 6px 0", fontWeight: 500, fontSize: 11, color: CHART_COLORS.text }}>{title}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: CHART_COLORS.trendLine }}>Applications: {p.total}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30); // default 30 days

  async function loadSummary() {
    try {
      setError("");
      const sum = await getDashboardSummary(days);
      setSummary(sum);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, [days]);

  useEffect(() => {
    const onRefresh = () => loadSummary();
    window.addEventListener("dashboard-refresh", onRefresh);
    return () => window.removeEventListener("dashboard-refresh", onRefresh);
  }, [days]);

  const trendData = useMemo(() => {
    const raw = summary.dailyTrend ?? [];
  
    return raw.map((row) => {
      const p = parseIsoDay(row.day);
      const monthIndex = p ? p.m - 1 : 0;
      const dayOfMonth = p ? p.d : 0;
      const label = `${MONTH_NAMES[monthIndex] ?? MONTH_NAMES[0]} ${dayOfMonth || 0}`;
  
      const value = row.total ?? 0;
  
      return {
        ...row,
        label,
        month: monthIndex,
        dayOfMonth,
        high: value > 20 ? value : null,
        mid: value >= 15 && value <= 20 ? value : null,
        low: value < 15 ? value : null,
      };
    });
  }, [summary.dailyTrend]);

  /** KPIs derived from the same job/trend data used for the charts */
  const derivedKpis = useMemo(() => {
    const daily = summary.dailyTrend ?? [];
    const monthly = summary.monthlyTrend ?? [];
    const referral = summary.referralTrend ?? [];

    // Use the same "today" as the daily trend series (DB CURRENT_DATE).
    const seriesTodayIso = daily.length ? String(daily[daily.length - 1].day) : "";
    const todayParts = seriesTodayIso ? parseIsoDay(seriesTodayIso) : null;
    const monthKey = todayParts
      ? `${todayParts.y}-${String(todayParts.m).padStart(2, "0")}`
      : "";

    const jobsToday = seriesTodayIso ? daily.find((r) => r.day === seriesTodayIso)?.total ?? 0 : 0;
    const jobsThisMonth = monthly.find((r) => r.month === monthKey)?.total ?? 0;
    const jobsWithReferral = referral.find((r) => r.referral_status === "Yes")?.total ?? 0;

    // This week = sum of daily trend for last 7 days (same data as daily chart, no timezone/week-boundary issues)
    const jobsThisWeek = (() => {
      if (!seriesTodayIso) return 0;
      let sum = 0;
      for (let i = 6; i >= 0; i -= 1) {
        const dayIso = isoDayAddDays(seriesTodayIso, -i);
        sum += daily.find((r) => r.day === dayIso)?.total ?? 0;
      }
      return sum;
    })();

    return {
      jobs: summary.kpis.jobs ?? 0,
      jobsToday,
      jobsThisWeek,
      jobsThisMonth,
      jobsWithReferral,
      pending: summary.kpis.pending ?? 0,
      rejected: summary.kpis.rejected ?? 0,
    };
  }, [summary.dailyTrend, summary.monthlyTrend, summary.referralTrend, summary.kpis.jobs, summary.kpis.pending, summary.kpis.rejected]);

  const todayLabel = useMemo(() => {
    const daily = summary.dailyTrend ?? [];
    const seriesTodayIso = daily.length ? String(daily[daily.length - 1].day) : "";
    const p = seriesTodayIso ? parseIsoDay(seriesTodayIso) : null;
    if (!p) return "";
    return `${MONTH_NAMES[p.m - 1]} ${p.d}`;
  }, [summary.dailyTrend]);

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

  const showTodayLine = Boolean(todayLabel) && trendData.some((row) => row.label === todayLabel);

  const weeklyMaxPoint = useMemo(() => {
    const arr = summary.weeklyTrend ?? [];
    if (!arr.length) return null;
    return arr.reduce(
      (max, pt) => ((pt.total ?? 0) > (max.total ?? 0) ? pt : max),
      arr[0] as { week: string; total: number },
    );
  }, [summary.weeklyTrend]);

  const latestMonthIndex = useMemo(() => {
    const arr = summary.monthlyTrend ?? [];
    return arr.length ? arr.length - 1 : -1;
  }, [summary.monthlyTrend]);

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
        <KpiCard label="Applications till now" value={derivedKpis.jobs} />
        <KpiCard label="Applications this month" value={derivedKpis.jobsThisMonth} />
        <KpiCard label="Applications this week" value={derivedKpis.jobsThisWeek} />
        <KpiCard label="Applications today" value={derivedKpis.jobsToday} />
        <KpiCard label="Total applications with referral" value={derivedKpis.jobsWithReferral} />
        <KpiCard label="Total pending tasks" value={derivedKpis.pending} />
        <KpiCard label="Total rejects" value={derivedKpis.rejected} accent="red" />
      </section>
      <div className="dashboard-filter-card">
        <div className="dashboard-filter-label">Show last:</div>
        <div className="dashboard-filter-btns">
          {[60, 30, 15, 10, 7].map((d) => (
            <button
              key={d}
              className={days === d ? "dashboard-filter-btn dashboard-filter-btn--active" : "dashboard-filter-btn"}
              onClick={() => setDays(d)}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      <section className="chart-grid chart-grid-trend">
        <div className="card card-chart-trend">
          <ResponsiveContainer width="100%" height={600}>
            <ComposedChart data={trendData} margin={{ top: 20, right: 24, left: 8, bottom: 32 }}>
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
                tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                tickLine={false}
                ticks={dailyTrendTicks.length > 0 ? dailyTrendTicks : undefined}
                interval={0}
                height={32}
              />
              <YAxis
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={(props) => {
                  if (!props.active || !props.payload?.length) return null;
                  const data = props.payload[0].payload;
                  const dateStr = data.day ? formatDay(data.day) : props.label || "";
                  const title = data.label === todayLabel ? `Today — ${dateStr}` : dateStr;
                  return (
                    <div
                      style={{
                        background: CHART_COLORS.tooltipBg,
                        border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                        borderRadius: 6,
                        padding: "10px 14px",
                      }}
                    >
                      <p style={{ margin: "0 0 6px 0", fontWeight: 500, fontSize: 11, color: CHART_COLORS.text }}>{title}</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: CHART_COLORS.trendLine }}>Applications: {data.total}</p>
                    </div>
                  );
                }}
                cursor={{ fill: "rgba(96, 165, 250, 0.08)" }}
              />
              {showTodayLine ? (
                <ReferenceLine x={todayLabel} stroke={CHART_COLORS.textSecondary} strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Today", fill: CHART_COLORS.textSecondary, fontSize: 10 }} />
              ) : null}
              <Area
                type="monotone"
                dataKey="total"
                stroke="none"
                fill="url(#trendAreaGradient)"
              />
              <Bar dataKey="total" fillOpacity={0.7} radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.textSecondary, fontSize: 9, fontWeight: 400 }}>
                {trendData.map((row, i) => (
                  <Cell key={row.day ?? i} fill={MONTH_COLORS[row.month]} />
                ))}
              </Bar>
              <Line
              type="monotone"
              dataKey="high"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            
            <Line
              type="monotone"
              dataKey="mid"
              stroke="#facc15"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            
            <Line
              type="monotone"
              dataKey="low"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Bottom row: Pending / Referrals / Notes */}
      <section className="chart-grid chart-grid-three dashboard-bottom-panels">
        <div className="card pending-list-card">
          <h2>Pending</h2>
          <p className="chart-subtitle">Outstanding items</p>
          <div className="dashboard-panel-body">
            <PendingPreview />
          </div>
        </div>
        <div className="card">
          <h2>Referrals</h2>
          <p className="chart-subtitle">Open referral requests</p>
          <div className="dashboard-panel-body">
            <ReferralsPreview />
          </div>
        </div>
        <div className="card">
          <h2>Notes</h2>
          <p className="chart-subtitle">Recent notes</p>
          <div className="dashboard-panel-body">
            <NotesPreview />
          </div>
        </div>
      </section>

      <section className="chart-grid chart-grid-two">
        <div className="card">
          <h2>Weekly Applications</h2>
          <p className="chart-subtitle">Last 12 weeks</p>
          {(summary.weeklyTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={summary.weeklyTrend} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="weeklyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.weeklyBar} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={CHART_COLORS.weeklyBar} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                  tickLine={false}
                  tickFormatter={formatWeek}
                />
                <YAxis
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: CHART_COLORS.tooltipBg,
                    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                    borderRadius: 6,
                    padding: "10px 14px",
                  }}
                  cursor={{ fill: "rgba(96, 165, 250, 0.08)" }}
                  labelStyle={{ color: CHART_COLORS.text, fontSize: 11, fontWeight: 500, marginBottom: 6 }}
                  itemStyle={{ fontSize: 13, fontWeight: 600, color: CHART_COLORS.weeklyBar }}
                  labelFormatter={formatWeek}
                  formatter={(value: number) => [`${value}`, "Applications"]}
                />
                {/* Subtle area fill */}
                <Area type="monotone" dataKey="total" stroke="none" fill="url(#weeklyArea)" />
                {/* Smooth trend line */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={CHART_COLORS.weeklyBar}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: CHART_COLORS.tooltipBg, fill: CHART_COLORS.weeklyBar }}
                />
                {/* Single annotation for highest week */}
                {weeklyMaxPoint && (
                  <ReferenceDot
                    x={weeklyMaxPoint.week}
                    y={weeklyMaxPoint.total}
                    r={4}
                    fill={CHART_COLORS.weeklyBar}
                    stroke={CHART_COLORS.tooltipBg}
                    strokeWidth={2}
                    label={{
                      position: "top",
                      value: weeklyMaxPoint.total,
                      fill: CHART_COLORS.textSecondary,
                      fontSize: 10,
                    }}
                  />
                )}
              </LineChart>
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
              <BarChart data={summary.monthlyTrend} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                  tickLine={false}
                  tickFormatter={formatMonth}
                />
                <YAxis
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: CHART_COLORS.tooltipBg,
                    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                    borderRadius: 6,
                    padding: "10px 14px",
                  }}
                  cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                  labelStyle={{ color: CHART_COLORS.text, fontSize: 11, fontWeight: 500, marginBottom: 6 }}
                  itemStyle={{ fontSize: 13, fontWeight: 600, color: CHART_COLORS.monthlyBar }}
                  labelFormatter={formatMonth}
                  formatter={(value: number) => [`${value}`, "Applications"]}
                />
                {/* Lollipop stems */}
                <Bar dataKey="total" fill={CHART_COLORS.monthlyBar} barSize={4} radius={[2, 2, 0, 0]}>
                  {/* Label only the most recent month */}
                  <LabelList
                    dataKey="total"
                    content={(props: any) => {
                      const { x, y, value, index } = props;
                      if (latestMonthIndex === -1 || index !== latestMonthIndex) return null;
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={-6}
                          fill={CHART_COLORS.textSecondary}
                          fontSize={10}
                          textAnchor="middle"
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                </Bar>
                {/* Lollipop heads */}
                <Line
                  type="linear"
                  dataKey="total"
                  stroke="transparent"
                  dot={{
                    r: 5,
                    fill: CHART_COLORS.monthlyBar,
                    stroke: CHART_COLORS.tooltipBg,
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: CHART_COLORS.monthlyBar,
                    stroke: CHART_COLORS.tooltipBg,
                    strokeWidth: 2,
                  }}
                />
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
            <BarChart data={summary.referralTrend} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="referral_status"
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                tickLine={false}
              />
              <YAxis
                stroke={CHART_COLORS.axis}
                tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: CHART_COLORS.tooltipBg,
                  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                  borderRadius: 6,
                  padding: "10px 14px",
                }}
                cursor={{ fill: "rgba(110, 231, 183, 0.08)" }}
                labelStyle={{ color: CHART_COLORS.text, fontSize: 11, fontWeight: 500, marginBottom: 6 }}
                itemStyle={{ fontSize: 13, fontWeight: 600 }}
                formatter={(value: number) => [`${value}`, "Jobs"]}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.textSecondary, fontSize: 9, fontWeight: 400 }}>
                {summary.referralTrend.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.referralBar[i % CHART_COLORS.referralBar.length]} />
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
              <BarChart data={summary.responseStatusTrend} layout="vertical" margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="response_status"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: CHART_COLORS.tooltipBg,
                    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                    borderRadius: 6,
                    padding: "10px 14px",
                  }}
                  cursor={{ fill: "rgba(96, 165, 250, 0.08)" }}
                  labelStyle={{ color: CHART_COLORS.text, fontSize: 11, fontWeight: 500, marginBottom: 6 }}
                  itemStyle={{ fontSize: 13, fontWeight: 600 }}
                  formatter={(value: number) => [`${value}`, "Jobs"]}
                />
                <Bar dataKey="total" fill={CHART_COLORS.responseBar} radius={[0, 4, 4, 0]} label={{ position: "right", fill: CHART_COLORS.textSecondary, fontSize: 9, fontWeight: 400 }} />
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
              <BarChart data={summary.oaStatusTrend} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="oa_status"
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                  tickLine={false}
                />
                <YAxis
                  stroke={CHART_COLORS.axis}
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: 10, fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: CHART_COLORS.tooltipBg,
                    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                    borderRadius: 6,
                    padding: "10px 14px",
                  }}
                  cursor={{ fill: "rgba(96, 165, 250, 0.08)" }}
                  labelStyle={{ color: CHART_COLORS.text, fontSize: 11, fontWeight: 500, marginBottom: 6 }}
                  itemStyle={{ fontSize: 13, fontWeight: 600 }}
                  formatter={(value: number) => [`${value}`, "Jobs"]}
                />
                <Bar dataKey="total" fill={CHART_COLORS.oaBar} radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.textSecondary, fontSize: 9, fontWeight: 400 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Add jobs with OA status to see breakdown</div>
          )}
        </div>
      </section>
    </>
  );
}
