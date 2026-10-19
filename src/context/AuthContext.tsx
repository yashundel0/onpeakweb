import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    loading: true,
    error: null,
  });

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Profile load error:', error.message);
      return null;
    }
    return (data as Profile) ?? null;
  };

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, session: null, profile: null, isAdmin: false, loading: false, error: null });
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Session load error:', error.message);
        setState({ user: null, session: null, profile: null, isAdmin: false, loading: false, error: null });
        return;
      }
      const session = data.session;
      if (!session?.user) {
        setState({ user: null, session: null, profile: null, isAdmin: false, loading: false, error: null });
        return;
      }
      (async () => {
        const profile = await loadProfile(session.user.id);
        if (!mounted) return;
        setState({
          user: session.user,
          session,
          profile,
          isAdmin: !!profile?.is_admin,
          loading: false,
          error: null,
        });
      })();
    }).catch((err) => {
      console.error('getSession rejected:', err);
      if (mounted) setState({ user: null, session: null, profile: null, isAdmin: false, loading: false, error: null });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session?.user) {
          if (mounted) setState({ user: null, session: null, profile: null, isAdmin: false, loading: false, error: null });
          return;
        }
        const profile = await loadProfile(session.user.id);
        if (!mounted) return;
        setState({
          user: session.user,
          session,
          profile,
          isAdmin: !!profile?.is_admin,
          loading: false,
          error: null,
        });
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password, fullName, phone) => {
    if (!supabase) return { error: 'Booking system is not available.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) return { error: error.message };
    // Auto-create profile if signUp returned a session (email confirmation off).
    if (data.user) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, full_name: fullName, phone, is_admin: false },
        { onConflict: 'id' }
      );
    }
    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!supabase) return { error: 'Booking system is not available.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({ user: null, session: null, profile: null, isAdmin: false, loading: false, error: null });
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    if (!supabase) return { error: 'Booking system is not available.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: error.message };
    return { error: null };
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id);
    setState((s) => ({ ...s, profile, isAdmin: !!profile?.is_admin }));
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
