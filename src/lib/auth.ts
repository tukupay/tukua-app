import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { cachePasswordForBiometrics } from './biometricStorage';
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

export async function getStoredSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as { access_token: string; refresh_token: string };
}

export async function restoreSession() {
  const stored = await getStoredSession();
  if (!stored) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
  });
  if (error) return null;
  return data.session;
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
