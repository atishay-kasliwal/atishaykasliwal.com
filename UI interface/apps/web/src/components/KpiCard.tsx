type Props = {
  label: string;
  value: number | string;
};

export default function KpiCard({ label, value }: Props) {
  const displayValue = value !== undefined && value !== null ? value : 0;
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{displayValue}</div>
    </div>
  );
}
