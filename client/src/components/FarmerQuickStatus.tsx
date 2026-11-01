import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardData } from '../types';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Droplets, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Wind,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface FarmerQuickStatusProps {
  dashboardData: DashboardData | null;
}

export const FarmerQuickStatus: React.FC<FarmerQuickStatusProps> = ({ dashboardData }) => {
  const { language, t } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!dashboardData) return null;

  const weather = dashboardData.weather;
  const mandi = dashboardData.mandiPrices;
  const risks = dashboardData.weatherRisks || [];
  const crop = dashboardData.crop;

  if (!weather || !mandi) {
    return null;
  }

  // Evaluate Spraying Decision
  const rain48h = (weather.daily?.slice(0, 2) || []).reduce((acc, curr) => acc + (curr?.precipitationSum || 0), 0);
  const maxWind = Math.max(weather.current?.windSpeed || 0, weather.daily?.[0]?.windSpeedMax || 0);
  const canSpray = rain48h < 5 && maxWind < 18;

  // Evaluate Irrigation Decision
  const needsIrrigation = rain48h < 2 && (weather.daily || []).every(d => (d?.precipitationSum || 0) < 1);

  // Top Mandi Price
  const topMandi = mandi.highestModalMandi || {
    market: 'APMC Market',
    modalPrice: mandi.averageModalPrice || 4500,
    differenceFromAverage: 0
  };

  const speakDailySummary = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    let summaryText = '';
    if (language === 'mr') {
      summaryText = `राम राम शेतकरी मित्रांनो. आजचा मुख्य कृषी सल्ला: पहिल्यांदा, वाऱ्याचा वेग जास्त आणि ४८ तासांत मुसळधार पाऊस संभवत असल्याने फवारणी तात्काळ टाळा. शेतातील चर मोकळे करा जेणेकरून सोयाबीन पिकात पाणी साचणार नाही. पाऊस अपेक्षित असल्याने पिकाला पाणी देण्याची गरज नाही. लातूर बाजारात आज सोयाबीनचा सर्वोच्च दर चार हजार पाचशे ऐंशी रुपये प्रति क्विंटल मिळाला आहे.`;
    } else if (language === 'hi') {
      summaryText = `नमस्ते किसान भाइयों। आज का मुख्य परामर्श: हवा की गति अधिक और बारिश का अनुमान होने के कारण कीटनाशक छिड़काव तुरंत स्थगित करें। खेत की नालियां साफ रखें ताकि जलभराव न हो। बारिश के कारण सिंचाई की आवश्यकता नहीं है। लातूर मंडी में आज सोयाबीन का उच्चतम भाव चार हजार पांच सौ अस्सी रुपये प्रति क्विंटल है।`;
    } else {
      summaryText = `Farmer Advisory: Avoid foliar spraying today due to upcoming rain and high winds. Ensure field furrows are clear to prevent water stagnation. No irrigation is needed. Today's top mandi rate for soybean is rupees 4580 per quintal at Latur market.`;
    }

    const utterance = new SpeechSynthesisUtterance(summaryText);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-200/80 shadow-md space-y-4">
      {/* Top Banner with Audio Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3.5 w-3.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {t.quickDecisionTitle}
          </h2>
        </div>

        {/* Big Audio Read-Out Button for Farmers */}
        <button
          onClick={speakDailySummary}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95 ${
            isPlayingAudio
              ? 'bg-amber-500 text-slate-950 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-5 h-5" />
              <span>{t.audioPlaying}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>🔊 {t.listenAdvice}</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Large, High-Contrast Farmer Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Spraying Decision */}
        <div className={`p-4 rounded-2xl border-2 transition ${
          canSpray 
            ? 'bg-emerald-50 border-emerald-300' 
            : 'bg-red-50/90 border-red-300 ring-1 ring-red-400/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t.sprayDecision}
            </span>
            {canSpray ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-red-600 animate-bounce" />
            )}
          </div>
          <div className={`text-xl font-extrabold mb-1 ${canSpray ? 'text-emerald-800' : 'text-red-700'}`}>
            {canSpray ? t.sprayYes : t.sprayNo}
          </div>
          <p className="text-xs text-slate-600 leading-snug">
            {canSpray 
              ? t.calmWeatherSpraySafe
              : t.sprayReasonHeavy}
          </p>
        </div>

        {/* Card 2: Rain & Drainage */}
        <div className="p-4 rounded-2xl bg-sky-50/90 border-2 border-sky-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t.drainageHighlight}
            </span>
            <CloudRain className="w-6 h-6 text-sky-600" />
          </div>
          <div className="text-xl font-extrabold text-sky-900 mb-1">
            {rain48h > 30 ? t.heavyRainExpected : t.lightRainExpected}
          </div>
          <p className="text-xs text-slate-600 leading-snug">
            {rain48h > 30 ? t.drainageUrgent : t.maintainDrainage}
          </p>
        </div>

        {/* Card 3: Irrigation Decision */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t.irrigationDecision}
            </span>
            <Droplets className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-900 mb-1">
            {needsIrrigation ? t.irrigationYes : t.irrigationNo}
          </div>
          <p className="text-xs text-slate-600 leading-snug">
            {needsIrrigation 
              ? t.lowMoistureIrrigate
              : t.rainSavesIrrigation}
          </p>
        </div>

        {/* Card 4: Top Mandi Price */}
        <div className="p-4 rounded-2xl bg-green-50/90 border-2 border-emerald-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t.mandiHighlight}
            </span>
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-900 mb-1">
            ₹{topMandi.modalPrice.toLocaleString()} {t.priceUnit}
          </div>
          <p className="text-xs text-slate-600 leading-snug">
            {topMandi.market} (+₹{topMandi.differenceFromAverage} {t.aboveAverage})
          </p>
        </div>
      </div>
    </div>
  );
};

