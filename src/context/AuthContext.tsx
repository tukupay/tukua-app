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
  getCachedProfile,
  persistSession,
  refreshSessionIfNeeded,
  restoreSession,
  signOut,
  UserProfile,
} from '../lib/auth';
import { log } from '../lib/logger';

type AuthContextType = {
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  ensureFreshSession: () => Promise<Session | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  profile: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  refreshProfile: async () => {},
  ensureFreshSession: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        log.warn('Auth', 'getUser failed during profile refresh', error.message);
        if (/jwt|expired|invalid|session/i.test(error.message)) {
          await signOut();
          setSession(null);
          setProfile(null);
        }
        return;
      }
      if (data.user) {
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      }
    } catch (error) {
      log.warn('Auth', 'refreshProfile error', String(error));
    }
  }, []);

  const ensureFreshSession = useCallback(async () => {
    const fresh = await refreshSessionIfNeeded();
    setSession(fresh);
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
          void refreshProfile();
        } else {
          log.info('Auth', 'no session on boot');
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
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [refreshProfile]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state !== 'active') return;
      void (async () => {
        log.info('Auth', 'app foreground — refreshing session');
        const fresh = await refreshSessionIfNeeded();
        setSession(fresh);
        if (!fresh) {
          setProfile(null);
        }
      })();
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        session,
        loading,
        isAuthenticated: !!session,
        refreshProfile,
        ensureFreshSession,
        logout: async () => {
          log.info('Auth', 'sign out');
          await signOut();
          setSession(null);
          setProfile(null);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
