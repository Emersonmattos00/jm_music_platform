'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, tokenStore, User } from './api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const stored = tokenStore.getUser();

        if (!stored) {
          setLoading(false);
          return;
        }

        // CORREÇÃO 37: Busca dados frescos do usuário (ex: emailVerified atualizado).
        const freshUser = await api.me();

        if (!cancelled) {
          tokenStore.set(tokenStore.getAccess()!, freshUser);
          setUser(freshUser);
        }
      } catch (e) {
        // Se falhar com 401 (sessão expirada), limpa os dados locais.
        // Se for falha de rede, mantém o usuário (para não deslogar offline).
        if (!cancelled) {
          if ((e as any).status === 401) {
            tokenStore.clear();
            setUser(null);
          } else {
            // Mantém o usuário local em caso de falha de rede
            const stored = tokenStore.getUser();
            if (stored) setUser(stored);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    tokenStore.set(res.accessToken, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.register({ name, email, password });
      tokenStore.set(res.accessToken, res.user);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignora erro
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}