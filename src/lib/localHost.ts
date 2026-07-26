/**
 * Hosted URL resolution for Expo.
 *
 * Production defaults (no local Yana):
 * - Web SPA (chat, courses, profile): https://tukua.ai
 * - Desk Nest API: set via EXPO_PUBLIC_DESK_API_URL (host-agnostic; AWS/etc. later)
 * - Desk module UI: https://tukua.ai
 *
 * Loopback rewrite only applies if an env URL still uses localhost.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_WEB = 'https://tukua.ai';
/** Nest desk API base — LAN proxy :3255 → Electron :3251 (SQLite with parent names). */
const DEFAULT_DESK_API = 'http://localhost:3255/api';
/** Desk SPA UI (modules) — production tukua.ai. */
const DEFAULT_DESK_WEB = 'https://tukua.ai';

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

/** Yana web SPA base (Chat, Register, Courses, Profile WebViews). */
export function getWebBaseUrl(): string {
  return resolveLocalUrl(process.env.EXPO_PUBLIC_WEB_URL ?? DEFAULT_WEB);
}

/** Nest desk API base (dashboard / school data). */
export function getDeskApiBaseUrl(): string {
  return resolveLocalUrl(process.env.EXPO_PUBLIC_DESK_API_URL ?? DEFAULT_DESK_API);
}

/** Desk frontend SPA (admin / parent / superadmin module pages). */
export function getDeskWebBaseUrl(): string {
  return resolveLocalUrl(process.env.EXPO_PUBLIC_DESK_WEB_URL ?? DEFAULT_DESK_WEB);
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
    webConfigured: process.env.EXPO_PUBLIC_WEB_URL ?? DEFAULT_WEB,
    webResolved: getWebBaseUrl(),
    deskConfigured: process.env.EXPO_PUBLIC_DESK_API_URL ?? DEFAULT_DESK_API,
    deskResolved: getDeskApiBaseUrl(),
    deskWebConfigured: process.env.EXPO_PUBLIC_DESK_WEB_URL ?? DEFAULT_DESK_WEB,
    deskWebResolved: getDeskWebBaseUrl(),
    devHost: getDevHostIp(),
    platform: Platform.OS,
  };
}
