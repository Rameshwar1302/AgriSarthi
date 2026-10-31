import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SoilData } from '../types';
import { 
  FlaskConical, 
  Layers, 
  CheckCircle, 
  AlertCircle, 
  Info,
  PlusCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

interface SoilMetricsCardProps {
  soil?: SoilData;
  onSoilUpdated?: () => void;
}

export const SoilMetricsCard: React.FC<SoilMetricsCardProps> = ({ soil, onSoilUpdated }) => {
  const { t } = useApp();
  const [showManualModal, setShowManualModal] = useState(false);
  const [pHInput, setPHInput] = useState('');
  const [ocInput, setOcInput] = useState('');
  const [nInput, setNInput] = useState('');
  const [sourceInput, setSourceInput] = useState('KVK Soil Testing Lab');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!soil) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pHInput || !ocInput) return;

    setIsSubmitting(true);
    try {
      await api.submitManualSoilTest({
        pH: parseFloat(pHInput),
        organicCarbon: parseFloat(ocInput),
        nitrogen: nInput ? parseFloat(nInput) : undefined,
        source: sourceInput
      });
      setShowManualModal(false);
      if (onSoilUpdated) onSoilUpdated();
    } catch (err: any) {
      alert(`Failed to save soil test: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManual = soil.sourceType === 'Farmer Manual Test';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {t.soilHealth}
            </h2>
            <p className="text-xs text-slate-500">
              Texture: {soil.soilTexture}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Provenance Badge */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isManual 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {isManual ? 'Farmer Lab Test' : 'ISRIC GIS Estimate'}
          </span>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enter Report</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* pH */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">{t.soilPh}</span>
              <FlaskConical className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {soil.pH}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle className="w-3 h-3" />
              {soil.pHEvaluation}
            </div>
          </div>

          {/* Organic Carbon */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">{t.organicCarbon}</span>
              <Layers className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {soil.organicCarbon}%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <Info className="w-3 h-3" />
              {soil.organicCarbonEvaluation} Range
            </div>
          </div>

          {/* Available Nitrogen */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">{t.nitrogen}</span>
              <FlaskConical className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {soil.nitrogen ? `${soil.nitrogen} kg/ha` : 'Not Measured'}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              {soil.nitrogenEvaluation ? `${soil.nitrogenEvaluation} Availability` : 'Lab test required'}
            </div>
          </div>
        </div>

        {/* Agronomic Insights List */}
        {soil.agronomicInsights && soil.agronomicInsights.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Agronomic Soil Recommendations:
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              {soil.agronomicInsights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Provenance & KVK Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">
              Source: {soil.source}
            </p>
            <p className="text-[11px] text-slate-500">
              {soil.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* Manual Soil Test Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Add Laboratory Soil Test Values
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter official values from your Soil Health Card or Krishi Vigyan Kendra report.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Soil pH (e.g. 7.4) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="11"
                  required
                  placeholder="7.4"
                  value={pHInput}
                  onChange={(e) => setPHInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Organic Carbon % (e.g. 0.58) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.05"
                  max="5"
                  required
                  placeholder="0.58"
                  value={ocInput}
                  onChange={(e) => setOcInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Available Nitrogen (kg/ha) - Optional
                </label>
                <input
                  type="number"
                  placeholder="215"
                  value={nInput}
                  onChange={(e) => setNInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Testing Source / Laboratory
                </label>
                <input
                  type="text"
                  placeholder="KVK Latur Soil Testing Lab"
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Soil Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
