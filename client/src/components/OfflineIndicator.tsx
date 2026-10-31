import React from 'react';
import { useApp } from '../context/AppContext';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, dashboardData, t } = useApp();

  if (isOnline && !dashboardData?.isCached) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm sticky top-16 z-30">
      <WifiOff className="w-4 h-4 animate-bounce" />
      <span>
        {t.offlineNotice} (Last synced: {dashboardData?.timestamp ? new Date(dashboardData.timestamp).toLocaleTimeString() : 'Local Cache'})
      </span>
    </div>
  );
};
