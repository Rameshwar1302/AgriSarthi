import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  FlaskConical, 
  Bot, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  Languages,
  Mic,
  CalendarCheck
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const { language, setLanguage, t, loginDemoFarmer } = useApp();

  const handleDemoClick = async () => {
    await loginDemoFarmer();
    onEnterDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-100/50 via-slate-50 to-slate-50 pointer-events-none -z-10"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-sm animate-in fade-in zoom-in-95">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Climate, Resource & Agritech Hackathon Track</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {language === 'mr' ? (
                <>
                  हवामान आणि शेतीचा अचूक ताळमेळ, <br />
                  <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-4">
                    कृषीसारथी AI
                  </span> सोबत!
                </>
              ) : language === 'hi' ? (
                <>
                  मौसम और मंडी का सटीक विश्लेषण, <br />
                  <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-4">
                    कृषिसारथी AI
                  </span> के साथ!
                </>
              ) : (
                <>
                  Precision Agritech & Advisory, <br />
                  Powered by <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-4">AgriSaarthi AI</span>
                </>
              )}
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t.tagline} Multilingual agronomist assistant integrating Open-Meteo forecasts, AGMARKNET market prices, ISRIC SoilGrids, and deterministic risk rules into actionable farming tasks.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleDemoClick}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t.quickDemoBtn}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>

              <button
                onClick={onEnterDashboard}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border border-slate-200 transition shadow-sm"
              >
                {t.dashboard}
              </button>
            </div>

            {/* Regional Languages Pill */}
            <div className="pt-2 flex items-center justify-center gap-3 text-xs text-slate-500 font-medium">
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>Full First-Class Support:</span>
              <button 
                onClick={() => setLanguage('mr')} 
                className={`font-bold hover:underline ${language === 'mr' ? 'text-emerald-700 underline' : 'text-slate-700'}`}
              >
                मराठी (Maharashtra)
              </button>
              <span>•</span>
              <button 
                onClick={() => setLanguage('hi')} 
                className={`font-bold hover:underline ${language === 'hi' ? 'text-emerald-700 underline' : 'text-slate-700'}`}
              >
                हिंदी
              </button>
              <span>•</span>
              <button 
                onClick={() => setLanguage('en')} 
                className={`font-bold hover:underline ${language === 'en' ? 'text-emerald-700 underline' : 'text-slate-700'}`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Complete Multi-Module Agricultural Intelligence
            </h2>
            <p className="text-sm text-slate-500">
              Designed for real-world farmer constraints with transparent data grounding and deterministic fallbacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Weather */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <CloudSun className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Weather Risk Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates heavy rainfall, waterlogging, thermal heat stress, and wind spray velocity hazards with crop-stage specific precautions.
              </p>
            </div>

            {/* Feature 2: Mandi */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Mandi Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pulls AGMARKNET APMC prices, calculates highest modal rate differentials, and charts historical price trends for informed market decisions.
              </p>
            </div>

            {/* Feature 3: Soil */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Soil Chemistry & KVK</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrates ISRIC SoilGrids with manual soil health card entries, categorizing pH, Organic Carbon, and Nitrogen with agronomic insights.
              </p>
            </div>

            {/* Feature 4: Autonomous Agent */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Autonomous Agent Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes multi-step tool calls, generates actionable calendar tasks, and dispatches high-priority in-app alerts with audible voice output.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Walkthrough Story Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-emerald-900 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                Hackathon Judge Walkthrough
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Case Study: Anand Rao Shinde, Maharashtra Soybean Farmer
              </h2>
              <p className="text-sm text-emerald-100 leading-relaxed">
                Witness an end-to-end autonomous workflow in Latur: when an unseasonal heavy rain spell of 52 mm is detected during the delicate flowering stage, AgriSaarthi alerts the farmer to unclog furrows, halts pesticide spraying, and pinpoints Latur APMC modal prices at ₹4,580/quintal.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleDemoClick}
                  className="px-6 py-3 rounded-xl bg-white text-emerald-950 font-bold text-sm shadow hover:bg-emerald-50 transition"
                >
                  Launch Demonstration Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 AgriSaarthi AI • Open-Meteo • data.gov.in AGMARKNET • ISRIC SoilGrids</p>
      </footer>
    </div>
  );
};
