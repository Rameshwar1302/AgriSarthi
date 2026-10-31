import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FarmerQuickStatus } from '../components/FarmerQuickStatus';
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
  TrendingUp, 
  CloudSun, 
  FlaskConical, 
  CalendarCheck, 
  Bot,
  Mic,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

interface DashboardPageProps {
  onOpenOnboarding: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenOnboarding }) => {
  const { dashboardData, isLoading, refreshDashboard, t } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'weather' | 'mandi' | 'crop' | 'assistant'>('overview');

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-base font-bold text-slate-700">कृषी माहिती लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  const farm = dashboardData?.farm;
  const crop = dashboardData?.crop;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6 pb-24">
      {/* Farmer Greeting Banner - Simplified & High Contrast */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 text-white shadow-lg relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/70 text-emerald-200 border border-emerald-400/30">
              {farm?.name || 'शिंदे शेतशिवार'}
            </span>
            <span className="text-xs text-emerald-200 font-medium">
              तालुका: {farm?.location.split(',')[1] || 'औसा (लातूर)'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {dashboardData?.greeting || 'राम राम! आजचा कृषी सल्ला'}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-emerald-100 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-300" />
              {farm?.location || 'लातूर, महाराष्ट्र'}
            </span>
            <span>•</span>
            <span className="bg-white/20 font-bold px-2.5 py-0.5 rounded-lg text-white">
              पीक: {crop?.name} ({crop?.stage} अवस्था)
            </span>
            <span>•</span>
            <span>क्षेत्र: {farm?.area || '३.५ एकर'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/30 transition backdrop-blur-sm shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>पीक / शेत बदला</span>
          </button>
          <button
            onClick={() => refreshDashboard()}
            className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 transition backdrop-blur-sm"
            title="रिफ्रेश करा"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. ULTRA-INTUITIVE INSTANT DECISION CARDS (Spray, Rain, Irrigation, Mandi) */}
      <FarmerQuickStatus dashboardData={dashboardData} />

      {/* Large, Touch-Friendly Farmer Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition transform active:scale-95 ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.tabOverview}</span>
        </button>

        <button
          onClick={() => setActiveTab('weather')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition transform active:scale-95 ${
            activeTab === 'weather'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          <span>{t.tabWeather}</span>
        </button>

        <button
          onClick={() => setActiveTab('mandi')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition transform active:scale-95 ${
            activeTab === 'mandi'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t.tabMandi}</span>
        </button>

        <button
          onClick={() => setActiveTab('crop')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition transform active:scale-95 ${
            activeTab === 'crop'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>{t.tabCalendar}</span>
        </button>

        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition transform active:scale-95 ${
            activeTab === 'assistant'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>{t.tabAiAgent}</span>
        </button>
      </div>

      {/* Tab 1: Overview - Clean & Intuitive Guidance */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeatherRiskCard
              weather={dashboardData?.weather}
              risks={dashboardData?.weatherRisks}
              cropName={crop?.name}
              cropStage={crop?.stage}
            />

            <CropCalendarTimeline
              cropName={crop?.name}
              cropStage={crop?.stage}
              tasks={dashboardData?.tasks}
              onTasksUpdated={refreshDashboard}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MandiComparison data={dashboardData?.mandiPrices} />
            <SoilMetricsCard soil={dashboardData?.soil} onSoilUpdated={refreshDashboard} />
          </div>

          {/* Autonomous Agent Workflow Engine */}
          <AgentExecutionTrace onWorkflowCompleted={refreshDashboard} />
        </div>
      )}

      {/* Tab 2: Dedicated Weather Intelligence */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <WeatherRiskCard
            weather={dashboardData?.weather}
            risks={dashboardData?.weatherRisks}
            cropName={crop?.name}
            cropStage={crop?.stage}
          />
        </div>
      )}

      {/* Tab 3: Dedicated Mandi Prices */}
      {activeTab === 'mandi' && (
        <div className="space-y-6">
          <MandiComparison data={dashboardData?.mandiPrices} />
        </div>
      )}

      {/* Tab 4: Crop Calendar & Soil Health */}
      {activeTab === 'crop' && (
        <div className="space-y-6">
          <CropCalendarTimeline
            cropName={crop?.name}
            cropStage={crop?.stage}
            tasks={dashboardData?.tasks}
            onTasksUpdated={refreshDashboard}
          />
          <SoilMetricsCard soil={dashboardData?.soil} onSoilUpdated={refreshDashboard} />
        </div>
      )}

      {/* Tab 5: Dedicated AI Voice Assistant & Autonomous Trace */}
      {activeTab === 'assistant' && (
        <div className="space-y-6">
          <VoiceAdvisoryChat />
          <AgentExecutionTrace onWorkflowCompleted={refreshDashboard} />
        </div>
      )}

      {/* Floating 1-Tap Voice Button (Always available on screen for farmers) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setActiveTab('assistant')}
          className="flex items-center gap-2.5 px-5 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-emerald-600/50 border-2 border-white/60 transition transform hover:scale-105 active:scale-95"
          title={t.voiceFloatingBtn}
        >
          <Mic className="w-6 h-6 animate-pulse" />
          <span>{t.voiceFloatingBtn}</span>
        </button>
      </div>
    </div>
  );
};
