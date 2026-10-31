import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeatherRiskCard } from '../components/WeatherRiskCard';
import { MandiComparison } from '../components/MandiComparison';
import { SoilMetricsCard } from '../components/SoilMetricsCard';
import { CropCalendarTimeline } from '../components/CropCalendarTimeline';
import { AgentExecutionTrace } from '../components/AgentExecutionTrace';
import { VoiceAdvisoryChat } from '../components/VoiceAdvisoryChat';
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  RefreshCw, 
  Edit3, 
  AlertCircle,
  TrendingUp,
  CloudSun,
  FlaskConical,
  CalendarCheck,
  Bot
} from 'lucide-react';

interface DashboardPageProps {
  onOpenOnboarding: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenOnboarding }) => {
  const { dashboardData, isLoading, refreshDashboard, t } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'chat'>('overview');

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">Loading Agricultural Intelligence...</p>
        </div>
      </div>
    );
  }

  const farmer = dashboardData?.farmer;
  const farm = dashboardData?.farm;
  const crop = dashboardData?.crop;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Farmer Greeting Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 text-white shadow-lg relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-200 border border-emerald-500/30">
              Maharashtra Demo Profile
            </span>
            <span className="text-xs text-emerald-200">
              Taluka: {farm?.location.split(',')[1] || 'Ausa'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {dashboardData?.greeting || 'Welcome to AgriSaarthi AI'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {farm?.location || 'Latur, Maharashtra'}
            </span>
            <span>•</span>
            <span className="font-semibold bg-white/10 px-2 py-0.5 rounded-md">
              Crop: {crop?.name} ({crop?.stage} Stage)
            </span>
            <span>•</span>
            <span>Area: {farm?.area || '3.5 Acre'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition backdrop-blur-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => refreshDashboard()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition backdrop-blur-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Farm Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'agent'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Autonomous Agent Engine (Live Trace)</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'chat'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Voice & AI Advisory Chat</span>
        </button>
      </div>

      {/* Tab 1: Full Farm Intelligence Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Autonomous Agent Highlight Banner */}
          <AgentExecutionTrace onWorkflowCompleted={refreshDashboard} />

          {/* Grid Layout: Weather + Mandi Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeatherRiskCard
              weather={dashboardData?.weather}
              risks={dashboardData?.weatherRisks}
              cropName={crop?.name}
              cropStage={crop?.stage}
            />

            <MandiComparison
              data={dashboardData?.mandiPrices}
            />
          </div>

          {/* Grid Layout: Soil Metrics + Crop Calendar Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SoilMetricsCard
              soil={dashboardData?.soil}
              onSoilUpdated={refreshDashboard}
            />

            <CropCalendarTimeline
              cropName={crop?.name}
              cropStage={crop?.stage}
              tasks={dashboardData?.tasks}
              onTasksUpdated={refreshDashboard}
            />
          </div>

          {/* Conversational Assistant Drawer / Embedded */}
          <div className="pt-2">
            <VoiceAdvisoryChat />
          </div>
        </div>
      )}

      {/* Tab 2: Dedicated Autonomous Agent View */}
      {activeTab === 'agent' && (
        <div className="space-y-6">
          <AgentExecutionTrace onWorkflowCompleted={refreshDashboard} />
          <CropCalendarTimeline
            cropName={crop?.name}
            cropStage={crop?.stage}
            tasks={dashboardData?.tasks}
            onTasksUpdated={refreshDashboard}
          />
        </div>
      )}

      {/* Tab 3: Dedicated Voice & AI Chat View */}
      {activeTab === 'chat' && (
        <div className="max-w-4xl mx-auto">
          <VoiceAdvisoryChat />
        </div>
      )}
    </div>
  );
};
