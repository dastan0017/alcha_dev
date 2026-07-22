import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse, AuthUser, LoginInput } from '@alcha/shared';
import { http, refreshAccessToken, setAccessToken, setOnUnauthorized } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await http.post<AuthResponse>('/auth/login', input);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await http.post('/auth/logout');
    } catch {
      // ignore — clear locally regardless
    }
    clearSession();
  }, [clearSession]);

  // Restore the session on mount from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await refreshAccessToken();
      if (!active) return;
      if (token) {
        try {
          const me = await http.get<AuthUser>('/auth/me');
          if (active) setUser(me.data);
        } catch {
          clearSession();
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [clearSession]);

  useEffect(() => {
    setOnUnauthorized(() => clearSession());
    return () => setOnUnauthorized(null);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
