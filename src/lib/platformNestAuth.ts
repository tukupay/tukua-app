/**
 * Nest platform identity JWT (chat/courses WebViews, /platform/*, and the school API for people
 * with no Desk profile). Sign-in: POST /platform/auth/login on the Nest api-host.
 *
 * Lifetimes (packages/api/src/modules/platform/identity-auth.service.ts signTokens): access 7 days,
 * refresh 30 days. POST /platform/auth/refresh { refresh_token } returns a NEW access AND refresh
 * token (rotation), so a phone that opens the app at least once a month stays signed in.
 *
 * Rules here:
 * - expiry comes from the token's own `exp` claim (stored expiry only as a fallback);
 * - refresh a day before the access token runs out, on app foreground, and once after a 401;
 * - one refresh at a time (single-flight) — parallel calls share it;
 * - a network error or 5xx never clears anything; only a refresh the server REJECTS (401/403/400)
 *   drops the refresh token, and only then (with no stored password to sign in again and no
 *   still-valid access token) does {@link onPlatformAuthRejected} fire so the app signs out.
 */
import * as SecureStore from './secureStore';
import { getDeskCredentials, getDeskToken, hasNestDeskToken } from './deskApi';
import { getNestApiBaseUrl } from './localHost';
import { log } from './logger';

const ACCESS_KEY = 'tukua_platform_nest_access';
const REFRESH_KEY = 'tukua_platform_nest_refresh';
const EXPIRES_KEY = 'tukua_platform_nest_expires_at';

/** Refresh this long before the access token expires (access lives 7 days). */
const REFRESH_LEAD_SEC = 24 * 3600;
/** A token with less than this left is treated as expired. */
const MIN_VALID_SEC = 60;
/** After a failed (network) refresh, do not retry the proactive refresh for this long. */
const RETRY_AFTER_FAIL_MS = 60_000;

type LoginPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export type PlatformTokens = { accessToken: string; refreshToken: string | null };

type RefreshOutcome =
  | { kind: 'ok'; token: string }
  | { kind: 'none' }
  | { kind: 'network' }
  | { kind: 'rejected'; status: number };

const tokenListeners = new Set<(t: PlatformTokens) => void>();
const rejectedListeners = new Set<() => void>();

/** Fires after every new access token (refresh or password re-login) — push it to the WebViews. */
export function onPlatformTokensChanged(listener: (t: PlatformTokens) => void) {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

/** Fires when the server rejected the refresh token and nothing else could sign the person in. */
export function onPlatformAuthRejected(listener: () => void) {
  rejectedListeners.add(listener);
  // Rejected before this listener existed (e.g. during boot restore): tell it now.
  if (authRejected) setTimeout(() => rejectedListeners.has(listener) && listener(), 0);
  return () => {
    rejectedListeners.delete(listener);
  };
}

function emitTokens(t: PlatformTokens) {
  tokenListeners.forEach((fn) => {
    try {
      fn(t);
    } catch {
      /* ignore */
    }
  });
}

/** Set when the server rejected the refresh token and nothing could sign in again. */
let authRejected = false;

/** True once the refresh token was rejected and no other sign-in worked (until the next sign-in). */
export function isPlatformAuthRejected() {
  return authRejected;
}

function emitRejected() {
  authRejected = true;
  rejectedListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function nestBase(): string {
  return getNestApiBaseUrl().replace(/\/$/, '');
}

/** `exp` claim (seconds) of a JWT, or null when it cannot be read. */
export function jwtExpiry(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = JSON.parse(atob(b64)) as { exp?: unknown };
    const exp = Number(json.exp);
    return Number.isFinite(exp) && exp > 0 ? exp : null;
  } catch {
    return null;
  }
}

/** True when the token has a readable `exp` that is (nearly) past. Unknown expiry → false. */
export function isJwtExpired(token: string | null | undefined, skewSec = MIN_VALID_SEC): boolean {
  const exp = jwtExpiry(token);
  return exp != null && exp < nowSec() + skewSec;
}

async function readStored(): Promise<{ token: string; exp: number } | null> {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_KEY);
    if (!token) return null;
    const expRaw = await SecureStore.getItemAsync(EXPIRES_KEY);
    const exp = jwtExpiry(token) ?? (expRaw ? Number(expRaw) : 0);
    return { token, exp: exp || 0 };
  } catch {
    return null;
  }
}

