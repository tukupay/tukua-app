/**
 * NestJS desk API client (yana/desktop packages/api).
 * Base URL from EXPO_PUBLIC_DESK_API_URL (unified via localHost).
 */

import * as SecureStore from './secureStore';
import { getDeskApiBaseUrl, getLocalUrlDebugInfo } from './localHost';
import { log } from './logger';
import { normalizeDeskRoles } from './deskRoles';
import { API_TIMEOUT_MS, NETWORK_MESSAGE, fetchWithTimeout, messageForStatus, readJsonSafe } from './apiHttp';

const DESK_TOKEN_KEY = 'tukua_desk_auth_token';
const DESK_USER_KEY = 'tukua_desk_user';
/** 'nest' = password login JWT (required for /parents/me/*). */
const DESK_TOKEN_SOURCE_KEY = 'tukua_desk_token_source';
/** Email+password for Nest soft-reconnect after app restart (SecureStore). */
const DESK_CREDS_KEY = 'tukua_desk_login_creds';

type DeskTokenSource = 'nest';

export type DeskUser = {
  id?: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  school_id?: string | null;
  user_roles?: string[] | string;
  school_level?: number | null;
  /** School/role pick persisted with the Nest token session. */
  selected_context?: {
    schoolId: string | null;
    studentId: string | null;
    activeRole?: string | null;
    skipped?: boolean;
  } | null;
};

export type DeskLoginResult = {
  token: string;
  user: DeskUser;
  loginType?: 'offline' | 'online';
};

let memoryToken: string | null = null;
let memoryUser: DeskUser | null = null;
let memoryTokenSource: DeskTokenSource | null = null;
/** Dedupe concurrent Nest password logins (connectDesk + ensureNestDeskSession). */
let deskLoginInFlight: Promise<DeskLoginResult> | null = null;

/** Active parent/staff school + student — attached to Desk API calls. */
let activeSchoolId: string | null = null;
let activeStudentId: string | null = null;
let activeRoles: string[] = [];

export function setDeskActiveContext(ctx: {
  schoolId?: string | null;
  studentId?: string | null;
  roles?: string[] | string | null;
}) {
  if (ctx.schoolId !== undefined) activeSchoolId = ctx.schoolId;
  if (ctx.studentId !== undefined) activeStudentId = ctx.studentId;
  if (ctx.roles !== undefined) {
    if (Array.isArray(ctx.roles)) {
      activeRoles = ctx.roles.map(String).filter(Boolean);
    } else if (typeof ctx.roles === 'string' && ctx.roles.trim()) {
      activeRoles = ctx.roles.split(',').map((r) => r.trim()).filter(Boolean);
    } else {
      activeRoles = [];
    }
  }
}

export function getDeskActiveContext() {
  return { schoolId: activeSchoolId, studentId: activeStudentId, roles: activeRoles };
}


type DeskSessionListener = () => void;
const sessionClearListeners = new Set<DeskSessionListener>();

/** DeskAuthContext subscribes so React state clears when Auth sign-out wipes storage. */
export function onDeskSessionCleared(listener: DeskSessionListener) {
  sessionClearListeners.add(listener);
  return () => {
    sessionClearListeners.delete(listener);
  };
}

export function resolveDeskApiBaseUrl(): string {
  return getDeskApiBaseUrl();
}

export async function getDeskToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = await SecureStore.getItemAsync(DESK_TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export async function getCachedDeskUser(): Promise<DeskUser | null> {
  if (memoryUser) return memoryUser;
  try {
    const raw = await SecureStore.getItemAsync(DESK_USER_KEY);
    if (!raw) return null;
    memoryUser = JSON.parse(raw) as DeskUser;
    return memoryUser;
  } catch {
    return null;
  }
}

async function persistDeskSession(token: string, user: DeskUser, source: DeskTokenSource) {
  memoryToken = token;
  memoryUser = user;
  memoryTokenSource = source;
  await SecureStore.setItemAsync(DESK_TOKEN_KEY, token);
  await SecureStore.setItemAsync(DESK_USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync(DESK_TOKEN_SOURCE_KEY, source);
}

/** Keep school/role (or skipped individual) on the same SecureStore session as the Nest token. */
export async function attachSelectedContextToDeskUser(
  ctx: DeskUser['selected_context'],
): Promise<void> {
  try {
    const token = memoryToken ?? (await SecureStore.getItemAsync(DESK_TOKEN_KEY));
    if (!token) return;
    const user = memoryUser ?? (await getCachedDeskUser());
    if (!user) return;
    const source = memoryTokenSource ?? (await getDeskTokenSource()) ?? 'nest';
    await persistDeskSession(token, { ...user, selected_context: ctx ?? null }, source);
  } catch {
    /* ignore */
  }
}

export async function getDeskTokenSource(): Promise<DeskTokenSource | null> {
  if (memoryTokenSource) return memoryTokenSource;
  try {
    const raw = await SecureStore.getItemAsync(DESK_TOKEN_SOURCE_KEY);
    if (raw === 'nest') {
      memoryTokenSource = raw;
      return raw;
    }
  } catch {
    // ignore
  }
  return null;
}

/** True when Desk Bearer came from Nest password login. */
export async function hasNestDeskToken(): Promise<boolean> {
  return (await getDeskTokenSource()) === 'nest';
}

export async function saveDeskCredentials(email: string, password: string): Promise<void> {
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    password,
  });
  await SecureStore.setItemAsync(DESK_CREDS_KEY, payload);
}

