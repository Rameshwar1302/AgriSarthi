import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sprout, MapPin, Layers, Droplets } from 'lucide-react';
import { api } from '../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { dashboardData, refreshDashboard } = useApp();

  const [farmName, setFarmName] = useState(dashboardData?.farm?.name || 'Shinde Farm');
  const [district, setDistrict] = useState('Latur');
  const [taluka, setTaluka] = useState('Ausa');
  const [village, setVillage] = useState('Belkund');
  const [area, setArea] = useState(dashboardData?.farm?.area?.split(' ')[0] || '3.5');
  const [areaUnit, setAreaUnit] = useState('Acre');
  const [soilType, setSoilType] = useState('Medium Black (Madhyam Kali)');
  const [irrigationType, setIrrigationType] = useState('Drip');

  const [cropName, setCropName] = useState(dashboardData?.crop?.name || 'Soybean');
  const [cropStage, setCropStage] = useState(dashboardData?.crop?.stage || 'Flowering');
  const [variety, setVariety] = useState('JS 335 (Phule Kalyani)');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.createFarm({
        farmName,
        state: 'Maharashtra',
        district,
        taluka,
        village,
        area: parseFloat(area),
        areaUnit,
        soilType,
        irrigationType
      });

      await api.createCrop({
        cropName,
        cropStage,
        variety,
        farmArea: parseFloat(area)
      });

      await refreshDashboard();
      if (onProfileUpdated) onProfileUpdated();
      onClose();
    } catch (err: any) {
      alert(`Error updating farm profile: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Farm & Crop Settings</h3>
              <p className="text-xs text-slate-500">Configure your farm location, soil, and active crop stage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Farm / Plot Name
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                District (Maharashtra)
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Latur">Latur</option>
                <option value="Akola">Akola</option>
                <option value="Amravati">Amravati</option>
                <option value="Nanded">Nanded</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Yavatmal">Yavatmal</option>
                <option value="Jalgaon">Jalgaon</option>
                <option value="Pune">Pune</option>
                <option value="Solapur">Solapur</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Taluka / Block
              </label>
              <input
                type="text"
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Village
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Farm Area
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="w-24 px-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Acre">Acre</option>
                  <option value="Hectare">Hectare</option>
                  <option value="Guntha">Guntha</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Irrigation Type
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Drip">Drip Irrigation</option>
                <option value="Sprinkler">Sprinkler</option>
                <option value="Flood">Flood / Furrow</option>
                <option value="Rainfed">Rainfed (कोरडवाहू)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Active Crop Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Crop Name
                </label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Soybean">Soybean (सोयाबीन)</option>
                  <option value="Cotton">Cotton (कापूस)</option>
                  <option value="Rice">Rice (भात/धान)</option>
                  <option value="Wheat">Wheat (गहू)</option>
                  <option value="Tur">Tur / Arhar (तूर)</option>
                  <option value="Maize">Maize (मका)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Growth Stage
                </label>
                <select
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Land Preparation">Land Preparation</option>
                  <option value="Sowing">Sowing</option>
                  <option value="Germination">Germination</option>
                  <option value="Vegetative">Vegetative</option>
                  <option value="Flowering">Flowering (Critical)</option>
                  <option value="Pod/Grain Development">Pod/Grain Development</option>
                  <option value="Harvesting">Harvesting</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Variety
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. JS 335 / KDS 726"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
            >
              {isSubmitting ? 'Updating...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