/** Stored access token if it is valid for at least `minValiditySec` more seconds. */
async function readStoredAccess(minValiditySec = MIN_VALID_SEC): Promise<string | null> {
  const s = await readStored();
  if (!s) return null;
  // exp 0 = unknown (very old install): trust it; a 401 will trigger a refresh.
  if (s.exp && s.exp < nowSec() + minValiditySec) return null;
  return s.token;
}

async function persistTokens(access: string, refresh?: string | null, expiresIn?: number) {
  const exp = jwtExpiry(access) ?? nowSec() + (Number(expiresIn) || 7 * 24 * 3600);
  authRejected = false;
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  // A refresh token only when it really is one — never store the access token in its place.
  if (refresh && refresh !== access) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  await SecureStore.setItemAsync(EXPIRES_KEY, String(exp));
}

async function readRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

/** Persist Nest identity JWT after PEA / login (SecureStore). */
export async function persistPlatformNestSession(
  access: string,
  refresh?: string,
  expiresIn?: number,
) {
  await persistTokens(access, refresh, expiresIn);
}

/** Current stored access + refresh token (no network). */
export async function getStoredPlatformTokens(): Promise<PlatformTokens | null> {
  const s = await readStored();
  if (!s) return null;
  return { accessToken: s.token, refreshToken: await readRefreshToken() };
}

export async function clearPlatformNestToken() {
  authRejected = false;
  try {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(EXPIRES_KEY);
  } catch {
    /* ignore */
  }
}

async function unwrapData<T>(json: unknown): Promise<T> {
  if (json && typeof json === 'object' && 'data' in (json as object)) {
    return (json as { data: T }).data;
  }
  return json as T;
}

async function loginWithPassword(identifier: string, password: string): Promise<string | null> {
  const url = `${nestBase()}/platform/auth/login`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      log.warn('PlatformNest', 'login failed', { status: res.status, message: json?.message || json?.error });
      return null;
    }
    const data = await unwrapData<LoginPayload>(json);
    if (!data?.access_token) return null;
    await persistTokens(data.access_token, data.refresh_token, data.expires_in);
    log.info('PlatformNest', 'identity login ok');
    emitTokens({ accessToken: data.access_token, refreshToken: data.refresh_token ?? null });
    return data.access_token;
  } catch (e) {
    log.warn('PlatformNest', 'login network error', String(e));
    return null;
  }
}

let refreshInFlight: Promise<RefreshOutcome> | null = null;
let lastRefreshFailAt = 0;

