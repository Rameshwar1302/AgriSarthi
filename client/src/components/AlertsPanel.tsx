import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertNotification } from '../types';
import { 
  X, 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCheck, 
  Clock 
} from 'lucide-react';
import { api } from '../services/api';

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alerts?: AlertNotification[];
  onAlertsUpdated?: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  isOpen,
  onClose,
  alerts = [],
  onAlertsUpdated
}) => {
  const { t } = useApp();

  if (!isOpen) return null;

  const handleMarkRead = async (alertId: string) => {
    try {
      await api.markAlertRead(alertId);
      if (onAlertsUpdated) onAlertsUpdated();
    } catch (_) {}
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{t.alerts}</h3>
              <p className="text-xs text-slate-500">
                {alerts.length} Active System Notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <CheckCheck className="w-10 h-10 mx-auto text-emerald-500/50" />
              <p className="text-sm font-semibold text-slate-600">All alerts cleared</p>
              <p className="text-xs">No pending emergency risks detected for your farm plots.</p>
            </div>
          ) : (
            alerts.map((al) => (
              <div
                key={al._id}
                className={`p-4 rounded-2xl border transition space-y-2.5 ${
                  al.severity === 'CRITICAL'
                    ? 'bg-red-50/60 border-red-200'
                    : al.severity === 'WARNING'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(al.severity)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900">
                        {al.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(al.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {al.description}
                    </p>

                    {al.recommendedAction && (
                      <div className="pt-1.5 text-[11px] font-semibold text-emerald-800">
                        Action: {al.recommendedAction}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Source: {al.source}</span>
                      <button
                        onClick={() => handleMarkRead(al._id)}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Dismiss / Mark as read
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
