import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { getNestApiBaseUrl } from './localHost';

/**
 * Asks the API whether this installed version may still run (GET /api/public/app-version, set by Tukua in
 * app_settings 'app_version_policy'). When Tukua moves everyone to a new version, older apps get
 * update_required and stop at the Update screen. Fail-open: offline, slow or any error = keep running.
 */
export type AppVersionCheck = {
  update_required: boolean;
  update_available: boolean;
  min_version: string | null;
  latest_version: string | null;
  store_url: string | null;
  message: string | null;
};

/** This install's version and store build number (Android versionCode / iOS build). */
export function installedVersion(): { version: string | null; build: string | null } {
  return {
    version: Application.nativeApplicationVersion ?? null,
    build: Application.nativeBuildVersion ?? null,
  };
}

export const STORE_URL_FALLBACK =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/search?term=tukua'
    : 'https://play.google.com/store/apps/details?id=com.app.tukua';

export async function checkAppVersion(timeoutMs = 6000): Promise<AppVersionCheck | null> {
  if (Platform.OS === 'web') return null;
  const { version, build } = installedVersion();
  if (!version) return null;
  const base = getNestApiBaseUrl().replace(/\/$/, '');
  const q = new URLSearchParams({ app: 'tukua-mobile', platform: Platform.OS, version, ...(build ? { build } : {}) });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/public/app-version?${q.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const data = (json?.data ?? json) as Partial<AppVersionCheck> | null;
    if (!data || typeof data.update_required !== 'boolean') return null;
    return {
      update_required: data.update_required,
      update_available: Boolean(data.update_available),
      min_version: data.min_version ?? null,
      latest_version: data.latest_version ?? null,
      store_url: data.store_url ?? null,
      message: data.message ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