export async function getDeskCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(DESK_CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; password?: string };
    if (!parsed.email || !parsed.password) return null;
    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

export async function clearDeskCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DESK_CREDS_KEY);
  } catch {
    // ignore
  }
}

/**
 * After app restart / session restore, Nest parent APIs need a Nest JWT.
 * Reconnect with stored password when the desk token is missing.
 */
export async function ensureNestDeskSession(): Promise<boolean> {
  if (await hasNestDeskToken()) {
    return true;
  }
  const creds = await getDeskCredentials();
  if (!creds) {
    log.info('DeskApi', 'no stored nest credentials — sign in once to enable Desk parent APIs');
    return false;
  }
  // The server already said this person has no school-API profile: calls use the platform token.
  if (noDeskProfileEmail === creds.email) return false;
  try {
    log.info('DeskApi', 'soft reconnect nest with stored credentials', { email: creds.email });
    await deskLogin(creds.email, creds.password);
    return true;
  } catch (e) {
    if ((e as { statusCode?: number })?.statusCode === 404) noDeskProfileEmail = creds.email;
    log.warn('DeskApi', 'soft reconnect nest failed', String(e));
    return false;
  }
}

/** Email whose /auth/login answered 404 (no Desk profile) this session — not retried on every call. */
let noDeskProfileEmail: string | null = null;

/** Await an in-flight Nest password login started elsewhere (e.g. connectDesk). */
export async function awaitDeskLoginInFlight(): Promise<DeskLoginResult | null> {
  if (!deskLoginInFlight) return null;
  try {
    return await deskLoginInFlight;
  } catch {
    return null;
  }
}

