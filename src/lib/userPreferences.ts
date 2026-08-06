import { log } from './logger';
import { getNestApiBaseUrl } from './localHost';
import { resolveNestAccessTokenForWebView } from './platformNestAuth';

type UserPreferences = Record<string, unknown> & {
  sarcasm_mode?: boolean;
  preferred_model?: string;
};

async function nestSavageToggle(): Promise<boolean | null> {
  const token = await resolveNestAccessTokenForWebView();
  if (!token) return null;
  const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}/platform/preferences/savage/toggle`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: '{}',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    log.warn('Preferences', 'nest savage failed', res.status, json?.message);
    return null;
  }
  const data = json?.data ?? json;
  return Boolean(data?.sarcasm_mode ?? data?.enabled);
}

async function getCurrentPreferencesViaNest(): Promise<UserPreferences | null> {
  try {
    const token = await resolveNestAccessTokenForWebView();
    if (!token) return null;
    const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}/platform/preferences`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      log.warn('Preferences', 'nest fetch failed', res.status, json?.message);
      return null;
    }
    const data = (json?.data ?? json) as UserPreferences | null;
    return data || {};
  } catch (e) {
    log.warn('Preferences', 'nest fetch error', String(e));
    return null;
  }
}

async function getCurrentPreferences(_userId?: string): Promise<UserPreferences> {
  const viaNest = await getCurrentPreferencesViaNest();
  return viaNest || {};
}

/** Toggle savage/sarcasm via Nest only (no PostgREST / GoTrue fallback). */
export async function toggleSavageMode(): Promise<boolean | null> {
  try {
    const viaNest = await nestSavageToggle();
    if (viaNest !== null) {
      log.info('Preferences', 'savage mode (nest)', { enabled: viaNest });
      return viaNest;
    }
  } catch (e) {
    log.warn('Preferences', 'nest savage error', String(e));
  }
  return null;
}

export async function getSavageModeEnabled(): Promise<boolean> {
  try {
    const token = await resolveNestAccessTokenForWebView();
    if (token) {
      const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}/platform/preferences`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        const data = json?.data ?? json;
        return Boolean(data?.sarcasm_mode);
      }
    }
  } catch {
    /* fall through */
  }
  return false;
}

export async function getSavageModeForUser(userId: string): Promise<boolean> {
  const prefs = await getCurrentPreferences(userId);
  return !!prefs.sarcasm_mode;
}
