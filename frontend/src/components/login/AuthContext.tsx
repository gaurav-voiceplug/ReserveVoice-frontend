import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthHeaders } from '../../utils/axiosInstance';
import { validateTokenApi } from '../../utils/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        const userInfo = { ...parsed, token, ...(refreshToken ? { refreshToken } : {}) };
        const headers = getAuthHeaders();
        validateTokenApi(headers)
          .then((valid) => {
            if (valid) setUser(userInfo);
            else logout();
          })
          .catch(() => logout())
          .finally(() => setLoading(false));
        return;
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const PREFETCH_ACTIVE_KEY = 'prefetchedActiveOrders';
  const PREFETCH_COMPLETED_KEY = 'prefetchedCompletedOrders';
  const ACTIVE_URL = 'https://vplite-stg.voiceplug.ai/api/orders/getActiveOrder';
  const COMPLETED_URL = 'https://vplite-stg.voiceplug.ai/api/orders/getCompletedOrder';

  async function prefetchOrders(token?: string, refresh?: string) {
    if (!token) return;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'authorization': token,
    };
    if (refresh) headers['x-refresh-token'] = refresh;
    try {
      const aRes = await fetch(ACTIVE_URL, { method: 'POST', headers });
      if (aRes.ok) {
        const aJson = await aRes.json();
        const actArray = Array.isArray(aJson) ? aJson : (aJson?.data ?? aJson?.result ?? []);
        localStorage.setItem(PREFETCH_ACTIVE_KEY, JSON.stringify(actArray));
      }
      const compRes = await fetch(COMPLETED_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ page: 0, callUuid: '', dateStart: null, dateEnd: null, phoneNumber: '' }),
      });
      if (compRes.ok) {
        const cJson = await compRes.json();
        const compArray = Array.isArray(cJson) ? cJson : (cJson?.data ?? cJson?.result ?? []);
        localStorage.setItem(PREFETCH_COMPLETED_KEY, JSON.stringify(compArray));
      }
    } catch (e) {
      console.warn('prefetchOrders failed', e);
    }
  }

  const login = (data: UserDetails) => {
    if (data.token) localStorage.setItem('token', data.token);
    if ((data as any).refreshToken) localStorage.setItem('refreshToken', (data as any).refreshToken);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    try { prefetchOrders((data as any).token, (data as any).refreshToken); } catch {}
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = !!user;

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};