/**
 * Activation refusals (API, 17 Nov 2026): a person who has never bought tokens may read but not act
 * (403 `account_not_activated`); staff and family of a school that has never bought tokens cannot open its
 * records (403 `school_not_activated`). deskFetch announces each refusal here; ActivationPrompt (mounted once
 * in AppNavigator) asks the person to buy tokens, as tukua.ai does (web/src/components/activation).
 */
export type ActivationCode = 'account_not_activated' | 'school_not_activated';
export type ActivationNotice = { code: ActivationCode; message: string };

export const ACCOUNT_NOT_ACTIVATED_MESSAGE = 'Activate your account: buy tokens to start.';
export const SCHOOL_NOT_ACTIVATED_MESSAGE = 'Activate your school: buy tokens for the school to start.';

/** The refusal's code from an error body, or null when it is not an activation refusal. */
export function activationCodeOf(body: unknown): ActivationCode | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const nested = (b.error && typeof b.error === 'object' ? b.error : {}) as Record<string, unknown>;
  const data = (b.data && typeof b.data === 'object' ? b.data : {}) as Record<string, unknown>;
  for (const v of [b.code, b.error, nested.code, data.code]) {
    if (v === 'account_not_activated' || v === 'school_not_activated') return v;
  }
  return null;
}

/** The sentence to show for a refusal: the server's own when it sent one. */
export function activationMessage(code: ActivationCode, body?: unknown): string {
  const m = body && typeof body === 'object' ? (body as { message?: unknown }).message : null;
  if (typeof m === 'string' && m.trim()) return m.trim();
  return code === 'school_not_activated' ? SCHOOL_NOT_ACTIVATED_MESSAGE : ACCOUNT_NOT_ACTIVATED_MESSAGE;
}

type Listener = (notice: ActivationNotice) => void;
const listeners = new Set<Listener>();
let lastAt = 0;

export function onActivationRequired(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Tell the app once per burst (a screen firing six reads must not stack six prompts). */
export function announceActivationRequired(notice: ActivationNotice, now = Date.now()): boolean {
  if (now - lastAt < 4000) return false;
  lastAt = now;
  for (const fn of listeners) {
    try {
      fn(notice);
    } catch {
      /* a listener's failure must not break the request that announced it */
    }
  }
  return true;
}

/** Tests only. */
export function resetActivationForTests() {
  lastAt = 0;
  listeners.clear();
}
