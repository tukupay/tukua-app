/**
 * Hosted URL resolution for Expo.
 *
 * Mobile ERP + chat always hit **Railway Nest → Supabase** (staging/production).
 * Desk Electron (`:3251` / proxy `:3255`) is offline sync for the Desk app only —
 * phones never call it by default.
 *
 * Loopback rewrite only applies if an env URL still uses localhost (local Vite web).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Nest-aware web shell (hosted Amplify). Mobile WebView inject targets this host. */
const DEFAULT_WEB = 'https://v2.tukua.ai';

/** Desk SPA UI (modules) — Desk Vite (:3250) or hosted Desk build, not Amplify marketing. */
const STAGING_DESK_WEB = 'https://desk-staging.tukua.ai';

/** Host of the machine running Metro, e.g. 192.168.100.3 */
export function getDevHostIp(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2
      ?.extra?.expoGo?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    const host = String(c).split(':')[0]?.trim();
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }

  return null;
}

/** Rewrite loopback host so a physical device reaches the PC (only if env still uses localhost). */
export function resolveLocalUrl(url: string): string {
  const raw = url.replace(/\/$/, '');
  if (!/:\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(raw)) {
    return raw;
  }

  const lan = getDevHostIp();
  if (lan) {
    return raw.replace(/localhost|127\.0\.0\.1/i, lan);
  }

  if (Platform.OS === 'android') {
    return raw.replace(/localhost|127\.0\.0\.1/i, '10.0.2.2');
  }

  return raw;
}

/**
 * One switch for every host. `EXPO_PUBLIC_TUKUA_ENV` picks the profile so web,
 * Desk UI and the API can never straddle two environments; individual
 * `EXPO_PUBLIC_*` vars still win when set (escape hatch for one-off testing).
 */
export type TukuaEnv = 'local' | 'staging' | 'production';

const STAGING_API = 'https://tukua-api-staging-production.up.railway.app/api';
const PRODUCTION_API = 'https://tukua.up.railway.app/api';

type EnvProfile = { web: string; deskWeb: string | null; nestApi: string; deskApi: string };

const ENV_PROFILES: Record<TukuaEnv, EnvProfile> = {
  // Local = local Vite chat shell only. Nest ERP + Brain = staging Railway (same DB).
  // Desk Electron sync is for Desk app; do not point phones at :3251/:3255.
  local: {
    web: 'http://localhost:8080',
    deskWeb: 'http://localhost:3250',
    nestApi: STAGING_API,
    deskApi: STAGING_API,
  },
  // Desk SPA is NOT tukua.ai — set EXPO_PUBLIC_DESK_WEB_URL when a hosted Desk build exists.
  // Web shell for inject = v2.tukua.ai (Nest SPA). Native ERP = staging Railway (not local).
  staging: { web: DEFAULT_WEB, deskWeb: null, nestApi: STAGING_API, deskApi: STAGING_API },
  // Phone “production” builds for this product still use staging Nest + v2 until live flip.
  production: { web: DEFAULT_WEB, deskWeb: null, nestApi: STAGING_API, deskApi: STAGING_API },
};

export function getTukuaEnv(): TukuaEnv {
  const raw = String(process.env.EXPO_PUBLIC_TUKUA_ENV ?? '').trim().toLowerCase();
  if (raw === 'local' || raw === 'staging' || raw === 'production') return raw;
  return 'staging';
}

function profile(): EnvProfile {
  return ENV_PROFILES[getTukuaEnv()];
}

/** Yana web SPA base (Chat, Register, Courses, Profile WebViews). */
export function getWebBaseUrl(): string {
  return resolveLocalUrl(process.env.EXPO_PUBLIC_WEB_URL || profile().web);
}

/**
 * Nest REST for chat / courses / platform (WebView inject) and mobile ERP.
 * Always Supabase-backed Nest (staging/production) unless overridden.
 */
export function getNestApiBaseUrl(): string {
  return resolveLocalUrl(process.env.EXPO_PUBLIC_NEST_API_URL || profile().nestApi);
}

/**
 * School ERP Nest for native screens (`/parents/me/*`, teacher, security, …).
 * Same host as {@link getNestApiBaseUrl} — Brain tools and dashboards share one DB.
 * Escape hatch: EXPO_PUBLIC_DESK_API_URL (e.g. force Desk LAN when debugging sync).
 */
export function getDeskApiBaseUrl(): string {
  const explicit = String(process.env.EXPO_PUBLIC_DESK_API_URL ?? '').trim();
  if (explicit) return resolveLocalUrl(explicit);
  return getNestApiBaseUrl();
}