export async function clearDeskSession() {
  memoryToken = null;
  memoryUser = null;
  memoryTokenSource = null;
  activeSchoolId = null;
  activeStudentId = null;
  try {
    await SecureStore.deleteItemAsync(DESK_TOKEN_KEY);
    await SecureStore.deleteItemAsync(DESK_USER_KEY);
    await SecureStore.deleteItemAsync(DESK_TOKEN_SOURCE_KEY);
    await SecureStore.deleteItemAsync(DESK_CREDS_KEY);
    const { clearPlatformNestToken } = await import('./platformNestAuth');
    await clearPlatformNestToken();
  } catch {
    // ignore
  }
  sessionClearListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

function unwrapData<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/** `exp` of the token is (nearly) past. Unknown expiry → false. */
function deskTokenExpired(token: string, skewSec = 60): boolean {
  try {
    const part = token.split('.')[1];
    if (!part) return false;
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const exp = Number((JSON.parse(atob(b64)) as { exp?: unknown }).exp);
    return Number.isFinite(exp) && exp > 0 && exp < Math.floor(Date.now() / 1000) + skewSec;
  } catch {
    return false;
  }
}

let deskRecoverInFlight: Promise<string | null> | null = null;
let deskRecoverFailedAt = 0;

/**
 * A usable token in place of `rejected` (expired or answered 401): another call's fresh token,
 * a new school-API sign-in with the stored password, or the platform token (refreshed). Single
 * flight; after a failure, waits a minute before trying again on the proactive (pre-request) path.
 */
async function recoverDeskAuth(
  rejected: string | null,
  opts: { after401?: boolean } = {},
): Promise<string | null> {
  if (!opts.after401 && Date.now() - deskRecoverFailedAt < 60_000) return null;
  if (!deskRecoverInFlight) {
    deskRecoverInFlight = (async () => {
      const current = await getDeskToken();
      if (current && current !== rejected && !deskTokenExpired(current)) return current;

      const creds = await getDeskCredentials();
      if (creds && noDeskProfileEmail !== creds.email) {
        try {
          log.info('DeskApi', 'school-API token expired — signing in again', { email: creds.email });
          const r = await deskLogin(creds.email, creds.password);
          if (r.token && r.token !== rejected) return r.token;
        } catch (e) {
          log.warn('DeskApi', 'sign-in again failed', String(e));
        }
      }

      const platform = await import('./platformNestAuth');
      const tok = opts.after401
        ? await platform.recoverPlatformTokenAfter401(rejected)
        : await platform.resolveNestAccessTokenForWebView();
      return tok && tok !== rejected && !deskTokenExpired(tok) ? tok : null;
    })()
      .catch(() => null)
      .then((t) => {
        deskRecoverFailedAt = t ? 0 : Date.now();
        return t;
      })
      .finally(() => {
        deskRecoverInFlight = null;
      });
  }
  return deskRecoverInFlight;
}

export async function deskFetch<T = unknown>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    token?: string | null;
    /** Give up after this long (default 20 s). */
    timeoutMs?: number;
    /** Internal: already tried Nest soft-reconnect after 401. */
    _retriedNest?: boolean;
  } = {},
): Promise<T> {
  const base = getDeskApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  let token = opts.token === undefined ? await getDeskToken() : opts.token;
  // The school-API token from /auth/login lives 7 days and has no refresh token: renew it before
  // sending a request that would only come back 401.
  if (token && opts.token === undefined && !opts._retriedNest && deskTokenExpired(token)) {
    token = (await recoverDeskAuth(token)) || token;
  }
  if (!token && opts.token === undefined) {
    // No school-API sign-in (someone who joined from the phone has no Desk staff profile, so
    // /auth/login answers 404): the platform token carries their schools and roles and the same
    // guard accepts it.
    const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
    token = await resolveNestAccessTokenForWebView();
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (activeSchoolId) headers['X-Desk-School-Id'] = activeSchoolId;
  if (activeStudentId) headers['X-Desk-Student-Id'] = activeStudentId;
  const roleHeader =
    activeRoles.length > 0
      ? activeRoles
      : memoryUser?.user_roles
        ? Array.isArray(memoryUser.user_roles)
          ? memoryUser.user_roles.map(String)
          : [String(memoryUser.user_roles)]
        : [];
  if (roleHeader.length) headers['X-Desk-Roles'] = roleHeader.join(',');

  log.info('DeskApi', `${opts.method ?? 'GET'} ${url}`, {
    schoolId: activeSchoolId,
    studentId: activeStudentId,
  });

  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }, opts.timeoutMs ?? API_TIMEOUT_MS);
  } catch (error) {
    // Clean sentence for the screen; the URL and the cause go to the log only.
    log.warn('DeskApi', 'network error', { url, error: String(error) });
    throw error instanceof Error ? error : new Error(NETWORK_MESSAGE);
  }

  // Non-JSON (an HTML error page from a proxy, an empty body) reads as null, never as the message.
  const json: unknown = await readJsonSafe(res);

  if (!res.ok) {
    const isLogin = path.includes('/auth/login');
    // 401 = missing or expired token: sign in again with the stored password, else refresh the
    // platform token, and retry the request once. Never signs anyone out here.
    if (res.status === 401 && !isLogin && !opts._retriedNest && opts.token === undefined) {
      const next = await recoverDeskAuth(token, { after401: true });
      if (next && next !== token) {
        return deskFetch<T>(path, { ...opts, token: next, _retriedNest: true });
      }
    }
    const errCode =
      typeof (json as { error?: unknown })?.error === 'string'
        ? String((json as { error: string }).error).trim()
        : typeof (json as { code?: unknown })?.code === 'string'
          ? String((json as { code: string }).code).trim()
          : '';
    const baseMsg =
      res.status === 401 && !isLogin
        ? 'Session expired. Please login to continue'
        : messageForStatus(res.status, json);
    // Append machine codes (mpesa_not_configured) but not HTTP phrases ("Forbidden", "Bad Request").
    const msg =
      errCode && errCode.includes('_') && errCode !== baseMsg && !String(baseMsg).includes(errCode)
        ? `${baseMsg} (${errCode})`
        : String(baseMsg);
    log.warn('DeskApi', msg, { status: res.status, path, error: errCode || undefined });
    throw Object.assign(new Error(msg), { code: errCode || undefined, statusCode: res.status });
  }

  if (json && typeof json === 'object' && 'success' in json && (json as { success: boolean }).success === false) {
    const msg = messageForStatus(res.status, json) || 'Desk request failed';
    throw Object.assign(new Error(msg), { statusCode: res.status });
  }

  return unwrapData<T>(json);
}

