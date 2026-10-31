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
  loginDemoFarmer: () => Promise<void>;
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
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard(language);
      setDashboardData(data);
    } catch (err: any) {
      console.warn('[AppContext] Failed to refresh dashboard:', err.message);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, [language]);

  const loginDemoFarmer = async () => {
    try {
      const res = await api.login('9876543210', 'password123');
      setUser(res.user);
      setToken(res.token);
      await refreshDashboard();
    } catch (err) {
      console.warn('Demo login via API failed, loading local demo state');
      const fallbackUser: UserProfile = {
        id: 'usr_demo_anand_shinde',
        name: 'Anand Rao Shinde (आनंदराव शिंदे)',
        emailOrMobile: '9876543210',
        preferredLanguage: 'mr'
      };
      setUser(fallbackUser);
      localStorage.setItem('agrisaarthi_user', JSON.stringify(fallbackUser));
      await refreshDashboard();
    }
  };

  const logout = () => {
    localStorage.removeItem('agrisaarthi_token');
    localStorage.removeItem('agrisaarthi_user');
    setToken(null);
    setUser(null);
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
        loginDemoFarmer,
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

