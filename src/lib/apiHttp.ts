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
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this.';
  if (status === 404) return 'Not found.';
  if (status === 408 || status === 504) return TIMEOUT_MESSAGE;
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status >= 500) return 'The server had a problem. Please try again shortly.';
  return `Request failed (${status}).`;
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
