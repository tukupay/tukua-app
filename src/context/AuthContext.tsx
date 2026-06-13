import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  fetchProfile,
  getCachedProfile,
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
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  profile: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  refreshProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    (async () => {
      log.info('Auth', 'restoring session…');
      const restored = await restoreSession();
      const { data } = await supabase.auth.getSession();
      const active = restored ?? data.session;
      setSession(active);
      if (active?.user) {
        log.info('Auth', 'session restored', { email: active.user.email });
        const cached = await getCachedProfile();
        setProfile(cached);
        await refreshProfile();
      } else {
        log.info('Auth', 'no session on boot');
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      log.info('Auth', `state change: ${event}`, {
        email: nextSession?.user?.email ?? null,
      });
      setSession(nextSession);
      if (nextSession?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        session,
        loading,
        isAuthenticated: !!session,
        refreshProfile,
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
