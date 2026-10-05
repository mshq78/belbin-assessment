/**
 * Utility functions for Persian formatting
 */

const FARSI_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const PERSIAN_TO_ENGLISH_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function toPersianDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/[0-9]/g, (w) => FARSI_DIGITS[+w]);
}

// Backward compatibility alias
export const toFarsiDigits = toPersianDigits;

/**
 * Normalizes Persian/Arabic digits to English digits
 */
export function normalizeToEnglishDigits(str: string): string {
  return str.replace(/[۰-۹٠-٩]/g, (ch) => PERSIAN_TO_ENGLISH_MAP[ch] || ch);
}

/**
 * Validates Iranian mobile numbers (09xxxxxxxxx or 9xxxxxxxxx)
 */
export function validateIranMobile(mobile: string): boolean {
  if (!mobile) return false;
  const clean = normalizeToEnglishDigits(mobile).trim().replace(/[\s-]/g, '');
  return /^09[0-9]{9}$/.test(clean) || /^\+989[0-9]{9}$/.test(clean);
}

/**
 * Generates an elegant tracking code like "۲۴۹۱-BLB7"
 */
export function generateTrackingCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const suffix = 'BLB' + (Math.floor(Math.random() * 9) + 1);
  return `${toPersianDigits(num)}-${suffix}`;
}

/**
 * Formats a score with 1 decimal place and Persian digits
 */
export function formatScore(score: number): string {
  const rounded = Math.round(score * 10) / 10;
  const formatted = rounded.toFixed(1);
  return toPersianDigits(formatted);
}

/**
 * Formats a percentage
 */
export function formatPercent(percent: number): string {
  return `${toPersianDigits(Math.round(percent))}٪`;
}

/**
 * Formats milliseconds to readable seconds in Persian
 */
export function formatSeconds(ms: number): string {
  const sec = (ms / 1000).toFixed(1);
  return `${toPersianDigits(sec)} ثانیه`;
}
