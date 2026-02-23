/**
 * Format a date for display in tables (Jobs, Referrals, Pending).
 * Uses a consistent format: "Feb 22, 2025"
 */
export function formatTableDate(value: unknown): string {
  if (value == null || value === "") return "—";
  try {
    const raw = String(value);
    // YYYY-MM-DD from inputs/DB: format in UTC to avoid timezone day-shift
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const d = isDateOnly ? new Date(`${raw}T00:00:00Z`) : new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return String(value);
  }
}

/** Local YYYY-MM-DD for <input type="date"> defaults (avoids UTC shifts). */
export function getLocalISODate(d = new Date()): string {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}
