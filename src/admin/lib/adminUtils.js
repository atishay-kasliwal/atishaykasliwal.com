export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function sentenceCase(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatAdminDate(value, options = {}) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function formatAdminDateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return String(value);

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function toInputDateTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '';
  const offset = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromInputDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeKeyValueList(value, separator = ':') {
  const rows = String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return rows
    .map((row) => {
      const parts = row.split(separator);
      if (parts.length < 2) return null;
      const head = parts.shift()?.trim();
      const tail = parts.join(separator).trim();
      if (!head || !tail) return null;
      return [head, tail];
    })
    .filter(Boolean);
}

export function compactNumber(value) {
  if (!Number.isFinite(Number(value))) return String(value || '0');
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value)
  );
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function uniqueBy(items, resolver) {
  const seen = new Set();
  return items.filter((item) => {
    const key = resolver(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function orderBy(items, iteratee, direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1;

  return [...items].sort((left, right) => {
    const a = iteratee(left);
    const b = iteratee(right);

    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * factor;
    }

    if (a instanceof Date && b instanceof Date) {
      return (a.getTime() - b.getTime()) * factor;
    }

    return String(a).localeCompare(String(b), undefined, { numeric: true }) * factor;
  });
}
