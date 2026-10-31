import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Language } from '../types';
import { 
  Sprout, 
  Languages, 
  Wifi, 
  WifiOff, 
  Bell, 
  Sparkles, 
  User, 
  LogOut, 
  MapPin, 
  ShieldCheck 
} from 'lucide-react';

interface NavbarProps {
  onOpenAlerts?: () => void;
  onOpenOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAlerts, onOpenOnboarding }) => {
  const { language, setLanguage, t, user, logout, loginDemoFarmer, isOnline, dashboardData } = useApp();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const unreadAlertsCount = dashboardData?.alerts?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sprout className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Hackathon Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Farm & Crop Context Pill (Desktop) */}
          {dashboardData && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {dashboardData.farm.location.split(',').slice(0, 2).join(',')}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {dashboardData.crop.name} ({dashboardData.crop.stage})
              </span>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline Status Badge */}
            <div 
              title={isOnline ? 'Online: Live API Synchronized' : 'Offline: Local Caching Active'} 
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <Languages className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'mr' ? 'मराठी' : language === 'hi' ? 'हिंदी' : 'English'}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => { setLanguage('mr'); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-emerald-50 ${language === 'mr' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    मराठी (Marathi)
                  </button>
                  <button
                    onClick={() => { setLanguage('hi'); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-emerald-50 ${language === 'hi' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    हिंदी (Hindi)
                  </button>
                  <button
                    onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-emerald-50 ${language === 'en' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Quick Demo Button / Profile */}
            {!user ? (
              <button
                onClick={loginDemoFarmer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition transform active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.quickDemoBtn}</span>
                <span className="sm:hidden">Demo</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenOnboarding}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
                  title="Edit Farm Profile"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="max-w-[100px] truncate hidden sm:inline">{user.name.split(' ')[0]}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Logout"
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
