
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Sprout,
  MapPin,
  Compass,
  Check,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const inputClass = `
  w-full h-10 px-3
  bg-slate-50 border border-slate-200
  rounded-lg text-xs text-slate-700
  outline-none transition-all duration-200
  hover:border-slate-300
  focus:bg-white focus:border-emerald-500
  focus:ring-2 focus:ring-emerald-500/10
`;

const labelClass = `
  block text-[11px] font-semibold
  text-slate-600 mb-1.5
`;

const sectionClass = `
  flex items-center gap-2
  text-[11px] font-bold uppercase
  tracking-wider text-emerald-800
  pb-2 border-b border-emerald-100
`;

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { dashboardData, refreshDashboard, language, user } = useApp();

  const [farmName, setFarmName] = useState('');
  const [district, setDistrict] = useState('Latur');
  const [taluka, setTaluka] = useState('Ausa');
  const [village, setVillage] = useState('');

  const [area, setArea] = useState('3.0');
  const [areaUnit, setAreaUnit] = useState('Acre');

  const [soilType, setSoilType] = useState(
    'Medium Black (Madhyam Kali)'
  );

  const [irrigationType, setIrrigationType] = useState('Drip');

  const [cropName, setCropName] = useState('Soybean');
  const [variety, setVariety] = useState('JS 335 (Phule Kalyani)');
  const [cropStage, setCropStage] = useState('Flowering');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (dashboardData?.farm) {
      setFarmName(dashboardData.farm.name || '');
      setArea(dashboardData.farm.area?.split(' ')[0] || '3.0');
      const locParts = (dashboardData.farm.location || '').split(',').map(s => s.trim());
      if (locParts.length >= 3) {
        setVillage(locParts[0] || '');
        setTaluka(locParts[1] || 'Ausa');
        setDistrict(locParts[2] || 'Latur');
      }
    } else if (user?.name) {
      setFarmName(language === 'mr' ? `${user.name.split(' ')[0]} यांचे शेत` : `${user.name.split(' ')[0]}'s Farm`);
      setVillage('');
      setTaluka('');
      setDistrict('Latur');
      setArea('3.0');
    }

    if (dashboardData?.crop) {
      setCropName(dashboardData.crop.name || 'Soybean');
      setCropStage(dashboardData.crop.stage || 'Flowering');
      setVariety(dashboardData.crop.variety || 'JS 335 (Phule Kalyani)');
    }
  }, [isOpen, dashboardData, user, language]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!area || Number(area) <= 0) {
      alert('Please enter a valid farm area.');
      return;
    }

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

      onProfileUpdated?.();
      onClose();

    } catch (err: any) {
      alert(`Error updating farm profile: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-slate-950/50 backdrop-blur-[3px]
        p-3 sm:p-5
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="
          w-full max-w-md
          max-h-[92dvh]
          flex flex-col
          bg-white rounded-2xl
          border border-slate-200
          shadow-2xl overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
      >

        {/* HEADER */}
        <div className="
          flex items-center justify-between
          px-5 py-4
          border-b border-slate-100
          bg-white shrink-0
        ">
          <div className="flex items-center gap-3">

            <div className="
              w-10 h-10 rounded-xl
              bg-emerald-600
              text-white flex items-center justify-center
              shadow-sm shadow-emerald-600/20
            ">
              <Sprout size={21} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t(
                  'Farm & Crop Profile',
                  'खेत व फसल की जानकारी',
                  'शेत व पीक माहिती'
                )}
              </h2>

              <p className="text-[10px] text-slate-500 mt-0.5">
                {t(
                  'Update your location and crop stage for precision advisories',
                  'सटीक सलाह के लिए जानकारी अपडेट करें',
                  'अचूक सल्ल्यासाठी माहिती अपडेट करा'
                )}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              p-2 rounded-lg
              text-slate-400
              hover:text-slate-700
              hover:bg-slate-100
              transition
            "
          >
            <X size={18} />
          </button>
        </div>


        {/* FORM BODY */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col min-h-0 flex-1"
        >

          <div className="
            flex-1 overflow-y-auto
            px-5 py-4
            space-y-5
            custom-scrollbar
          ">

            {/* SECTION 1 */}
            <section className="space-y-3.5">

              <div className={sectionClass}>
                <MapPin size={14} className="text-emerald-600" />

                <span>
                  {t(
                    '1. Farm Location & Land',
                    '१. खेत का स्थान व क्षेत्र',
                    '१. शेताचे ठिकाण व क्षेत्र'
                  )}
                </span>
              </div>


              {/* Farm Name */}
              <div>
                <label className={labelClass}>
                  {t(
                    'Farm / Plot Name',
                    'खेत का नाम',
                    'शेताचे नाव'
                  )}
                </label>

                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Shinde Farm"
                  className={inputClass}
                />
              </div>


              {/* District + Taluka */}
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className={labelClass}>
                    {t(
                      'District (Maharashtra)',
                      'जिला (महाराष्ट्र)',
                      'जिल्हा (महाराष्ट्र)'
                    )}
                  </label>

                  <div className="relative">
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                    >
                      <option value="Latur">Latur (लातूर)</option>
                      <option value="Parbhani">Parbhani (परभणी)</option>
                      <option value="Akola">Akola (अकोला)</option>
                      <option value="Amravati">Amravati (अमरावती)</option>
                      <option value="Nanded">Nanded (नांदेड)</option>
                      <option value="Nagpur">Nagpur (नागपूर)</option>
                      <option value="Yavatmal">Yavatmal (यवतमाळ)</option>
                      <option value="Jalgaon">Jalgaon (जळगाव)</option>
                      <option value="Pune">Pune (पुणे)</option>
                      <option value="Solapur">Solapur (सोलापूर)</option>
                    </select>

                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    {t('Taluka / Block', 'तहसील / तालुका', 'तालुका')}
                  </label>

                  <input
                    type="text"
                    required
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    placeholder="Ausa"
                    className={inputClass}
                  />
                </div>

              </div>


              {/* Village + Area + Unit */}
              <div className="grid grid-cols-2 sm:grid-cols-[1.15fr_0.85fr_0.85fr] gap-3">

                <div>
                  <label className={labelClass}>
                    {t('Village', 'गांव', 'गाव')}
                  </label>

                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Belkund"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t('Farm Area', 'क्षेत्रफल', 'शेती क्षेत्र')}
                  </label>

                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="3.5"
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>
                    {t('Unit', 'इकाई', 'एकक')}
                  </label>

                  <div className="relative">
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value)}
                      className={`${inputClass} appearance-none pr-7`}
                    >
                      <option value="Acre">Acre (एकर)</option>
                      <option value="Hectare">Hectare</option>
                      <option value="Guntha">Guntha (गुंठा)</option>
                    </select>

                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

              </div>


              {/* Irrigation */}
              <div>
                <label className={labelClass}>
                  {t(
                    'Irrigation Availability',
                    'सिंचाई की उपलब्धता',
                    'पाणी व्यवस्था / सिंचन'
                  )}
                </label>

                <div className="relative">
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className={`${inputClass} appearance-none pr-8`}
                  >
                    <option value="Drip">
                      Drip Irrigation (ठिबक सिंचन)
                    </option>
                    <option value="Sprinkler">
                      Sprinkler (तुषार सिंचन)
                    </option>
                    <option value="Flood">
                      Flood / Furrow (पाट पाणी)
                    </option>
                    <option value="Rainfed">
                      Rainfed (कोरडवाहू)
                    </option>
                  </select>

                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

            </section>


            {/* SECTION 2 */}
            <section className="space-y-3.5 pt-1">

              <div className={sectionClass}>
                <Compass size={14} className="text-emerald-600" />

                <span>
                  {t(
                    '2. Active Crop Details',
                    '२. फसल की वर्तमान स्थिति',
                    '२. पिकाची सद्यस्थिती'
                  )}
                </span>
              </div>


              {/* Crop + Variety */}
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className={labelClass}>
                    {t('Main Crop', 'मुख्य फसल', 'मुख्य पीक')}
                  </label>

                  <div className="relative">
                    <select
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      className={`${inputClass} appearance-none pr-7 font-medium`}
                    >
                      <option value="Soybean">Soybean (सोयाबीन)</option>
                      <option value="Cotton">Cotton (कापूस)</option>
                      <option value="Rice">Rice (धान)</option>
                      <option value="Wheat">Wheat (गहू)</option>
                      <option value="Tur">Tur / Arhar (तूर)</option>
                      <option value="Maize">Maize (मका)</option>
                    </select>

                    <ChevronDown
                      size={13}
                      className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>


                <div>
                  <label className={labelClass}>
                    {t('Crop Variety', 'फसल की किस्म', 'पीक वाण')}
                  </label>

                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="JS 335"
                    className={inputClass}
                  />
                </div>

              </div>


              {/* Crop Stage */}
              <div>
                <label className={labelClass}>
                  {t(
                    'Current Crop Stage',
                    'फसल की वर्तमान अवस्था',
                    'पिकाची वाढीची अवस्था'
                  )}
                </label>

                <div className="relative">
                  <select
                    value={cropStage}
                    onChange={(e) => setCropStage(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 font-medium`}
                  >
                    <option value="Land Preparation">
                      Land Preparation (मशागत)
                    </option>

                    <option value="Sowing">
                      Sowing (पेरणी)
                    </option>

                    <option value="Germination">
                      Germination (उगवण अवस्था)
                    </option>

                    <option value="Vegetative">
                      Vegetative (शाकीय वाढ)
                    </option>

                    <option value="Flowering">
                      Flowering (फुलोरा अवस्था - संवेदनशील)
                    </option>

                    <option value="Pod/Grain Development">
                      Pod / Grain Development (शेंगा भरणे)
                    </option>

                    <option value="Harvesting">
                      Harvesting (कापणी / काढणी)
                    </option>
                  </select>

                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

            </section>

          </div>


          {/* STICKY FOOTER */}
          <div className="
            shrink-0
            flex items-center justify-end gap-3
            px-5 py-3.5
            border-t border-slate-100
            bg-white
          ">

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                px-4 py-2.5 rounded-lg
                text-xs font-semibold
                text-slate-500
                hover:bg-slate-100
                transition
                disabled:opacity-50
              "
            >
              {t('Cancel', 'रद्द करें', 'रद्द करा')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                flex items-center justify-center gap-2
                px-5 py-2.5
                min-w-[145px]
                rounded-lg
                bg-emerald-600
                hover:bg-emerald-700
                text-white text-xs font-bold
                shadow-md shadow-emerald-600/20
                transition-all duration-200
                active:scale-[0.98]
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <>
                  <span className="
                    w-3.5 h-3.5 rounded-full
                    border-2 border-white/40
                    border-t-white animate-spin
                  " />
                  {t('Saving...', 'सहेज रहे हैं...', 'जतन करत आहे...')}
                </>
              ) : (
                <>
                  <Check size={15} />
                  {t(
                    'Save Configuration',
                    'जानकारी सहेजें',
                    'माहिती जतन करा'
                  )}
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};