async function doRefresh(): Promise<RefreshOutcome> {
  const refresh = await readRefreshToken();
  if (!refresh) return { kind: 'none' };
  let res: Response;
  try {
    res = await fetch(`${nestBase()}/platform/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
  } catch (e) {
    log.warn('PlatformNest', 'refresh network error — keeping session', String(e));
    return { kind: 'network' };
  }
  const json = await res.json().catch(() => null);
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    log.warn('PlatformNest', 'refresh token rejected', { status: res.status, message: json?.message || json?.error });
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch {
      /* ignore */
    }
    return { kind: 'rejected', status: res.status };
  }
  if (!res.ok) {
    log.warn('PlatformNest', 'refresh server error — keeping session', res.status);
    return { kind: 'network' };
  }
  const data = await unwrapData<LoginPayload>(json);
  if (!data?.access_token) return { kind: 'network' };
  const nextRefresh = data.refresh_token ?? refresh;
  await persistTokens(data.access_token, nextRefresh, data.expires_in);
  log.info('PlatformNest', 'access token refreshed');
  emitTokens({ accessToken: data.access_token, refreshToken: nextRefresh });
  return { kind: 'ok', token: data.access_token };
}

/** Single-flight refresh: concurrent callers share one network call. */
function refreshOnce(): Promise<RefreshOutcome> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh()
      .catch((e): RefreshOutcome => {
        log.warn('PlatformNest', 'refresh failed', String(e));
        return { kind: 'network' };
      })
      .then((r) => {
        lastRefreshFailAt = r.kind === 'ok' ? 0 : Date.now();
        return r;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function refreshAccess(): Promise<string | null> {
  const r = await refreshOnce();
  return r.kind === 'ok' ? r.token : null;
}

/**
 * New platform token now (refresh re-reads roles and schools): after a join is approved or a role
 * changes, the stored token still carries the old ones until it expires. Also called on app
 * foreground. Never clears the session on a network error.
 */
export async function refreshPlatformNestToken(): Promise<string | null> {
  return refreshAccess();
}

/**
 * After a 401 with `rejectedToken`: get a different, valid token (refresh, else password sign-in),
 * or null. When the server rejected the refresh token and nothing else works, the app signs out.
 */
export async function recoverPlatformTokenAfter401(rejectedToken?: string | null): Promise<string | null> {
  // Another call may already have refreshed while this request was in flight.
  const current = await readStoredAccess();
  if (current && current !== rejectedToken) return current;
  const r = await refreshOnce();
  if (r.kind === 'ok') return r.token;
  const creds = await getDeskCredentials();
  if (creds?.email && creds.password) {
    const fromLogin = await loginWithPassword(creds.email, creds.password);
    if (fromLogin) return fromLogin;
  }
  if (r.kind === 'rejected') emitRejected();
  return null;
}

/**
 * fetch with the platform Bearer token: refreshes ahead of expiry, and on a 401 refreshes once
 * and retries the request once.
 */
export async function fetchWithPlatformAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await resolveNestAccessTokenForWebView();
  const withAuth = (t: string | null): RequestInit => {
    const headers = new Headers(init.headers as HeadersInit | undefined);
    if (t) headers.set('Authorization', `Bearer ${t}`);
    return { ...init, headers };
  };
  const res = await fetch(url, withAuth(token));
  if (res.status !== 401) return res;
  const next = await recoverPlatformTokenAfter401(token);
  if (!next || next === token) return res;
  return fetch(url, withAuth(next));
}

/**
 * Nest JWT for SPA `tukua_nest_access_token` and every platform call.
 * Order: stored token (refreshed a day before expiry) → refresh → password sign-in → Desk Nest JWT
 * → still-valid stored token. Network trouble never signs anyone out.
 */
export async function resolveNestAccessTokenForWebView(): Promise<string | null> {
  const fresh = await readStoredAccess(REFRESH_LEAD_SEC);
  if (fresh) return fresh;

  const stillValid = await readStoredAccess(MIN_VALID_SEC);
  // Inside the refresh window but recently failed (offline): use what we have.
  if (stillValid && Date.now() - lastRefreshFailAt < RETRY_AFTER_FAIL_MS) return stillValid;

  const r = await refreshOnce();
  if (r.kind === 'ok') return r.token;
  if (stillValid) return stillValid;

  const creds = await getDeskCredentials();
  if (creds?.email && creds.password) {
    const fromLogin = await loginWithPassword(creds.email, creds.password);
    if (fromLogin) return fromLogin;
  }

  if (await hasNestDeskToken()) {
    const desk = await getDeskToken();
    if (desk && !isJwtExpired(desk)) {
      log.info('PlatformNest', 'using Desk Nest JWT for WebView');
      return desk;
    }
  }

  if (r.kind === 'rejected') {
    emitRejected();
    return null;
  }

  // Offline / server down with an expired token: hand back the last token rather than nothing,
  // so the app stays signed in and recovers when the network returns.
  const last = await readStored();
  return last?.token ?? null;
}
