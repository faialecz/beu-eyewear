export function csvCell(value: string | number | null) {
  let text = value === null ? '' : String(value);
  // Protect formula-like cells even when preceded by whitespace/control characters.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function createCsv(rows: (string | number | null)[][]) {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
