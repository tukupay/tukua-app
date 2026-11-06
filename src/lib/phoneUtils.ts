/** Kenya-focused phone helpers (matches yana/src/lib/phoneUtils.ts). */

export function canonicalizePhone(input: string | null | undefined): string {
  if (!input) return '';
  return String(input).replace(/\D/g, '').slice(-9);
}

export function digitsOnly(input: string): string {
  return String(input).replace(/\D/g, '');
}

/** Build E.164 for Kenya e.g. +254712345678 */
export function toE164Kenya(localNumber: string): string {
  let local = digitsOnly(localNumber);
  if (local.startsWith('254')) return `+${local}`;
  if (local.startsWith('0')) local = local.slice(1);
  if (local.length === 9) return `+254${local}`;
  if (localNumber.trim().startsWith('+')) return localNumber.trim();
  return local ? `+254${local}` : '';
}

/** M-Pesa STK expects 2547XXXXXXXX */
export function toMpesaPhone(e164: string, localFallback?: string): string {
  const parsed = digitsOnly(e164 || localFallback || '');
  const nine = parsed.slice(-9);
  if (nine.length === 9) return `254${nine}`;
  return parsed;
}

/**
 * Kenya mobile: 07XXXXXXXX, 01XXXXXXXX, 2547… / 2541…, +2547… / +2541…
 * Returns the 9-digit national number or null.
 */
export function kenyaMobileNational(input: string): string | null {
  let d = digitsOnly(input);
  if (!d) return null;
  if (d.startsWith('254') && d.length >= 12) d = d.slice(3);
  else if (d.startsWith('0') && d.length >= 10) d = d.slice(1);
  if (d.length !== 9) return null;
  if (!/^[17]/.test(d)) return null;
  return d;
}

/** UI error or null if the number is a valid Kenya mobile. */
export function kenyaMobileError(input: string): string | null {
  if (!String(input || '').trim()) return 'Please enter a valid phone number';
  if (kenyaMobileNational(input)) return null;
  return 'Enter a valid phone number';
}

