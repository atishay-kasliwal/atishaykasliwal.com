// RFC 4180 CSV parsing and writing. Quoted fields may contain commas, quotes, and newlines.

export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let fieldStarted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') field += ch;
      else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
      continue;
    }
    if (ch === '"' && !fieldStarted) {
      quoted = true;
      fieldStarted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
      fieldStarted = false;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      fieldStarted = false;
    } else {
      field += ch;
      fieldStarted = true;
    }
  }
  if (quoted) throw new Error("CSV ends inside a quoted field");
  if (fieldStarted || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Returns one object per data row, keyed by header. Every row must have the header's width.
export function parseCsvObjects(text) {
  const [header, ...rows] = parseCsv(text).filter(row => !(row.length === 1 && row[0] === ""));
  if (!header) return { columns: [], records: [] };
  const records = rows.map((row, index) => {
    if (row.length !== header.length) {
      throw new Error(`CSV row ${index + 2} has ${row.length} fields; the header has ${header.length}`);
    }
    return Object.fromEntries(header.map((name, column) => [name, row[column]]));
  });
  return { columns: header, records };
}

// Spreadsheet apps run cells that start with these characters as formulas. Exported cells get a
// leading apostrophe; unguardFormula strips it again so an exported file re-imports unchanged.
const FORMULA_START = /^[=+\-@\t\r]/;
export const guardFormula = value => (FORMULA_START.test(value) ? `'${value}` : value);
export const unguardFormula = value => (/^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value);

function csvCell(value) {
  const text = guardFormula(value === null || value === undefined ? "" : String(value));
  return /[",\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text;
}

// Includes a byte-order mark so Excel opens the file as UTF-8.
export function stringifyCsv(columns, records) {
  const lines = [columns.map(csvCell).join(",")];
  for (const record of records) lines.push(columns.map(column => csvCell(record[column])).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
