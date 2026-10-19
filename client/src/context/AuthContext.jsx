import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiFetch,
  setAccessToken,
  clearAccessToken,
  refreshAuth,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial refresh attempt completes

  // ─── Persistent login: try refreshing on mount ────────────────
  useEffect(() => {
    refreshAuth()
      .then((u) => {
        if (u && u !== 'network_error') setUser(u);
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── Silent refresh every 13 minutes (access token lives 15m) ─
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;
    let refreshTimeout = null;

    const scheduleRefresh = () => {
      refreshTimeout = setTimeout(async () => {
        try {
          const u = await refreshAuth();
          if (!isSubscribed) return;
          if (u === null) {
            setUser(null); // Explicit session expiry (401/403)
          } else {
            // Success or temporary network error — schedule next check
            scheduleRefresh();
          }
        } catch (err) {
          console.error('[AuthContext] Unexpected refresh error:', err);
          if (isSubscribed) scheduleRefresh();
        }
      }, 13 * 60 * 1000);
    };

    scheduleRefresh();

    return () => {
      isSubscribed = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [user?.id]);

  // ─── Register ─────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, role, company_name, institutionInviteCode }) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, company_name, institutionInviteCode }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ─── Login ────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore — we clear local state regardless
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const value = { user, loading, register, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
