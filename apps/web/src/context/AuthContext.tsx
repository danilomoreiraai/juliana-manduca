import type { Profile } from '@juliana/contracts';
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { config } from '../config';
import { supabase } from '../lib/supabase';
import { DEMO_AUTH_EVENT, readDemoSession } from '../services/demo';
import { getProfile } from '../services/portal';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const current = await getProfile();
      setProfile(current);
      return current;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (config.demoMode) {
      let active = true;
      const syncDemoSession = async () => {
        const nextSession = readDemoSession();
        setSession(nextSession);
        if (nextSession) await refreshProfile();
        else setProfile(null);
        if (active) setLoading(false);
      };
      void syncDemoSession();
      window.addEventListener(DEMO_AUTH_EVENT, syncDemoSession);
      return () => {
        active = false;
        window.removeEventListener(DEMO_AUTH_EVENT, syncDemoSession);
      };
    }

    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await refreshProfile();
      if (active) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
      queueMicrotask(() => void (nextSession ? refreshProfile() : Promise.resolve()));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const value = useMemo(
    () => ({ session, profile, loading, refreshProfile }),
    [session, profile, loading, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
