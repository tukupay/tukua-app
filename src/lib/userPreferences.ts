import { supabase } from './supabase';
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

async function getCurrentPreferences(userId: string): Promise<UserPreferences> {
  const viaNest = await getCurrentPreferencesViaNest();
  if (viaNest) return viaNest;

  // Legacy GoTrue + PostgREST fallback only (Nest-only sessions have no auth.uid()).
  const { data, error } = await supabase
    .from('users')
    .select('user_preferences')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    log.warn('Preferences', 'fetch failed', error.message);
  }

  return (data?.user_preferences as UserPreferences) || {};
}

/** Toggle savage/sarcasm — Nest first, Supabase fallback. */
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const current = await getCurrentPreferences(user.id);
  const next = !current.sarcasm_mode;

  const { error } = await supabase
    .from('users')
    .update({ user_preferences: { ...current, sarcasm_mode: next } })
    .eq('id', user.id);

  if (error) {
    log.warn('Preferences', 'savage toggle failed', error.message);
    throw error;
  }

  log.info('Preferences', 'savage mode', { enabled: next });
  return next;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return getSavageModeForUser(user.id);
}

export async function getSavageModeForUser(userId: string): Promise<boolean> {
  const prefs = await getCurrentPreferences(userId);
  return !!prefs.sarcasm_mode;
}
