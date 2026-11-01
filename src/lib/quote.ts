/**
 * Quote maths and formatting, shared by the quote page (live totals) and the PDF.
 * All money is held as whole pence so totals never pick up floating-point drift.
 */

export interface QuoteItem {
  description: string;
  /** Price in pence. Ignored (treated as 0) when `free`. */
  pence: number;
  free: boolean;
}

export interface QuoteSwitches {
  discountEnabled: boolean;
  /** 0-100, may have decimals. */
  discountPercent: number;
  vatEnabled: boolean;
  /** 0-100, may have decimals. */
  vatRate: number;
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  afterDiscount: number;
  vat: number;
  total: number;
}

const clampPercent = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);

export function calculate(items: QuoteItem[], s: QuoteSwitches): QuoteTotals {
  const subtotal = items.reduce((sum, i) => sum + (i.free ? 0 : Math.max(0, Math.round(i.pence))), 0);
  const discount = s.discountEnabled ? Math.round((subtotal * clampPercent(s.discountPercent)) / 100) : 0;
  const afterDiscount = subtotal - discount;
  const vat = s.vatEnabled ? Math.round((afterDiscount * clampPercent(s.vatRate)) / 100) : 0;
  return { subtotal, discount, afterDiscount, vat, total: afterDiscount + vat };
}

/** Typed text such as "£1,250", "1250.5" or "1 250" -> pence. Anything unreadable becomes 0. */
export function parsePence(input: string): number {
  const cleaned = input.replace(/[£\s,]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
/** 125000 -> "£1,250.00" */
export const formatPence = (pence: number) => gbp.format(pence / 100);

/** 10 -> "10", 12.5 -> "12.5" (no trailing zeros, for "Special discount (10%)"). */
export const formatPercent = (n: number) => String(Number(clampPercent(n).toFixed(2)));

/** "2027-06-14" -> "14 June 2027". Empty or invalid input returns the fallback. */
export function formatDate(iso: string, fallback = 'To be confirmed'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fallback;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== m - 1) return fallback;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
