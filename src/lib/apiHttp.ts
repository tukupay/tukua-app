/**
 * Shared plumbing for the app's API clients: a timeout on every request, JSON that may not be JSON,
 * and one clean, human error message for network failures, timeouts and 4xx/5xx answers.
 * Callers get `Error` objects (with `statusCode` / `code` when the server answered) — never a raw
 * HTML page, a TypeError from fetch, or a hang.
 */

/** Default time to wait for the API before giving up. */
export const API_TIMEOUT_MS = 20_000;

export type ApiError = Error & { statusCode?: number; code?: string; timeout?: boolean; network?: boolean };

export const NETWORK_MESSAGE = 'Cannot reach Tukua — check your network connection and try again.';
export const TIMEOUT_MESSAGE = 'Network timeout — the server took too long to answer. Try again.';

export function apiError(
  message: string,
  extra: { statusCode?: number; code?: string; timeout?: boolean; network?: boolean } = {},
): ApiError {
  const e = new Error(message) as ApiError;
  if (extra.statusCode !== undefined) e.statusCode = extra.statusCode;
  if (extra.code) e.code = extra.code;
  if (extra.timeout) e.timeout = true;
  if (extra.network) e.network = true;
  return e;
}

/**
 * fetch with a timeout. A caller's own `signal` still cancels (the AbortError is passed through
 * unchanged so search-as-you-type can ignore it); the timeout and network failures become
 * clean errors.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController();
  const outer = init.signal;
  let timedOut = false;
  const onOuterAbort = () => ctrl.abort();
  if (outer) {
    if (outer.aborted) ctrl.abort();
    else outer.addEventListener('abort', onOuterAbort);
  }
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (timedOut) throw apiError(TIMEOUT_MESSAGE, { timeout: true });
    if (outer?.aborted) throw e;
    throw apiError(NETWORK_MESSAGE, { network: true });
  } finally {
    clearTimeout(timer);
    if (outer) outer.removeEventListener('abort', onOuterAbort);
  }
}

/**
 * Run a request (fetch + reading the body) under one timeout signal — for helpers that go through
 * another fetch wrapper (e.g. fetchWithPlatformAuth) and only accept `signal` in `init`.
 */
export async function runWithTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<T> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeoutMs);
  try {
    return await run(ctrl.signal);
  } catch (e) {
    if (timedOut) throw apiError(TIMEOUT_MESSAGE, { timeout: true });
    if ((e as ApiError)?.statusCode !== undefined) throw e;
    if (e instanceof TypeError || /network request failed|failed to fetch|network error/i.test(String(e))) {
      throw apiError(NETWORK_MESSAGE, { network: true });
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Body as JSON, or null for an empty / non-JSON body (an HTML error page, a proxy message). */
export async function readJsonSafe(res: Response): Promise<unknown> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    return null;
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function pickMessage(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const o = json as Record<string, unknown>;
  const m = o.message;
  if (typeof m === 'string' && m.trim()) return m.trim();
  if (Array.isArray(m)) {
    const parts = m.filter((x) => typeof x === 'string' && x.trim());
    if (parts.length) return parts.join('. ');
  }
  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
  if (o.error && typeof o.error === 'object') return pickMessage(o.error);
  return '';
}

/** A sentence for a failed answer: the server's own message when it sent one, else by status. */
export function messageForStatus(status: number, json: unknown): string {
  const fromServer = pickMessage(json);
  // Never show an HTML page or a stack dump.
  if (fromServer && fromServer.length <= 300 && !/<html|<!doctype/i.test(fromServer)) return fromServer;
  if (status === 400 || status === 422) return 'Some details are not right. Check them and try again.';
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this.';
  if (status === 404) return 'Not found.';
  if (status === 408 || status === 504) return TIMEOUT_MESSAGE;
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status >= 500) return 'The server had a problem. Please try again shortly.';
  return `Request failed (${status}).`;
}

export const BAD_ANSWER_MESSAGE =
  'We got an unexpected answer from Tukua. Check your connection (some Wi-Fi needs a sign-in page first) and try again.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/** Text that must never reach a user: empty, "undefined", "[object Object]", a JS TypeError, a stack or HTML. */
function unshowable(msg: string): boolean {
  if (!msg) return true;
  if (/^(undefined|null|nan|error|\[object \w+\]|typeerror|syntaxerror)$/i.test(msg)) return true;
  if (msg.length > 240) return true;
  if (/<html|<!doctype|\n\s+at\s|\bat\s+\S+\s+\(|stack trace/i.test(msg)) return true;
  if (/undefined is not|null is not an object|cannot read propert|is not a function|is not defined|of undefined|of null/i.test(msg)) {
    return true;
  }
  if (/^\s*[{[]/.test(msg)) return true;
  return false;
}

/**
 * One clear sentence for any failure — an ApiError, a fetch TypeError, a JSON SyntaxError, a thrown string or
 * object, or nothing at all. Never returns "undefined", a stack, or HTML. Status codes get their own wording.
 */
export function userMessageFromError(err: unknown, fallback: string = GENERIC_MESSAGE): string {
  try {
    if (err == null) return fallback;
    const e = err as Partial<ApiError> & { status?: unknown; name?: unknown };
    if (e.timeout) return TIMEOUT_MESSAGE;
    if (e.network) return NETWORK_MESSAGE;
    let msg = '';
    if (typeof err === 'string') msg = err;
    else if (typeof e.message === 'string') msg = e.message;
    else if (Array.isArray(e.message)) msg = (e.message as unknown[]).filter((x) => typeof x === 'string').join('. ');
    msg = msg.trim();
    if (/network request failed|failed to fetch|network error|ECONN|ENOTFOUND|unable to resolve host|internet connection appears/i.test(msg)) {
      return NETWORK_MESSAGE;
    }
    if (e.name === 'AbortError' || /\baborted\b|timed? ?out|timeout/i.test(msg)) return TIMEOUT_MESSAGE;
    if (e.name === 'SyntaxError' || /JSON Parse error|Unexpected token|not valid JSON|Unexpected end of/i.test(msg)) {
      return BAD_ANSWER_MESSAGE;
    }
    const status =
      typeof e.statusCode === 'number' ? e.statusCode : typeof e.status === 'number' ? (e.status as number) : 0;
    if (status === 429 || /too many|rate limit/i.test(msg)) return 'Too many tries. Wait a minute and try again.';
    if (!unshowable(msg)) return msg;
    if (status >= 400) return messageForStatus(status, null);
    return fallback;
  } catch {
    return fallback;
  }
}

/** Dev-only detail for a failure the user saw as a friendly sentence (never logs passwords — pass none). */
export function warnDev(scope: string, err: unknown, extra?: Record<string, unknown>) {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  try {
    const e = err as Partial<ApiError> & { stack?: string };
    console.warn(`[${scope}]`, {
      message: typeof e?.message === 'string' ? e.message : String(err),
      statusCode: e?.statusCode,
      code: e?.code,
      timeout: e?.timeout,
      network: e?.network,
      ...extra,
      stack: typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 4).join('\n') : undefined,
    });
  } catch {
    /* never let logging break a screen */
  }
}

/** `{ data: T }` envelope → T; anything else as-is. */
export function unwrapEnvelope<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in (json as object)) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/** First array found at one of `keys` (or the value itself when it is an array); [] otherwise. */
export function listFrom<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of keys) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
  }
  return [];
}
