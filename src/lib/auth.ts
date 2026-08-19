import * as SecureStore from 'expo-secure-store';
import { cachePasswordForBiometrics, refreshBiometricCredentialsIfEnabled } from './biometricStorage';
import { log } from './logger';

const SESSION_KEY = 'tukua_session';
const PROFILE_KEY = 'tukua_profile';
const BIOMETRIC_KEY = 'tukua_biometric_enabled';

/** Nest JWT session used by native auth + WebView inject. */
export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: 'bearer';
  user: {
    id: string;
    email?: string;
    app_metadata?: { provider?: string; providers?: string[] };
    user_metadata?: Record<string, unknown>;
    aud?: string;
    created_at?: string;
  };
};

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

export async function getStoredSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as { access_token: string; refresh_token: string };
}

export function nestSessionFromProfile(
  accessToken: string,
  refreshToken: string,
  profile: UserProfile,
  expiresIn = 7 * 24 * 3600,
): Session {
  return {
    access_token: accessToken,
    refresh_token: refreshToken || accessToken,
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
  };
}

function sessionFromNestLogin(
  accessToken: string,
  refreshToken: string,
  email: string,
  user: {
    id?: string;
    email?: string | null;
    full_name?: string | null;
    account_type?: string | null;
    approval_status?: string | null;
    activation_status?: string | null;
    phone?: string | null;
  },
  metadata?: Record<string, string>,
  expiresIn = 7 * 24 * 3600,
): Session {
  const userId = String(user.id || '');
  return {
    access_token: accessToken,
    refresh_token: refreshToken || accessToken,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    token_type: 'bearer',
    user: {
      id: userId,
      email: user.email || email,
      app_metadata: { provider: 'nest', providers: ['nest'] },
      user_metadata: {
        full_name: user.full_name || metadata?.full_name,
        phone: user.phone || metadata?.phone,
        account_type: user.account_type || metadata?.account_type,
        approval_status: user.approval_status,
        activation_status: user.activation_status,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  };
}

/** Restore Nest JWT session from SecureStore + /platform/auth/me. */
export async function refreshSessionIfNeeded(): Promise<Session | null> {
  try {
    const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
    const nestTok = await resolveNestAccessTokenForWebView();
    const stored = await getStoredSession();
    const access = nestTok || stored?.access_token;
    if (!access) return null;

    const profile = (await fetchProfileFromNest(access)) || (await getCachedProfile());
    if (!profile?.id) return null;
    const session = nestSessionFromProfile(access, stored?.refresh_token || access, profile);
    await persistSession(session);
    return session;
  } catch (e) {
    log.warn('Auth', 'refreshSessionIfNeeded failed', String(e));
    return null;
  }
}

export async function restoreSession() {
  return refreshSessionIfNeeded();
}

export async function signInWithEmail(email: string, password: string) {
  log.info('Auth', 'signInWithEmail', { email });
  return signInWithNestIdentity(email, password);
}

/** Nest JWT login for native Register / PEA accounts. */
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

  const user = data.user || {};
  const session = sessionFromNestLogin(
    data.access_token,
    data.refresh_token || data.access_token,
    email,
    user,
    undefined,
    Number(data.expires_in) || 7 * 24 * 3600,
  );
  const userId = String(user.id || '');

  if (userId) {
    const profile: UserProfile = {
      id: userId,
      email: String(user.email || email),
      fullName: String(user.full_name || email),
      phone: user.phone || undefined,
      activationStatus: user.activation_status ?? null,
      approvalStatus: user.approval_status ?? null,
      accountType: user.account_type ?? null,
    };
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  }

  log.info('Auth', 'Nest identity signIn ok', { userId });
  return { user: session.user, session };
}

function mapNestProfilePayload(data: any): UserProfile | null {
  const user = data?.user || data || {};
  const profile = data?.profile || data || {};
  const id = String(user.id || profile.id || '');
  if (!id) return null;
  return {
    id,
    email: String(user.email || profile.email || ''),
    fullName: String(
      profile.full_name || user.full_name || user.email || profile.email || '',
    ),
    county: profile.county || undefined,
    phone: user.phone || user.phone_number || profile.phone_number || profile.phone || undefined,
    avatarUrl: profile.avatar_url || user.profile_image_url || undefined,
    activationStatus: profile.activation_status ?? null,
    approvalStatus: profile.approval_status ?? null,
    accountType: profile.account_type ?? null,
  };
}

export async function fetchProfileFromNest(accessToken: string): Promise<UserProfile | null> {
  try {
    const { getNestApiBaseUrl } = await import('./localHost');
    const base = getNestApiBaseUrl().replace(/\/$/, '');
    const headers = { Accept: 'application/json', Authorization: `Bearer ${accessToken}` };

    for (const path of ['/platform/auth/me', '/platform/me/profile']) {
      try {
        const res = await fetch(`${base}${path}`, { headers });
        if (!res.ok) continue;
        const json = await res.json().catch(() => null);
        const data = json?.data || json;
        const out = mapNestProfilePayload(data);
        if (out) {
          await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(out));
          return out;
        }
      } catch {
        /* try next path */
      }
    }
    return null;
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
  const { platformRegister } = await import('./platformAuthApi');
  const { persistPlatformNestSession } = await import('./platformNestAuth');
  const res = await platformRegister({
    email: email.trim(),
    password,
    full_name: metadata.full_name,
    username: metadata.username,
    account_type: metadata.account_type,
    phone: metadata.phone,
  });
  if (!res.ok) {
    throw new Error(res.message || res.error || 'Could not create account');
  }

  const data = res.data as {
    access_token?: string;
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

  if (data.access_token) {
    await persistPlatformNestSession(data.access_token, data.refresh_token, data.expires_in);
    await saveSession(data.access_token, data.refresh_token || data.access_token);
    await cachePasswordForBiometrics(password);
  }

  const user = data.user || {};
  const userId = String(user.id || '');
  const session = data.access_token
    ? sessionFromNestLogin(
        data.access_token,
        data.refresh_token || data.access_token,
        email,
        user,
        metadata,
        Number(data.expires_in) || 7 * 24 * 3600,
      )
    : null;

  if (userId && session) {
    const profile: UserProfile = {
      id: userId,
      email: String(user.email || email),
      fullName: String(user.full_name || metadata.full_name || email),
      phone: user.phone || metadata.phone || undefined,
      activationStatus: user.activation_status ?? null,
      approvalStatus: user.approval_status ?? null,
      accountType: user.account_type || metadata.account_type || null,
    };
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  }

  log.info('Auth', 'Nest identity signUp ok', { userId });
  return { user: session?.user ?? null, session };
}

export async function fetchProfileGate(userId: string) {
  try {
    const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
    const tok = await resolveNestAccessTokenForWebView();
    if (tok) {
      const p = await fetchProfileFromNest(tok);
      if (p && (!userId || p.id === userId)) {
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
  return null;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
    const tok = await resolveNestAccessTokenForWebView();
    if (tok) {
      const fromNest = await fetchProfileFromNest(tok);
      if (fromNest && (!userId || fromNest.id === userId)) return fromNest;
    }
  } catch {
    /* fall through to cached */
  }

  const cached = await getCachedProfile();
  if (cached && (!userId || cached.id === userId)) return cached;

  const stored = await getStoredSession();
  if (stored?.access_token) {
    const fromTok = await fetchProfileFromNest(stored.access_token);
    if (fromTok) return fromTok;
  }
  return null;
}

export async function getCachedProfile(): Promise<UserProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function signOut() {
  try {
    const { clearPlatformNestToken } = await import('./platformNestAuth');
    await clearPlatformNestToken();
  } catch {
    /* ignore */
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function setBiometricEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? '1' : '0');
}

export async function isBiometricEnabled() {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === '1';
}

/** Request Nest password reset (email and/or SMS) with App Links redirect. */
export async function sendPasswordReset(email?: string, phone?: string) {
  const { forgotPassword } = await import('./platformAuthApi');
  const result = await forgotPassword({
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined,
    redirect_to: 'https://tukua.ai/reset-password',
  });
  if (!result.ok) {
    throw new Error(result.message || 'Failed to send reset link');
  }
  return result;
}
