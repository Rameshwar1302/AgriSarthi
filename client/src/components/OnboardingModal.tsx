import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sprout, MapPin, Layers, Droplets, Check, Compass } from 'lucide-react';
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
  const { dashboardData, refreshDashboard, language } = useApp();

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Clean Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {language === 'mr' ? 'शेत व पीक माहिती' : language === 'hi' ? 'खेत व फसल की जानकारी' : 'Farm & Crop Profile'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'mr' 
                  ? 'अचूक हवामान आणि बाजारभाव सल्ल्यासाठी माहिती अपडेट करा' 
                  : language === 'hi' 
                  ? 'सटीक मौसम और मंडी सलाह के लिए जानकारी अपडेट करें' 
                  : 'Update your location and crop stage for precision advisories'}
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

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Location & Land Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b border-emerald-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'mr' ? '१. शेताचे ठिकाण व क्षेत्र' : language === 'hi' ? '१. खेत का स्थान व क्षेत्र' : '1. Farm Location & Land'}
              </span>
            </div>

            {/* Farm Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {language === 'mr' ? 'शेताचे नाव (Farm Name)' : language === 'hi' ? 'खेत का नाम (Farm Name)' : 'Farm / Plot Name'}
              </label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="उदा. शिंदे शेतशिवार / Shinde Farm"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            {/* District & Taluka Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {language === 'mr' ? 'जिल्हा (District)' : language === 'hi' ? 'जिला (District)' : 'District (Maharashtra)'}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                >
                  <option value="Latur">Latur (लातूर)</option>
                  <option value="Akola">Akola (अकोला)</option>
                  <option value="Amravati">Amravati (अमरावती)</option>
                  <option value="Nanded">Nanded (नांदेड)</option>
                  <option value="Nagpur">Nagpur (नागपूर)</option>
                  <option value="Yavatmal">Yavatmal (यवतमाळ)</option>
                  <option value="Jalgaon">Jalgaon (जळगाव)</option>
                  <option value="Pune">Pune (पुणे)</option>
                  <option value="Solapur">Solapur (सोलापूर)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {language === 'mr' ? 'तालुका (Taluka)' : language === 'hi' ? 'तहसील/तालुका (Taluka)' : 'Taluka / Block'}
                </label>
                <input
                  type="text"
                  required
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  placeholder="उदा. औसा / Ausa"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Village & Area Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {language === 'mr' ? 'गाव (Village)' : language === 'hi' ? 'गांव (Village)' : 'Village'}
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="उदा. बेलकुंड / Belkund"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {language === 'mr' ? 'शेती क्षेत्र (Area)' : language === 'hi' ? 'क्षेत्रफल (Area)' : 'Farm Area'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="3.5"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="w-28 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  >
                    <option value="Acre">Acre (एकर)</option>
                    <option value="Hectare">Hectare (हेक्टर)</option>
                    <option value="Guntha">Guntha (गुंठा)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Irrigation Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {language === 'mr' ? 'पाणी व्यवस्था / सिंचन (Irrigation)' : language === 'hi' ? 'सिंचाई का प्रकार (Irrigation)' : 'Irrigation Availability'}
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              >
                <option value="Drip">Drip Irrigation (ठिबक सिंचन)</option>
                <option value="Sprinkler">Sprinkler (तुषार सिंचन)</option>
                <option value="Flood">Flood / Furrow (पाट पाणी)</option>
                <option value="Rainfed">Rainfed (कोरडवाहू / पावसाचे पाणी)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Active Crop Details */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider pb-1 border-b border-emerald-100">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'mr' ? '२. पिकाची सद्यस्थिती' : language === 'hi' ? '२. फसल की वर्तमान स्थिति' : '2. Active Crop Details'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {language === 'mr' ? 'मुख्य पीक (Crop Name)' : language === 'hi' ? 'मुख्य फसल (Crop Name)' : 'Main Crop'}
                </label>
                <select
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium text-slate-900"
                >
                  <option value="Soybean">Soybean (सोयाबीन)</option>
                  <option value="Cotton">Cotton (कापूस)</option>
                  <option value="Rice">Rice (भात / धान)</option>
                  <option value="Wheat">Wheat (गहू)</option>
                  <option value="Tur">Tur / Arhar (तूर)</option>
                  <option value="Maize">Maize (मका)</option>
                </select>
              </div>

              {/* Variety */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {language === 'mr' ? 'वाण / प्रकार (Variety)' : language === 'hi' ? 'किस्म / वैरायटी (Variety)' : 'Crop Variety'}
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="उदा. JS 335 / फुले कल्याणी"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Growth Stage */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {language === 'mr' ? 'पिकाची वाढीची अवस्था (Growth Stage)' : language === 'hi' ? 'फसल की अवस्था (Growth Stage)' : 'Current Crop Stage'}
              </label>
              <select
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium text-slate-900"
              >
                <option value="Land Preparation">Land Preparation (मशागत)</option>
                <option value="Sowing">Sowing (पेरणी)</option>
                <option value="Germination">Germination (उगवण अवस्था)</option>
                <option value="Vegetative">Vegetative (शाकीय वाढ)</option>
                <option value="Flowering">Flowering (फुलोरा अवस्था - संवेदनशील)</option>
                <option value="Pod/Grain Development">Pod/Grain Development (शेंगा / दाणे भरणे)</option>
                <option value="Harvesting">Harvesting (कापणी / काढणी)</option>
              </select>
            </div>
          </div>

          {/* Clean Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              {language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition transform active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (language === 'mr' ? 'जतन करत आहे...' : 'Saving...') 
                  : (language === 'mr' ? 'माहिती जतन करा' : language === 'hi' ? 'जानकारी सहेजें' : 'Save Configuration')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
