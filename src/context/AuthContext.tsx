import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  fetchProfile,
  fetchProfileFromNest,
  getCachedProfile,
  persistSession,
  refreshSessionIfNeeded,
  restoreSession,
  signOut,
  UserProfile,
} from '../lib/auth';
import { clearPlatformNestToken } from '../lib/platformNestAuth';
import { getSavageModeForUser } from '../lib/userPreferences';
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
  /** Adopt Nest identity session after PEA / Nest login (no GoTrue required). */
  adoptSession: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
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
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [savageMode, setSavageMode] = useState(false);

  const loadUserPreferences = useCallback(async (userId: string) => {
    try {
      const enabled = await getSavageModeForUser(userId);
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
      // Nest JWT session (PEA / Nest login) — no GoTrue user.
      if (session?.access_token && session.user?.app_metadata?.provider === 'nest') {
        const p = await fetchProfileFromNest(session.access_token);
        if (p) {
          setProfile(p);
          await loadUserPreferences(p.id);
        }
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        log.warn('Auth', 'getUser failed during profile refresh', error.message);
        if (/jwt|expired|invalid|session/i.test(error.message) && !/network|fetch|offline|timeout/i.test(error.message)) {
          await clearDeskSession();
          await signOut();
          setSession(null);
          setProfile(null);
          setSavageMode(false);
        }
        return;
      }
      if (data.user) {
        const p = await fetchProfile(data.user.id);
        setProfile(p);
        await loadUserPreferences(data.user.id);
      }
    } catch (error) {
      log.warn('Auth', 'refreshProfile error', String(error));
    }
  }, [loadUserPreferences, session?.access_token, session?.user?.app_metadata?.provider]);

  const adoptSession = useCallback(
    async (next: Session) => {
      setSession(next);
      await persistSession(next);
      if (next.user?.id) {
        const cached = await getCachedProfile();
        if (cached?.id === next.user.id) setProfile(cached);
        const fromNest =
          next.user.app_metadata?.provider === 'nest'
            ? await fetchProfileFromNest(next.access_token)
            : null;
        const p = fromNest || (await fetchProfile(next.user.id));
        if (p) setProfile(p);
        await loadUserPreferences(next.user.id);
      }
    },
    [loadUserPreferences],
  );

  const ensureFreshSession = useCallback(async () => {
    const { data: before } = await supabase.auth.getSession();
    const fresh = await refreshSessionIfNeeded();
    setSession((prev) => {
      const next = fresh ?? before.session ?? prev;
      if (prev?.access_token === next?.access_token && prev?.expires_at === next?.expires_at) {
        return prev;
      }
      return next;
    });
    const resolved = fresh ?? before.session;
    if (!resolved) {
      setProfile(null);
    }
    return resolved;
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
          void refreshProfile();
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

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      log.info('Auth', `state change: ${event}`, {
        email: nextSession?.user?.email ?? null,
      });
      setSession(nextSession);
      if (nextSession?.user) {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          await persistSession(nextSession);
        }
        void refreshProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSavageMode(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [refreshProfile]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      void (async () => {
        log.info('Auth', 'app foreground — refreshing session');
        const { data: before } = await supabase.auth.getSession();
        const fresh = await refreshSessionIfNeeded();
        setSession((prev) => {
          const next = fresh ?? before.session ?? prev;
          if (prev?.access_token === next?.access_token && prev?.expires_at === next?.expires_at) {
            return prev;
          }
          return next;
        });
        const resolved = fresh ?? before.session;
        if (!resolved) {
          setProfile(null);
          setSavageMode(false);
        } else if (resolved.user) {
          void loadUserPreferences(resolved.user.id);
        }
      })();
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [loadUserPreferences]);

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
        logout: async () => {
          log.info('Auth', 'sign out');
          const userId = session?.user?.id;
          if (userId) {
            await clearSelectedContext(userId);
          }
          await clearDeskSession();
          await clearPlatformNestToken().catch(() => {});
          await signOut();
          setSession(null);
          setProfile(null);
          setSavageMode(false);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
