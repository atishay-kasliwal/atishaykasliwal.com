type Props = {
  label: string;
  value: number | string;
  /** optional accent variant: 'red' for rejects */
  accent?: "red";
};

export default function KpiCard({ label, value, accent }: Props) {
  const displayValue = value !== undefined && value !== null ? value : 0;
  const className = accent === "red" ? "kpi-card kpi-card--red" : "kpi-card";
  return (
    <div className={className}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{displayValue}</div>
    </div>
  );
}
