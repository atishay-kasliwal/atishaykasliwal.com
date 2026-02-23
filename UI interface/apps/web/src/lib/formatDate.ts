/**
 * Format a date for display in tables (Jobs, Referrals, Pending).
 * Uses a consistent format: "Feb 22, 2025"
 */
export function formatTableDate(value: unknown): string {
  if (value == null || value === "") return "—";
  try {
    const d = new Date(String(value));
    return isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return String(value);
  }
}
