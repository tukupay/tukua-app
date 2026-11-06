/** Map API / network errors to short user-facing copy (UX rules). */

const MAP: Array<{ test: RegExp; message: string }> = [
  {
    test: /mpesa_not_configured|school fee m-pesa is not configured|callback url is not configured/i,
    message:
      "School fee M-Pesa isn't configured on this server/staging. This isn't about your phone being unreachable — ask an admin to set Daraja keys.",
  },
  {
    test: /invalid login credentials|invalid_credentials/i,
    message: 'That email or password is not right. Try again, or sign in if you already have an account.',
  },
  {
    test: /authentication required|please login|unauthorized|invalid or expired session|invalid_jwt|auth_required|session expired/i,
    message: 'Could not start payment yet. Tap Complete again.',
  },
  {
    test: /network request failed|failed to fetch|network error|ECONNREFUSED|ECONNABORTED/i,
    message: 'The server did not respond. Wait a moment and try again.',
  },
  {
    test: /password must be at least/i,
    message: 'Use a password with at least 6 characters.',
  },
  {
    test: /passwords? do not match|password.*match/i,
    message: 'Those passwords do not match.',
  },
  {
    test: /already registered|account_exists|phone_already_activated|duplicate|already in use|already on tukua/i,
    message: 'That email or phone is already registered on Tukua. Try signing in instead.',
  },
  {
    test: /payment not found|pea_incomplete|not completed/i,
    message: 'We did not see a completed M-Pesa payment yet. Finish the prompt on your phone, then try again.',
  },
  {
    test: /could not start m-pesa|mpesa is not configured|daraja.*(fail|error|unavailable)/i,
    message: 'We could not start M-Pesa right now. Check your phone number and try again in a moment.',
  },
  {
    test: /otp|verification code|invalid code/i,
    message: 'That verification code did not work. Request a new code and try again.',
  },
  {
    test: /rate limit|too many/i,
    message: 'Too many attempts. Wait a moment and try again.',
  },
  {
    test: /not configured|service unavailable|503/i,
    message: 'That service is temporarily unavailable. Please try again shortly.',
  },
];

const DEFAULT = "Hmm, that didn't quite go through. Please try again.";

/** Looks like a stack dump / HTTP blob, not a sentence we can show. */
function looksLikeDump(raw: string): boolean {
  if (raw.length > 280) return true;
  return /StatusCode|at\s+\w+\.\w+|supabase|stack trace/i.test(raw) && /[{}\[\]]/.test(raw);
}

function extractFromObject(o: Record<string, unknown>): string {
  const msg = o.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg)) {
    return msg.filter((x) => typeof x === 'string' && x.trim()).join('. ');
  }
  if (typeof o.error === 'string' && o.error.trim()) return o.error;
  if (o.error && typeof o.error === 'object') {
    const nested = extractFromObject(o.error as Record<string, unknown>);
    if (nested) return nested;
  }
  if (typeof o.result_description === 'string' && o.result_description.trim()) {
    return o.result_description;
  }
  return '';
}

function extractRaw(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') {
    const s = err.trim();
    if ((s.startsWith('{') || s.startsWith('[')) && s.length < 4000) {
      try {
        return extractRaw(JSON.parse(s));
      } catch {
        /* keep string */
      }
    }
    return s;
  }
  if (err instanceof Error) return extractRaw(err.message);
  if (typeof err === 'object') {
    const fromObj = extractFromObject(err as Record<string, unknown>);
    if (fromObj) return fromObj;
  }
  return String(err);
}

/** Never show raw HTTP/JSON to the user. Prefer Nest/Daraja sentences as-is. */
export function humanizeError(err: unknown, fallback = DEFAULT): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  if (code && /mpesa_not_configured/i.test(code)) {
    return MAP[0].message;
  }
  if (code && /kyc_required/i.test(code)) {
    return 'Complete identity verification (KYC) before depositing or sending.';
  }
  const raw = extractRaw(err).trim();
  if (!raw) return fallback;
  for (const row of MAP) {
    if (row.test.test(raw)) return row.message;
  }
  if (!looksLikeDump(raw)) return raw;
  return fallback;
}
