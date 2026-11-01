import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  onOpenAlerts?: () => void;
  onOpenOnboarding?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAlerts, onOpenOnboarding, onOpenAuth }) => {
  const { language, setLanguage, t, user, logout, dashboardData } = useApp();

  const unreadAlertsCount = dashboardData?.alerts?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b-2 border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Sprout className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  {t.appName}
                </span>
                {user && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{user.name.split(' ')[0]}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden md:block font-medium">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Direct 1-Tap Language Selection Pills (Extremely Intuitive for Farmers) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setLanguage('mr')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                language === 'mr'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                language === 'hi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {!user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="px-3 sm:px-4 py-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition"
                >
                  {t.loginBtn || 'लॉगिन करा'}
                </button>
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition transform active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.registerBtn || 'नोंदणी करा'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Notification Bell */}
                <button
                  onClick={onOpenAlerts}
                  className="relative p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition"
                  aria-label="Alerts"
                  title="इशारे (Alerts)"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>

                {/* Farmer Profile Button */}
                <button
                  onClick={onOpenOnboarding}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs sm:text-sm font-bold border border-emerald-200 transition"
                  title="शेतकरी माहिती बदला (Edit Farm Profile)"
                >
                  <User className="w-4 h-4 text-emerald-700" />
                  <span className="max-w-[120px] truncate hidden sm:inline">{user.name.split(' ')[0]}</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="लॉगआउट (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
