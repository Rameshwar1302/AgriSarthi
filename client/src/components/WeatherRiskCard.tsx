import React from 'react';
import { useApp } from '../context/AppContext';
import { WeatherData, EvaluatedRisk } from '../types';
import { 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Calendar,
  CloudLightning,
  Sun
} from 'lucide-react';

interface WeatherRiskCardProps {
  weather?: WeatherData;
  risks?: EvaluatedRisk[];
  cropName?: string;
  cropStage?: string;
}

export const WeatherRiskCard: React.FC<WeatherRiskCardProps> = ({
  weather,
  risks = [],
  cropName = 'Soybean',
  cropStage = 'Flowering'
}) => {
  const { t } = useApp();

  if (!weather) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  const { current, daily, metadata } = weather;

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'HIGH':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      default:
        return <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {t.weatherIntelligence}
              <span className="text-xs font-normal text-slate-500">({weather.location.name})</span>
            </h2>
            <p className="text-xs text-slate-500">
              {t.currentTemp} • {current.conditionText}
            </p>
          </div>
        </div>

        {/* Source & Provenance Badge */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <span className={`px-2 py-0.5 rounded-full border ${
            metadata.status === 'live' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : metadata.status === 'cached'
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            {metadata.status.toUpperCase()}
          </span>
          <span className="hidden sm:inline">{metadata.source}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Current Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs">{t.currentTemp}</span>
              <Thermometer className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {current.temperature}°C
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t.feelsLike} {current.feelsLike}°C
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs">{t.precipitation}</span>
              <CloudRain className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {current.precipitation} mm
            </div>
            <div className="text-[11px] text-sky-600 font-medium mt-0.5">
              48h: {((daily[0]?.precipitationSum || 0) + (daily[1]?.precipitationSum || 0)).toFixed(1)} mm
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs">{t.humidity}</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {current.humidity}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Relative humidity
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs">{t.windSpeed}</span>
              <Wind className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {current.windSpeed} km/h
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Gusts up to {daily[0]?.windSpeedMax || 22} km/h
            </div>
          </div>
        </div>

        {/* Evaluated Risks Banner */}
        {risks.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              {t.riskIdentified} ({cropName} - {cropStage})
            </div>

            {risks.map((risk, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border ${getSeverityStyle(risk.severity)} transition`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(risk.severity)}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">
                        {risk.riskType.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-white/80 border border-current">
                        {risk.severity} Risk
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed opacity-90">
                      {risk.reason}
                    </p>

                    {/* Recommended Actions Bullet points */}
                    {risk.recommendedActions && risk.recommendedActions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <span className="text-[11px] font-bold block mb-1">
                          Recommended Agronomic Action:
                        </span>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          {risk.recommendedActions.slice(0, 2).map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7-Day Precision Forecast Strip */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t.sevenDayForecast}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto pb-1">
            {daily.map((day, idx) => {
              const dateObj = new Date(day.date);
              const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const isRainy = day.precipitationSum > 10 || day.precipitationProbabilityMax > 60;

              return (
                <div
                  key={day.date}
                  className={`p-2.5 rounded-xl text-center border transition ${
                    isRainy 
                      ? 'bg-sky-50/70 border-sky-200' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    {dayName}
                  </span>
                  <div className="my-1.5 flex justify-center text-slate-700">
                    {isRainy ? (
                      <CloudRain className="w-5 h-5 text-sky-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {Math.round(day.tempMax)}°
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {Math.round(day.tempMin)}°
                  </div>
                  {day.precipitationSum > 0 && (
                    <div className="text-[10px] font-medium text-sky-700 mt-1">
                      {day.precipitationSum.toFixed(0)}mm
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
