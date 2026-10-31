import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AlertsPanel } from './components/AlertsPanel';
import { OnboardingModal } from './components/OnboardingModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';

const AppContent: React.FC = () => {
  const { user, dashboardData, refreshDashboard } = useApp();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      <OfflineIndicator />

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'landing' && !user ? (
          <LandingPage onEnterDashboard={() => setCurrentView('dashboard')} />
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

