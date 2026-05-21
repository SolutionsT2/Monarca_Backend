import * as XLSX from 'xlsx';

export function parseExcelRows(buffer: Buffer): Record<string, any>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
}

export function normalizeCellValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

export function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function getRowValue(row: Record<string, any>, ...keys: string[]): unknown {
  const normalizedRow = new Map<string, unknown>();

  for (const [key, value] of Object.entries(row)) {
    normalizedRow.set(normalizeKey(key), value);
  }

  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    if (normalizedRow.has(normalizedKey)) {
      return normalizedRow.get(normalizedKey);
    }
  }

  return null;
}

export function normalizeNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}
