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
