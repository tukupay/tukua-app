/** Map API / network errors to short user-facing copy (UX rules). */

const MAP: Array<{ test: RegExp; message: string }> = [
  {
    test: /authentication required|please login|unauthorized|invalid or expired session|invalid_jwt|auth_required/i,
    message:
      "We couldn't reach the registration service. Check you're online, or try again in a moment. If this keeps happening, restart the app.",
  },
  {
    test: /network request failed|failed to fetch|network error|ECONNREFUSED|timed out|timeout/i,
    message: "We couldn't reach the server. Check your connection and try again.",
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
    test: /already registered|account_exists|phone_already_activated|duplicate|already in use/i,
    message: 'That email or phone is already registered. Try signing in instead.',
  },
  {
    test: /payment not found|pea_incomplete|not completed/i,
    message: 'We did not see a completed M-Pesa payment yet. Finish the prompt on your phone, then try again.',
  },
  {
    test: /could not start m-pesa|mpesa|daraja|gateway/i,
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

function extractRaw(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    if (typeof o.error === 'string' && o.error.trim()) return o.error;
  }
  return String(err);
}

/** Never show raw HTTP/JSON to the user. */
export function humanizeError(err: unknown, fallback = DEFAULT): string {
  const raw = extractRaw(err).trim();
  if (!raw) return fallback;
  for (const row of MAP) {
    if (row.test.test(raw)) return row.message;
  }
  // Short plain sentences from Nest are OK to show; strip codes.
  if (raw.length < 160 && !/[{}\[\]StatusCode|stack|jwt|supabase]/i.test(raw)) {
    return raw;
  }
  return fallback;
}
