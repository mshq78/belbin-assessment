import { normalizeToEnglishDigits } from './number';
import { validateNationalId, normalizePhone } from '../services/auth';

export type ImportReason = 'invalid_phone' | 'invalid_national_id' | 'missing_name' | 'duplicate_phone' | 'duplicate_national_id';

export interface ImportRow {
  rowNumber: number; // 1-based row in the sheet (including header)
  fullName: string;
  phone: string; // normalized 09xxxxxxxxx (or raw if invalid)
  nationalId: string; // normalized 10 digits (or raw if invalid)
  errors: ImportReason[];
}

type Cell = string | number | boolean | Date | null | undefined;

const cellToString = (c: Cell): string => {
  if (c === null || c === undefined) return '';
  if (typeof c === 'number') return Number.isFinite(c) ? String(Math.round(c) === c ? c.toFixed(0) : c) : '';
  return String(c).trim();
};

/** Minimal CSV parser (comma / semicolon / tab, quoted fields, BOM). */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] || '';
  const delim = [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Excel drops leading zeros of numeric cells, so 8–9 digit national IDs are zero-padded back to 10 digits. */
export function normalizeNationalIdInput(raw: string): string {
  const id = normalizeToEnglishDigits(raw).replace(/[\s-]/g, '');
  return /^\d{8,9}$/.test(id) ? id.padStart(10, '0') : id;
}

type Field = 'name' | 'first' | 'last' | 'nid' | 'phone';

function detectField(header: string): Field | null {
  const h = header.replace(/[\s‌_-]+/g, '').toLowerCase();
  if (!h) return null;
  if (/کدملی|شمارهملی|national|nid|کدمل/.test(h)) return 'nid';
  if (/تلفن|تماس|همراه|موبایل|mobile|phone|cell/.test(h)) return 'phone';
  if (/نامخانوادگی|family|last|فامیل/.test(h)) return 'last';
  if (/نامونامخانوادگی|نامکامل|fullname|full/.test(h)) return 'name';
  if (/نامکوچک|first|^نام$/.test(h)) return 'first';
  if (/نام|name/.test(h)) return 'name';
  return null;
}

/**
 * Turns sheet rows into import rows. With a header row, columns are found by title
 * (نام / نام خانوادگی / کد ملی / شماره تماس…); without one the column order is: name, national ID, phone.
 */
export function rowsToImport(data: Cell[][]): ImportRow[] {
  const rows = data.filter((r) => r.some((c) => cellToString(c) !== ''));
  if (rows.length === 0) return [];

  const headerFields = rows[0].map((c) => detectField(cellToString(c)));
  const hasHeader = headerFields.includes('nid') || headerFields.includes('phone');
  const map: Partial<Record<Field, number>> = {};
  if (hasHeader) headerFields.forEach((f, i) => f && map[f] === undefined && (map[f] = i));
  else Object.assign(map, { name: 0, nid: 1, phone: 2 });

  const out: ImportRow[] = [];
  const seenPhones = new Map<string, number>();
  const seenIds = new Map<string, number>();

  rows.slice(hasHeader ? 1 : 0).forEach((r, idx) => {
    const get = (f: Field) => (map[f] === undefined ? '' : cellToString(r[map[f] as number]));
    const fullName = (get('name') || [get('first'), get('last')].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();
    const phoneRaw = get('phone');
    const nidRaw = get('nid');
    const phone = normalizePhone(phoneRaw);
    const nationalId = normalizeNationalIdInput(nidRaw);
    const errors: ImportReason[] = [];
    if (!/^09\d{9}$/.test(phone)) errors.push('invalid_phone');
    if (!validateNationalId(nationalId)) errors.push('invalid_national_id');
    if (!fullName) errors.push('missing_name');
    const rowNumber = idx + 1 + (hasHeader ? 1 : 0);
    if (errors.indexOf('invalid_phone') === -1) {
      if (seenPhones.has(phone)) errors.push('duplicate_phone');
      else seenPhones.set(phone, rowNumber);
    }
    if (errors.indexOf('invalid_national_id') === -1) {
      if (seenIds.has(nationalId)) errors.push('duplicate_national_id');
      else seenIds.set(nationalId, rowNumber);
    }
    out.push({ rowNumber, fullName, phone: errors.includes('invalid_phone') ? phoneRaw : phone, nationalId: errors.includes('invalid_national_id') ? nidRaw : nationalId, errors });
  });
  return out;
}

export async function parseUsersFile(file: File): Promise<ImportRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return rowsToImport(parseCsv(await file.text()));
  }
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    const data = (await readSheet(file)) as Cell[][];
    return rowsToImport(data);
  }
  throw new Error('unsupported_file');
}

export const TEMPLATE_CSV =
  '﻿نام و نام خانوادگی,کد ملی,شماره تماس\n"نمونه کاربر","0499370899","09121234567"\n';
