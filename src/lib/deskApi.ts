/**
 * NestJS desk API client (yana/desktop packages/api).
 * Base URL from EXPO_PUBLIC_DESK_API_URL (unified via localHost).
 */

import * as SecureStore from 'expo-secure-store';
import { getDeskApiBaseUrl, getLocalUrlDebugInfo } from './localHost';
import { log } from './logger';

const DESK_TOKEN_KEY = 'tukua_desk_auth_token';
const DESK_USER_KEY = 'tukua_desk_user';
/** 'nest' = password login JWT (required for /parents/me/*). 'supabase' = soft-adopt. */
const DESK_TOKEN_SOURCE_KEY = 'tukua_desk_token_source';
/** Email+password for Nest soft-reconnect after app restart (SecureStore). */
const DESK_CREDS_KEY = 'tukua_desk_login_creds';

type DeskTokenSource = 'nest' | 'supabase';

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
};

export type DeskLoginResult = {
  token: string;
  user: DeskUser;
  supabase_access_token?: string;
  supabase_refresh_token?: string;
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

export async function getDeskTokenSource(): Promise<DeskTokenSource | null> {
  if (memoryTokenSource) return memoryTokenSource;
  try {
    const raw = await SecureStore.getItemAsync(DESK_TOKEN_SOURCE_KEY);
    if (raw === 'nest' || raw === 'supabase') {
      memoryTokenSource = raw;
      return raw;
    }
  } catch {
    // ignore
  }
  return null;
}

/** True when Desk Bearer came from Nest password login (not soft-adopted Supabase JWT). */
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
 * Soft-adopted Supabase tokens get 401 on /parents/me/* — reconnect with stored password.
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
  try {
    log.info('DeskApi', 'soft reconnect nest with stored credentials', { email: creds.email });
    await deskLogin(creds.email, creds.password);
    return true;
  } catch (e) {
    log.warn('DeskApi', 'soft reconnect nest failed', String(e));
    return false;
  }
}

/** Await an in-flight Nest password login started elsewhere (e.g. connectDesk). */
export async function awaitDeskLoginInFlight(): Promise<DeskLoginResult | null> {
  if (!deskLoginInFlight) return null;
  try {
    return await deskLoginInFlight;
  } catch {
    return null;
  }
}

/**
 * Desk Nest shares the same Supabase project — adopt the Supabase access token
 * as the desk Bearer so Dashboard modules work without a separate Nest password login.
 * Never overwrite a Nest password JWT (Supabase JWT gets 401 on /parents/me/*).
 */
export async function adoptSupabaseTokenAsDeskSession(
  accessToken: string,
  user: DeskUser,
): Promise<void> {
  if (!accessToken) return;
  if (await hasNestDeskToken()) {
    log.info('DeskApi', 'kept nest desk token (skip supabase adopt)', {
      email: user.email,
      schoolId: user.school_id,
    });
    return;
  }
  await persistDeskSession(accessToken, user, 'supabase');
  log.info('DeskApi', 'adopted supabase access token as desk session', {
    email: user.email,
    roles: user.user_roles,
    schoolId: user.school_id,
  });
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

export async function deskFetch<T = unknown>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    token?: string | null;
    /** Internal: already tried Nest soft-reconnect after 401. */
    _retriedNest?: boolean;
  } = {},
): Promise<T> {
  const base = getDeskApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = opts.token === undefined ? await getDeskToken() : opts.token;
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
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (error) {
    const hosted = /^https:\/\//i.test(url);
    const hint = hosted
      ? `Cannot reach ${url}. Check network / VPN, or Railway API status (GET /api/health).`
      : `Cannot reach ${url}. Desk Electron must listen on LAN :3251 (not 127.0.0.1-only). Restart Desk after API_HOST=0.0.0.0.`;
    log.warn('DeskApi', 'network error', String(error));
    throw new Error(hint);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const isLogin = path.includes('/auth/login');
    // Soft-adopted Supabase JWT → 401 on /parents/*; reconnect Nest once if we have password.
    if (
      res.status === 401 &&
      !isLogin &&
      !opts._retriedNest &&
      opts.token === undefined &&
      !(await hasNestDeskToken())
    ) {
      const reconnected = await ensureNestDeskSession();
      if (reconnected) {
        return deskFetch<T>(path, { ...opts, _retriedNest: true });
      }
    }
    const errCode =
      typeof (json as { error?: unknown })?.error === 'string'
        ? String((json as { error: string }).error).trim()
        : typeof (json as { code?: unknown })?.code === 'string'
          ? String((json as { code: string }).code).trim()
          : '';
    const baseMsg =
      res.status === 401
        ? 'Session expired. Please login to continue'
        : (json as { message?: string; error?: string })?.message ||
          (json as { error?: string })?.error ||
          `Desk API ${res.status}`;
    const msg =
      errCode && errCode !== baseMsg && !String(baseMsg).includes(errCode)
        ? `${baseMsg} (${errCode})`
        : String(baseMsg);
    log.warn('DeskApi', msg, { status: res.status, path, error: errCode || undefined });
    throw Object.assign(new Error(msg), { code: errCode || undefined, statusCode: res.status });
  }

  if (json && typeof json === 'object' && 'success' in json && (json as { success: boolean }).success === false) {
    const msg = (json as { message?: string }).message || 'Desk request failed';
    throw new Error(msg);
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
      supabase_access_token?: string;
      supabase_refresh_token?: string;
      loginType?: 'offline' | 'online';
    }>('/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
      token: null,
    });

    const token = data.token || data.access_token || '';
    const user = data.user ?? (data as unknown as DeskUser);

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
      hasSupabaseTokens: Boolean(data.supabase_access_token),
      tokenSource: 'nest',
    });

    return {
      token,
      user: deskUser,
      supabase_access_token: data.supabase_access_token,
      supabase_refresh_token: data.supabase_refresh_token,
      loginType: data.loginType,
    };
  })();

  try {
    return await deskLoginInFlight;
  } finally {
    deskLoginInFlight = null;
  }
}

export async function deskFetchMe(): Promise<DeskUser | null> {
  try {
    // Desk Electron can hang validating a Supabase JWT — never block UI on this.
    const user = await Promise.race([
      deskFetch<DeskUser>('/auth/me'),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 2500);
      }),
    ]);
    if (user) {
      memoryUser = user;
      await SecureStore.setItemAsync(DESK_USER_KEY, JSON.stringify(user));
    }
    return user;
  } catch (error) {
    const msg = String(error);
    log.warn('DeskApi', 'auth/me failed', msg);
    // Do NOT clear adopted Supabase tokens — hosted Nest may reject them while Chat still works.
    return null;
  }
}

export function getDeskApiDebugInfo() {
  return getLocalUrlDebugInfo();
}