function resolveDevDeskWebFallback(): string | null {
  if (!__DEV__) return null;
  const lan = getDevHostIp();
  if (lan) return resolveLocalUrl(`http://${lan}:3250`);
  return resolveLocalUrl('http://localhost:3250');
}

function configuredDeskWebRaw(): string | null {
  const explicit = String(process.env.EXPO_PUBLIC_DESK_WEB_URL ?? '').trim();
  if (explicit) return explicit;
  const fromProfile = profile().deskWeb;
  if (fromProfile) return fromProfile;
  // Documented optional staging Desk host when deployed (override via env).
  if (getTukuaEnv() === 'staging' && String(process.env.EXPO_PUBLIC_DESK_WEB_STAGING ?? '').trim()) {
    return String(process.env.EXPO_PUBLIC_DESK_WEB_STAGING).trim();
  }
  return resolveDevDeskWebFallback();
}

/**
 * Desk frontend SPA base for WebView modules (admin / teacher / accounts pages).
 * Returns null when unset — callers should use native Nest screens instead of tukua.ai.
 */
export function getDeskWebBaseUrlOrNull(): string | null {
  const raw = configuredDeskWebRaw();
  if (!raw) return null;
  const resolved = resolveLocalUrl(raw);
  // Never silently route Desk ERP paths to Amplify marketing SPA.
  try {
    const host = new URL(resolved).hostname.toLowerCase();
    if (host === 'tukua.ai' || host === 'www.tukua.ai' || host === 'v2.tukua.ai') return null;
  } catch {
    return null;
  }
  return resolved;
}

/** Desk frontend SPA — throws only when callers require a URL; prefer getDeskWebBaseUrlOrNull(). */
export function getDeskWebBaseUrl(): string {
  return getDeskWebBaseUrlOrNull() ?? '';
}

/** True when Desk module WebViews can load (explicit Desk SPA URL or dev LAN :3250). */
export function isDeskWebModuleAvailable(): boolean {
  return getDeskWebBaseUrlOrNull() != null;
}

/** True if URL belongs to our configured web SPA (production or local). */
export function isAppWebHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h.includes('tukua.ai')) return true;
  try {
    const webHost = new URL(getWebBaseUrl()).hostname.toLowerCase();
    if (h === webHost) return true;
  } catch {
    // ignore
  }
  if (h === 'localhost' || h === '127.0.0.1' || h === '10.0.2.2') return true;
  if (/^192\.168\.\d+\.\d+$/.test(h) || /^10\.\d+\.\d+\.\d+$/.test(h)) return true;
  return false;
}

export function getLocalUrlDebugInfo() {
  return {
    env: getTukuaEnv(),
    webConfigured: process.env.EXPO_PUBLIC_WEB_URL || profile().web,
    webResolved: getWebBaseUrl(),
    nestConfigured: process.env.EXPO_PUBLIC_NEST_API_URL || profile().nestApi,
    nestResolved: getNestApiBaseUrl(),
    deskConfigured: process.env.EXPO_PUBLIC_DESK_API_URL || '(same as nest)',
    deskResolved: getDeskApiBaseUrl(),
    deskWebConfigured: process.env.EXPO_PUBLIC_DESK_WEB_URL || profile().deskWeb,
    deskWebResolved: getDeskWebBaseUrlOrNull(),
    deskWebAvailable: isDeskWebModuleAvailable(),
    stagingDeskWebHint: STAGING_DESK_WEB,
    devHost: getDevHostIp(),
    platform: Platform.OS,
  };
}

const DESK_ERP_PATH_PREFIXES = [
  '/teacher',
  '/student',
  '/admin',
  '/accounts',
  '/assessment',
  '/discipline',
  '/calendar',
  '/bulksms',
  '/transport',
  '/elearning',
];

/** True when a path belongs to Desk ERP SPA (not Amplify marketing routes). */
export function isDeskErpPath(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  const lower = p.toLowerCase();
  return DESK_ERP_PATH_PREFIXES.some(
    (prefix) =>
      lower === prefix ||
      lower.startsWith(`${prefix}/`) ||
      lower.startsWith(`${prefix}?`),
  );
}

/** True when Desk WebView base is missing or points at tukua.ai (empty module pages). */
export function isDeskWebLikelyWrongHost(base: string): boolean {
  const trimmed = base.trim();
  if (!trimmed) return true;
  try {
    const url = trimmed.startsWith('http') ? trimmed : `http://${trimmed}`;
    const host = new URL(url).hostname.toLowerCase();
    return host === 'tukua.ai' || host === 'www.tukua.ai';
  } catch {
    return true;
  }
}
