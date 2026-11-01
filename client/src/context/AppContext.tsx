import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, UserProfile, DashboardData } from '../types';
import { translations } from '../i18n/translations';
import { api } from '../services/api';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Record<string, string>;
  user: UserProfile | null;
  token: string | null;
  isOnline: boolean;
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  login: (emailOrMobile: string, password: string) => Promise<void>;
  register: (name: string, emailOrMobile: string, password: string, preferredLanguage: Language) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('agrisaarthi_lang') as Language) || 'mr';
  });
  
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('agrisaarthi_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('agrisaarthi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Online / offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agrisaarthi_lang', lang);
  };

  const refreshDashboard = async () => {
    const currentToken = localStorage.getItem('agrisaarthi_token');
    if (!currentToken) {
      setDashboardData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard(language);
      setDashboardData(data);
      if (data.farmer) {
        setUser(data.farmer);
        localStorage.setItem('agrisaarthi_user', JSON.stringify(data.farmer));
      }
    } catch (err: any) {
      console.warn('[AppContext] Failed to refresh dashboard:', err.message);
      if (err.response?.status === 401) {
        logout();
      } else {
        setError(err.message || 'Failed to load dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshDashboard();
    }
  }, [language, token]);

  const login = async (emailOrMobile: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(emailOrMobile, password);
      setUser(res.user);
      setToken(res.token);
      if (res.user.preferredLanguage) {
        setLanguage(res.user.preferredLanguage);
      }
      await refreshDashboard();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, emailOrMobile: string, password: string, preferredLanguage: Language) => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, emailOrMobile, password, preferredLanguage });
      setUser(res.user);
      setToken(res.token);
      setLanguage(preferredLanguage);
      await refreshDashboard();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('agrisaarthi_token');
    localStorage.removeItem('agrisaarthi_user');
    setToken(null);
    setUser(null);
    setDashboardData(null);
  };

  const t = translations[language] || translations.mr;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        user,
        token,
        isOnline,
        dashboardData,
        isLoading,
        error,
        refreshDashboard,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
