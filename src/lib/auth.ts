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

/** Restore or refresh the Supabase session from secure storage. */
export async function refreshSessionIfNeeded(): Promise<Session | null> {
  let session: Session | null = null;

  const { data: live } = await supabase.auth.getSession();
  session = live.session;

  if (!session) {
    const stored = await getStoredSession();
    if (stored) {
      const { data, error } = await supabase.auth.setSession({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      });
      if (!error) session = data.session;
      else {
        log.warn('Auth', 'setSession from stored tokens failed', error.message);
        await signOut();
        return null;
      }
    }
  }

  if (!session) return null;

  if (isSessionExpired(session)) {
    log.info('Auth', 'access token expired — refreshing');
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      log.warn('Auth', 'refreshSession failed — signing out', error?.message);
      await signOut();
      return null;
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
    avatarUrl: data?.avatar_url,
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
