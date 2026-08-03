/**
 * Nest platform identity JWT for WebView SPA (chat/courses).
 * Prefer POST /platform/auth/login on the Nest api-host — not GoTrue.
 */
import * as SecureStore from 'expo-secure-store';
import { getDeskCredentials, getDeskToken, hasNestDeskToken } from './deskApi';
import { getNestApiBaseUrl } from './localHost';
import { log } from './logger';

const ACCESS_KEY = 'tukua_platform_nest_access';
const REFRESH_KEY = 'tukua_platform_nest_refresh';
const EXPIRES_KEY = 'tukua_platform_nest_expires_at';

type LoginPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function nestBase(): string {
  return getNestApiBaseUrl().replace(/\/$/, '');
}

async function readStoredAccess(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_KEY);
    const expRaw = await SecureStore.getItemAsync(EXPIRES_KEY);
    if (!token) return null;
    const exp = expRaw ? Number(expRaw) : 0;
    if (exp && exp < Math.floor(Date.now() / 1000) + 60) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

async function persistTokens(access: string, refresh?: string, expiresIn = 7 * 24 * 3600) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  await SecureStore.setItemAsync(
    EXPIRES_KEY,
    String(Math.floor(Date.now() / 1000) + (Number(expiresIn) || 7 * 24 * 3600)),
  );
}

/** Persist Nest identity JWT after PEA / login (SecureStore). */
export async function persistPlatformNestSession(
  access: string,
  refresh?: string,
  expiresIn?: number,
) {
  await persistTokens(access, refresh, expiresIn);
}

export async function clearPlatformNestToken() {
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    log.warn('PlatformNest', 'login failed', res.status, json?.message || json?.error);
    return null;
  }
  const data = await unwrapData<LoginPayload>(json);
  if (!data?.access_token) return null;
  await persistTokens(data.access_token, data.refresh_token, data.expires_in);
  log.info('PlatformNest', 'identity login ok');
  return data.access_token;
}

async function refreshAccess(): Promise<string | null> {
  try {
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refresh) return null;
    const url = `${nestBase()}/platform/auth/refresh`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return null;
    const data = await unwrapData<LoginPayload>(json);
    if (!data?.access_token) return null;
    await persistTokens(data.access_token, data.refresh_token ?? refresh, data.expires_in);
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Nest JWT for SPA `tukua_nest_access_token`.
 * Order: stored platform identity → refresh → password login → Desk Nest JWT.
 */
export async function resolveNestAccessTokenForWebView(): Promise<string | null> {
  const cached = await readStoredAccess();
  if (cached) return cached;

  const refreshed = await refreshAccess();
  if (refreshed) return refreshed;

  const creds = await getDeskCredentials();
  if (creds?.email && creds.password) {
    const fromLogin = await loginWithPassword(creds.email, creds.password);
    if (fromLogin) return fromLogin;
  }

  if (await hasNestDeskToken()) {
    const desk = await getDeskToken();
    if (desk) {
      log.info('PlatformNest', 'using Desk Nest JWT for WebView');
      return desk;
    }
  }

  return null;
}