export async function deskLogin(email: string, password: string): Promise<DeskLoginResult> {
  if (deskLoginInFlight) {
    return deskLoginInFlight;
  }

  deskLoginInFlight = (async () => {
    const base = getDeskApiBaseUrl();
    log.info('DeskApi', 'attempting desk login', { email, baseUrl: base });

    const data = await deskFetch<{
      token?: string;
      access_token?: string;
      user?: DeskUser;
      loginType?: 'offline' | 'online';
    }>('/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
      token: null,
    });

    const token = data?.token || data?.access_token || '';
    const user = data?.user ?? ((data ?? {}) as unknown as DeskUser);

    if (!token) {
      throw new Error('Desk login response missing token');
    }

    const deskUser: DeskUser = {
      ...user,
      email: user?.email ?? email.trim(),
    };
    await persistDeskSession(token, deskUser, 'nest');
    try {
      await saveDeskCredentials(email, password);
    } catch (e) {
      log.warn('DeskApi', 'could not persist desk credentials', String(e));
    }
    log.info('DeskApi', 'desk login ok', {
      email: deskUser.email,
      roles: deskUser.user_roles,
      schoolId: deskUser.school_id,
      tokenSource: 'nest',
    });

    return {
      token,
      user: deskUser,
      loginType: data?.loginType,
    };
  })();

  try {
    const result = await deskLoginInFlight;
    noDeskProfileEmail = null;
    return result;
  } catch (e) {
    if ((e as { statusCode?: number })?.statusCode === 404) noDeskProfileEmail = email.trim().toLowerCase();
    throw e;
  } finally {
    deskLoginInFlight = null;
  }
}

export async function deskFetchMe(): Promise<DeskUser | null> {
  try {
    // Never block UI if /auth/me is slow.
    const raw = await Promise.race([
      deskFetch<{ user?: DeskUser } | DeskUser>('/auth/me'),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 2500);
      }),
    ]);
    // The API answers { user: {...} }; storing the wrapper lost the roles and the school.
    const user =
      raw && typeof raw === 'object' && 'user' in raw && raw.user ? raw.user : (raw as DeskUser | null);
    if (user) {
      memoryUser = { ...user, selected_context: memoryUser?.selected_context ?? user.selected_context };
      await SecureStore.setItemAsync(DESK_USER_KEY, JSON.stringify(memoryUser));
    }
    return user;
  } catch (error) {
    const msg = String(error);
    log.warn('DeskApi', 'auth/me failed', msg);
    // Keep desk token on /auth/me miss — Chat still uses platform Nest JWT.
    return null;
  }
}

/** Roles and school the desk token itself carries — what the server will act on. */
export async function getDeskTokenClaims(): Promise<{ schoolId: string | null; roles: string[] } | null> {
  const token = await getDeskToken();
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as {
      school_id?: string | null;
      user_roles?: unknown;
      roles?: unknown;
    };
    return {
      schoolId: json.school_id ? String(json.school_id) : null,
      roles: normalizeDeskRoles(json.user_roles ?? json.roles),
    };
  } catch {
    return null;
  }
}

/**
 * A school can change someone's role (or approve a join) while they are signed in; the token keeps
 * the old roles until a new sign-in. Compare the token with the server's current roles and sign in
 * again with the stored credentials when they differ. Returns true when a new token was issued.
 */
export async function refreshDeskTokenIfRolesChanged(): Promise<boolean> {
  const claims = await getDeskTokenClaims();
  if (!claims) return false;
  const me = await deskFetchMe();
  if (!me?.user_roles) return false;
  const current = normalizeDeskRoles(me.user_roles);
  const same =
    current.length === claims.roles.length && current.every((r) => claims.roles.includes(r)) &&
    String(me.school_id ?? '') === String(claims.schoolId ?? '');
  if (same) return false;
  const creds = await getDeskCredentials();
  if (!creds) return false;
  try {
    log.info('DeskApi', 'roles changed on the server — signing in again', {
      was: claims.roles,
      now: current,
    });
    await deskLogin(creds.email, creds.password);
    return true;
  } catch (e) {
    log.warn('DeskApi', 'could not refresh token after role change', String(e));
    return false;
  }
}

export function getDeskApiDebugInfo() {
  return getLocalUrlDebugInfo();
}
