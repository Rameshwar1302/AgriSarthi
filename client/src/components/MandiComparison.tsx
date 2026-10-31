import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MandiComparisonResult } from '../types';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Building2, 
  Calendar, 
  AlertCircle,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface MandiComparisonProps {
  data?: MandiComparisonResult;
  onSelectCommodity?: (crop: string) => void;
}

export const MandiComparison: React.FC<MandiComparisonProps> = ({ data, onSelectCommodity }) => {
  const { t } = useApp();
  const [selectedCommodity, setSelectedCommodity] = useState<string>(data?.commodity || 'Soybean');

  const commodities = ['Soybean', 'Cotton', 'Tur (Arhar)', 'Wheat'];

  const handleCommodityChange = (cmd: string) => {
    setSelectedCommodity(cmd);
    if (onSelectCommodity) onSelectCommodity(cmd);
  };

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  const { records, highestModalMandi, averageModalPrice, historicalTrends, status, sourceNote } = data;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header & Commodity Selector */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              {t.mandiOverview}
            </h2>
            <p className="text-xs text-slate-500">
              State: Maharashtra • Live APMC Benchmarks
            </p>
          </div>
        </div>

        {/* Commodity Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {commodities.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleCommodityChange(cmd)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCommodity === cmd
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Highest Price Highlight Banner */}
        {highestModalMandi && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-100/60 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t.bestPriceMandi}
              </span>
              <div className="text-lg font-bold text-slate-900 flex items-baseline gap-2">
                <span>{highestModalMandi.market} ({highestModalMandi.district})</span>
                <span className="text-emerald-700 text-xl font-extrabold">
                  ₹{highestModalMandi.modalPrice.toLocaleString()} {t.priceUnit}
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-emerald-200/80 text-xs font-semibold text-emerald-800 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              +₹{highestModalMandi.differenceFromAverage} above regional avg (₹{averageModalPrice.toLocaleString()})
            </div>
          </div>
        )}

        {/* Historical Trend Chart (Recharts) */}
        {historicalTrends && historicalTrends.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                {t.priceTrendChart}
              </span>
              <span>Source: AGMARKNET Daily Arrivals</span>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${val}`, 'Modal Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="modalPrice" 
                    stroke="#16a34a" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparison Table Across Available Mandis */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Regional Mandi Price Comparison</span>
            <span className="text-[11px] font-normal text-slate-400">{records.length} mandis reporting</span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-3.5 py-2.5">Market / APMC</th>
                  <th className="px-3 py-2.5">District</th>
                  <th className="px-3 py-2.5">Min (₹)</th>
                  <th className="px-3 py-2.5">Max (₹)</th>
                  <th className="px-3.5 py-2.5 text-right">Modal Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r, i) => {
                  const isTop = highestModalMandi && r.market === highestModalMandi.market;
                  return (
                    <tr key={i} className={isTop ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-slate-50/60'}>
                      <td className="px-3.5 py-2.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.market}</span>
                        {isTop && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                            TOP
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{r.district}</td>
                      <td className="px-3 py-2.5">₹{r.minPrice}</td>
                      <td className="px-3 py-2.5">₹{r.maxPrice}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                        ₹{r.modalPrice}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advisory Caveat Notice */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">
              {sourceNote}
            </p>
            <p className="text-[11px] text-slate-500">
              Disclaimer: Modal price reflects the dominant traded rate on arrival date. Transportation costs, moisture deduction, and physical grain grade should be weighed before dispatching harvest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

