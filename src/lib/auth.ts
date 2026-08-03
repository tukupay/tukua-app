import * as SecureStore from 'expo-secure-store';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { cachePasswordForBiometrics, refreshBiometricCredentialsIfEnabled } from './biometricStorage';
import { log } from './logger';

const SESSION_KEY = 'tukua_session';
const PROFILE_KEY = 'tukua_profile';
const BIOMETRIC_KEY = 'tukua_biometric_enabled';

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  county?: string;
  phone?: string;
  avatarUrl?: string;
  activationStatus?: string | null;
  approvalStatus?: string | null;
  accountType?: string | null;
};

export async function saveSession(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  );
}

export async function persistSession(session: Session | null) {
  if (!session?.access_token || !session.refresh_token) return;
  await saveSession(session.access_token, session.refresh_token);
}

function isSessionExpired(session: Session, skewSeconds = 90): boolean {
  const expiresAt = session.expires_at;
  if (!expiresAt) return false;
  return expiresAt <= Math.floor(Date.now() / 1000) + skewSeconds;
}

function isBenignNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('failed to fetch') ||
    m.includes('network') ||
    m.includes('offline') ||
    m.includes('load failed') ||
    m.includes('timeout') ||
    m.includes('network request failed')
  );
}

function isConfirmedInvalidJwt(message: string): boolean {
  const m = message.toLowerCase();
  if (isBenignNetworkError(message)) return false;
  return (
    m.includes('invalid') ||
    m.includes('expired') ||
    m.includes('jwt') ||
    m.includes('refresh_token') ||
    m.includes('session not found') ||
    m.includes('token is expired')
  );
}

/** Restore Nest or Supabase session from secure storage. */
export async function refreshSessionIfNeeded(): Promise<Session | null> {
  let session: Session | null = null;

  const { data: live } = await supabase.auth.getSession();
  session = live.session;

  if (!session) {
    const stored = await getStoredSession();
    if (stored) {
      // Nest JWTs are not GoTrue — detect and rebuild synthetic session from Nest me/refresh.
      try {
        const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
        const nestTok = await resolveNestAccessTokenForWebView();
        if (nestTok) {
          const profile = await fetchProfileFromNest(nestTok);
          if (profile) {
            const expiresIn = 7 * 24 * 3600;
            session = {
              access_token: nestTok,
              refresh_token: stored.refresh_token || nestTok,
              expires_in: expiresIn,
              expires_at: Math.floor(Date.now() / 1000) + expiresIn,
              token_type: 'bearer',
              user: {
                id: profile.id,
                email: profile.email,
                app_metadata: { provider: 'nest', providers: ['nest'] },
                user_metadata: {
                  full_name: profile.fullName,
                  phone: profile.phone,
                  account_type: profile.accountType,
                  approval_status: profile.approvalStatus,
                  activation_status: profile.activationStatus,
                },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              },
            } as Session;
            await persistSession(session);
            return session;
          }
        }
      } catch {
        /* fall through to GoTrue setSession */
      }
      const { data, error } = await supabase.auth.setSession({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      });
      if (!error) session = data.session;
      else {
        log.warn('Auth', 'setSession from stored tokens failed', error.message);
        if (isConfirmedInvalidJwt(error.message)) {
          await signOut();
          return null;
        }
        return null;
      }
    }
  }

  if (!session) return null;

  if (isSessionExpired(session)) {
    log.info('Auth', 'access token expired — refreshing');
    if (session.user?.app_metadata?.provider === 'nest') {
      try {
        const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
        const nestTok = await resolveNestAccessTokenForWebView();
        if (nestTok) {
          session = { ...session, access_token: nestTok };
          await persistSession(session);
          return session;
        }
      } catch {
        /* fall through */
      }
    }
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      const msg = error?.message ?? 'refresh failed';
      log.warn('Auth', 'refreshSession failed', msg);
      if (error && isConfirmedInvalidJwt(msg)) {
        await signOut();
        return null;
      }
      return session;
    }
    session = data.session;
  }

  if (session) await persistSession(session);
  return session;
}

export async function getStoredSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as { access_token: string; refresh_token: string };
}

export async function restoreSession() {
  return refreshSessionIfNeeded();
}

export async function signInWithEmail(email: string, password: string) {
  log.info('Auth', 'signInWithEmail', { email });
  // Nest identity first (PEA / platform register users have no GoTrue row).
  try {
    const nest = await signInWithNestIdentity(email, password);
    if (nest.session) return nest;
  } catch (e: any) {
    log.warn('Auth', 'Nest identity login failed — trying Supabase', e?.message || String(e));
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    log.error('Auth', 'signIn failed', error.message);
    throw error;
  }
  if (data.session) {
    await saveSession(data.session.access_token, data.session.refresh_token);
    await cachePasswordForBiometrics(password);
    await refreshBiometricCredentialsIfEnabled(email, password);
    log.info('Auth', 'signIn ok', { userId: data.user?.id });
  }
  return data;
}

