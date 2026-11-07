import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  fetchProfile,
  fetchProfileFromNest,
  getCachedProfile,
  persistSession,
  refreshSessionIfNeeded,
  restoreSession,
  signOut,
  UserProfile,
  type Session,
} from '../lib/auth';
import {
  clearPlatformNestToken,
  jwtExpiry,
  onPlatformAuthRejected,
  onPlatformTokensChanged,
  resolveNestAccessTokenForWebView,
} from '../lib/platformNestAuth';
import { getSavageModeEnabled, getSavageModeForUser } from '../lib/userPreferences';
import { clearDeskSession } from '../lib/deskApi';
import { clearSelectedContext } from '../lib/selectedContext';
import { log } from '../lib/logger';

type AuthContextType = {
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  savageMode: boolean;
  refreshProfile: () => Promise<void>;
  refreshUserPreferences: () => Promise<void>;
  setSavageMode: (enabled: boolean) => void;
  ensureFreshSession: () => Promise<Session | null>;
  /** Adopt Nest identity session after PEA / Nest login. */
  adoptSession: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Gate (owner, 2026-11-07: "dont auto login"): a session restored on a cold start stays locked, so the app
   * opens on the signed-out front door. It unlocks on a sign-in (adoptSession) or on unlockSession()
   * (biometric "Continue as"). Tokens stay stored and refreshing either way; logout locks again.
   */
  sessionUnlocked: boolean;
  /** Enter the app with the stored session (after the user proved it is them, e.g. biometrics). */
  unlockSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextType>({
  profile: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  savageMode: false,
  refreshProfile: async () => {},
  refreshUserPreferences: async () => {},
  setSavageMode: () => {},
  ensureFreshSession: async () => null,
  adoptSession: async () => {},
  logout: async () => {},
  sessionUnlocked: false,
  unlockSession: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [savageMode, setSavageMode] = useState(false);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);

  const loadUserPreferences = useCallback(async (userId: string) => {
    try {
      const enabled = (await getSavageModeEnabled()) || (await getSavageModeForUser(userId));
      setSavageMode(enabled);
      log.info('Auth', 'user preferences loaded', { savageMode: enabled });
    } catch (error) {
      log.warn('Auth', 'user preferences fetch failed', String(error));
    }
  }, []);

  const refreshUserPreferences = useCallback(async () => {
    const id = session?.user?.id;
    if (!id) {
      setSavageMode(false);
      return;
    }
    await loadUserPreferences(id);
  }, [session?.user?.id, loadUserPreferences]);

  const refreshProfile = useCallback(async () => {
    try {
      if (!session?.access_token) return;
      const p =
        (await fetchProfileFromNest(session.access_token)) ||
        (session.user?.id ? await fetchProfile(session.user.id) : null);
      if (p) {
        setProfile(p);
        await loadUserPreferences(p.id);
      }
    } catch (error) {
      log.warn('Auth', 'refreshProfile error', String(error));
    }
  }, [loadUserPreferences, session]);

  const adoptSession = useCallback(
    async (next: Session) => {
      setSession(next);
      setSessionUnlocked(true);
      await persistSession(next);
      if (next.user?.id) {
        const cached = await getCachedProfile();
        if (cached?.id === next.user.id) setProfile(cached);
        const p = (await fetchProfileFromNest(next.access_token)) || (await fetchProfile(next.user.id));
        if (p) setProfile(p);
        await loadUserPreferences(next.user.id);
      }
    },
    [loadUserPreferences],
  );

  const ensureFreshSession = useCallback(async () => {
    const fresh = await refreshSessionIfNeeded();
    setSession((prev) => {
      const next = fresh ?? prev;
      if (prev?.access_token === next?.access_token && prev?.expires_at === next?.expires_at) {
        return prev;
      }
      return next ?? null;
    });
    if (!fresh) {
      setProfile(null);
    }
    return fresh;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        log.info('Auth', 'restoring session…');
        const active = await restoreSession();
        setSession(active);
        if (active?.user) {
          log.info('Auth', 'session restored', { email: active.user.email });
          const cached = await getCachedProfile();
          setProfile(cached);
          const p =
            (await fetchProfileFromNest(active.access_token)) ||
            (await fetchProfile(active.user.id));
          if (p) setProfile(p);
          void loadUserPreferences(active.user.id);
        } else {
          log.info('Auth', 'no session on boot');
          setSavageMode(false);
        }
      } catch (error) {
        log.error('Auth', 'restore failed', String(error));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadUserPreferences]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      void (async () => {
        log.info('Auth', 'app foreground — refreshing session');
        const fresh = await refreshSessionIfNeeded();
        setSession((prev) => {
          const next = fresh ?? prev;
          if (prev?.access_token === next?.access_token && prev?.expires_at === next?.expires_at) {
            return prev;
          }
          return next ?? null;
        });
        if (!fresh) {
          setProfile(null);
          setSavageMode(false);
        } else if (fresh.user?.id) {
          void loadUserPreferences(fresh.user.id);
        }
      })();
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [loadUserPreferences]);

  const logout = useCallback(async () => {
    log.info('Auth', 'sign out');
    const userId = session?.user?.id;
    if (userId) {
      await clearSelectedContext(userId);
    }
    await clearDeskSession();
    await clearPlatformNestToken().catch(() => {});
    await signOut();
    setSession(null);
    setSessionUnlocked(false);
    setProfile(null);
    setSavageMode(false);
  }, [session?.user?.id]);

  const unlockSession = useCallback(async () => {
    // Refresh first when the access token is near expiry; keep the stored one on a network error.
    let fresh: Session | null = null;
    try {
      fresh = await refreshSessionIfNeeded();
    } catch (error) {
      log.warn('Auth', 'unlock refresh failed', String(error));
    }
    const next = fresh ?? sessionRef.current;
    if (!next?.user) {
      log.warn('Auth', 'unlock: no stored session');
      return null;
    }
    setSession((prev) =>
      prev?.access_token === next.access_token && prev?.expires_at === next.expires_at ? prev : next,
    );
    setSessionUnlocked(true);
    log.info('Auth', 'stored session unlocked', { email: next.user.email });
    return next;
  }, []);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // A refreshed access token (proactive, foreground, or after a 401) replaces the one in the
  // session, so every WebView (chat, courses) gets it through its session re-sync.
  useEffect(() => {
    return onPlatformTokensChanged(({ accessToken, refreshToken }) => {
      setSession((prev) => {
        if (!prev || prev.access_token === accessToken) return prev;
        const exp = jwtExpiry(accessToken);
        const next: Session = {
          ...prev,
          access_token: accessToken,
          refresh_token: refreshToken || prev.refresh_token,
          ...(exp ? { expires_at: exp, expires_in: Math.max(0, exp - Math.floor(Date.now() / 1000)) } : {}),
        };
        void persistSession(next);
        return next;
      });
    });
  }, []);

  // Sign out only when the server rejected the refresh token (never on network errors / 5xx).
  useEffect(() => {
    return onPlatformAuthRejected(() => {
      log.warn('Auth', 'refresh token rejected — signing out');
      void logoutRef.current();
    });
  }, []);

  // While signed in and in the foreground, check now and then; refreshes a day before expiry.
  useEffect(() => {
    if (!session?.user?.id) return;
    const id = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      void resolveNestAccessTokenForWebView().catch(() => null);
    }, 15 * 60_000);
    return () => clearInterval(id);
  }, [session?.user?.id]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        session,
        loading,
        isAuthenticated: !!session,
        savageMode,
        refreshProfile,
        refreshUserPreferences,
        setSavageMode,
        ensureFreshSession,
        adoptSession,
        logout,
        sessionUnlocked,
        unlockSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
