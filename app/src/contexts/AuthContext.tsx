/**
 * Auth context — powered by Supabase Auth (email + password).
 * Session is persisted automatically by @supabase/supabase-js.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(supabaseUser: User): AuthUser {
  const displayName =
    (supabaseUser.user_metadata?.display_name as string) ||
    (supabaseUser.user_metadata?.username as string) ||
    supabaseUser.email?.split('@')[0] ||
    'User';
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toAuthUser(session.user));
        setToken(session.access_token);
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    // Also check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(toAuthUser(session.user));
        setToken(session.access_token);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false as const, error: error.message };
      }
      if (data.user) {
        setUser(toAuthUser(data.user));
        setToken(data.session?.access_token ?? null);
      }
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Network error. Please try again.',
      };
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });
        if (error) {
          return { ok: false as const, error: error.message };
        }
        if (data.user) {
          setUser(toAuthUser(data.user));
          setToken(data.session?.access_token ?? null);
        }
        return { ok: true as const };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Network error. Please try again.',
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  }, []);

  const updateProfile = useCallback(async (displayName: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (error) return { ok: false as const, error: error.message };
      if (data.user) {
        setUser(toAuthUser(data.user));
      }
      // Also sync to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user?.id);
      if (profileError) console.warn('Profile table update failed:', profileError.message);
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Update failed. Please try again.',
      };
    }
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, token, isLoading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    const noop = async () => {};
    return {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: async () => ({ ok: false as const, error: 'Auth not available' }),
      register: async () => ({ ok: false as const, error: 'Auth not available' }),
      logout: noop,
    };
  }
  return ctx;
}