/** Nest JWT login for native Register / PEA accounts (primary). */
export async function signInWithNestIdentity(email: string, password: string) {
  const { platformLogin } = await import('./platformAuthApi');
  const { persistPlatformNestSession } = await import('./platformNestAuth');
  const res = await platformLogin(email.trim(), password);
  if (!res.ok || !res.data?.access_token) {
    throw new Error(res.message || res.error || 'Could not sign in');
  }
  const data = res.data as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    user?: {
      id?: string;
      email?: string | null;
      full_name?: string | null;
      account_type?: string | null;
      approval_status?: string | null;
      activation_status?: string | null;
      phone?: string | null;
    };
  };
  await persistPlatformNestSession(data.access_token, data.refresh_token, data.expires_in);
  await saveSession(data.access_token, data.refresh_token || data.access_token);
  await cachePasswordForBiometrics(password);
  await refreshBiometricCredentialsIfEnabled(email, password);

  const userId = String(data.user?.id || '');
  const expiresIn = Number(data.expires_in) || 7 * 24 * 3600;
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || data.access_token,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: 'bearer',
    user: {
      id: userId,
      email: data.user?.email || email,
      app_metadata: { provider: 'nest', providers: ['nest'] },
      user_metadata: {
        full_name: data.user?.full_name,
        phone: data.user?.phone,
        account_type: data.user?.account_type,
        approval_status: data.user?.approval_status,
        activation_status: data.user?.activation_status,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  } as Session;

  if (userId) {
    const profile: UserProfile = {
      id: userId,
      email: String(data.user?.email || email),
      fullName: String(data.user?.full_name || email),
      phone: data.user?.phone || undefined,
      activationStatus: data.user?.activation_status ?? null,
      approvalStatus: data.user?.approval_status ?? null,
      accountType: data.user?.account_type ?? null,
    };
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  }

  // Soft-attempt GoTrue for legacy WebViews — ignore failures for Nest-only users.
  try {
    await supabase.auth.signInWithPassword({ email: email.trim(), password });
  } catch {
    /* nest-only account */
  }

  log.info('Auth', 'Nest identity signIn ok', { userId });
  return { user: session.user, session };
}

export async function fetchProfileFromNest(accessToken: string): Promise<UserProfile | null> {
  try {
    const { getNestApiBaseUrl } = await import('./localHost');
    const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}/platform/auth/me`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json().catch(() => null);
    const data = json?.data || json;
    const user = data?.user || {};
    const profile = data?.profile || {};
    const id = String(user.id || '');
    if (!id) return null;
    const out: UserProfile = {
      id,
      email: String(user.email || ''),
      fullName: String(profile.full_name || user.full_name || user.email || ''),
      county: profile.county,
      phone: user.phone || user.phone_number || profile.phone_number,
      avatarUrl: profile.avatar_url || user.profile_image_url,
      activationStatus: profile.activation_status ?? null,
      approvalStatus: profile.approval_status ?? null,
      accountType: profile.account_type ?? null,
    };
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(out));
    return out;
  } catch {
    return null;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: Record<string, string>,
) {
  log.info('Auth', 'signUpWithEmail', { email, accountType: metadata.account_type });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) {
    log.error('Auth', 'signUp failed', error.message);
    throw error;
  }
  if (data.session) {
    await saveSession(data.session.access_token, data.session.refresh_token);
    await cachePasswordForBiometrics(password);
  }
  return data;
}

export async function fetchProfileGate(userId: string) {
  try {
    const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
    const tok = await resolveNestAccessTokenForWebView();
    if (tok) {
      const p = await fetchProfileFromNest(tok);
      if (p && p.id === userId) {
        return {
          activation_status: p.activationStatus,
          approval_status: p.approvalStatus,
          account_type: p.accountType,
        };
      }
    }
  } catch {
    /* fall through */
  }
  const { data } = await supabase
    .from('profiles')
    .select('activation_status, approval_status, account_type')
    .eq('id', userId)
    .maybeSingle();
  return data as {
    activation_status?: string | null;
    approval_status?: string | null;
    account_type?: string | null;
  } | null;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;

  const profile: UserProfile = {
    id: userId,
    email: user.email ?? '',
    fullName: data?.full_name ?? user.user_metadata?.full_name ?? user.email ?? '',
    county: data?.county ?? user.user_metadata?.county,
    phone: data?.phone ?? user.user_metadata?.phone,
    avatarUrl: data?.avatar_url?.trim() || user.user_metadata?.avatar_url || undefined,
    activationStatus: data?.activation_status ?? null,
    approvalStatus: data?.approval_status ?? null,
    accountType: data?.account_type ?? null,
  };
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function getCachedProfile(): Promise<UserProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function signOut() {
  await supabase.auth.signOut();
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(PROFILE_KEY);
  // Keep biometric credentials so fingerprint login works after sign out.
}

export async function setBiometricEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? '1' : '0');
}

export async function isBiometricEnabled() {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === '1';
}

export async function sendPasswordReset(email: string) {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-password-reset`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Failed to send reset email');
}
