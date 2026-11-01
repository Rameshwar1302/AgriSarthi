import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AlertsPanel } from './components/AlertsPanel';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';

const AppContent: React.FC = () => {
  const { user, dashboardData, refreshDashboard } = useApp();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // If user logs in, ensure dashboard view is active
  useEffect(() => {
    if (user) {
      setCurrentView('dashboard');
    }
  }, [user]);

  // If user is newly registered and hasn't set up a farm yet, prompt them with onboarding
  useEffect(() => {
    if (user && dashboardData && dashboardData.hasFarm === false) {
      setIsOnboardingOpen(true);
    }
  }, [user, dashboardData?.hasFarm]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenAuth={openAuth}
      />

      <OfflineIndicator />

      {/* Main View Switcher */}
      <main className="flex-1">
        {!user ? (
          <LandingPage 
            onEnterDashboard={() => openAuth('login')} 
            onOpenAuth={openAuth}
          />
        ) : (
          <DashboardPage onOpenOnboarding={() => setIsOnboardingOpen(true)} />
        )}
      </main>

      {/* Slide-over Panels and Modals */}
      <AlertsPanel
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={dashboardData?.alerts}
        onAlertsUpdated={refreshDashboard}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onProfileUpdated={refreshDashboard}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={() => {
          setCurrentView('dashboard');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
