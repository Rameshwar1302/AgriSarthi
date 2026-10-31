import { WeatherData } from '../services/weatherService.js';

export interface EvaluatedRisk {
  riskType: 'HEAVY_RAINFALL' | 'HEATWAVE' | 'DRY_SPELL' | 'HIGH_WIND_SPRAY_HAZARD' | 'WATERLOGGING' | 'HARVEST_RAIN_RISK' | 'FAVORABLE_CONDITIONS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  crop: string;
  cropStage: string;
  reason: string;
  recommendedActions: string[];
  whatToAvoid: string[];
  source: string;
  generatedAt: string;
}

export function evaluateWeatherRisks(
  crop: string = 'Soybean',
  cropStage: string = 'Flowering',
  weather: WeatherData
): EvaluatedRisk[] {
  const risks: EvaluatedRisk[] = [];
  const generatedAt = new Date().toISOString();
  const source = `Deterministic Rule Engine (Grounded on ${weather.metadata.source})`;

  // Calculate 48-hour precipitation sum
  const first2DaysPrecip = (weather.daily.slice(0, 2) || []).reduce((acc, curr) => acc + (curr.precipitationSum || 0), 0);
  const maxWindSpeedNext3Days = Math.max(...(weather.daily.slice(0, 3) || []).map(d => d.windSpeedMax || 0), weather.current.windSpeed);
  const maxTempNext3Days = Math.max(...(weather.daily.slice(0, 3) || []).map(d => d.tempMax || 0), weather.current.temperature);
  const rainProbToday = weather.daily[0]?.precipitationProbabilityMax ?? 0;

  // 1. Heavy Rainfall & Waterlogging Rule
  if (first2DaysPrecip >= 40 || weather.current.precipitation > 15) {
    const isFloweringOrHarvest = cropStage === 'Flowering' || cropStage === 'Harvesting';
    risks.push({
      riskType: 'HEAVY_RAINFALL',
      severity: isFloweringOrHarvest ? 'HIGH' : 'MEDIUM',
      crop,
      cropStage,
      reason: `Forecast rainfall of ${first2DaysPrecip.toFixed(1)} mm over next 48h exceeds the safety threshold for ${crop} during the ${cropStage} stage.`,
      recommendedActions: [
        'Inspect and clear all drainage channels, furrows, and farm outlets immediately.',
        'If planted on Broad Bed Furrow (BBF) or ridges, ensure water drains away from root zones.',
        'Postpone all scheduled pesticide, fungicide, and herbicide spraying until 24 hours of dry weather.',
        'Ensure harvested produce or threshing areas are covered with tarpaulins.'
      ],
      whatToAvoid: [
        'Do not apply broadcast urea or fertilizers right before heavy downpours (causes leaching loss).',
        'Avoid running tractors or heavy machinery in water-saturated fields (causes soil compaction).'
      ],
      source,
      generatedAt
    });

    if (cropStage === 'Flowering' || cropStage === 'Pod/Grain Development') {
      risks.push({
        riskType: 'WATERLOGGING',
        severity: 'HIGH',
        crop,
        cropStage,
        reason: `Water stagnation in heavy black clay soils will suffocate legume root nodules and cause sudden flower/pod drop.`,
        recommendedActions: [
          'Drain stagnant surface water within 12-24 hours.',
          'After water recedes and soil is workable, spray 19:19:19 (100g/10L) to revive root uptake.'
        ],
        whatToAvoid: ['Never allow stagnant water to remain standing around flowering soybean for >24 hours.'],
        source,
        generatedAt
      });
    }
  }

  // 2. High Wind & Unfavorable Spraying Conditions Rule
  if (maxWindSpeedNext3Days >= 20 || weather.current.windSpeed >= 20 || rainProbToday >= 65) {
    risks.push({
      riskType: 'HIGH_WIND_SPRAY_HAZARD',
      severity: maxWindSpeedNext3Days >= 28 ? 'HIGH' : 'MEDIUM',
      crop,
      cropStage,
      reason: `Wind speeds reaching ${maxWindSpeedNext3Days.toFixed(1)} km/h with ${rainProbToday}% rain probability creates severe spray drift hazard and chemical wash-off.`,
      recommendedActions: [
        'Suspend all foliar insecticide and fungicide spraying until early morning when winds are below 12 km/h.',
        'Check physical stakes and supports for tall crops (like Cotton or Maize).'
      ],
      whatToAvoid: [
        'Do NOT spray during gusty winds (leads to off-target drift, uneven coverage, and toxic exposure).',
        'Do NOT spray when rain is imminent within 4-6 hours unless using a designated rainfast sticker.'
      ],
      source,
      generatedAt
    });
  }

  // 3. Heatwave & High Temperature Stress Rule
  if (maxTempNext3Days >= 37.0) {
    risks.push({
      riskType: 'HEATWAVE',
      severity: maxTempNext3Days >= 40.0 ? 'CRITICAL' : 'HIGH',
      crop,
      cropStage,
      reason: `Maximum temperatures approaching ${maxTempNext3Days.toFixed(1)}°C cause thermal stress, stomatal closure, and reduced pollen viability.`,
      recommendedActions: [
        'Provide light, frequent irrigation during late evening or early morning to cool root zones.',
        'Use drip irrigation or mulching with crop residue to conserve soil moisture.',
        'In Cotton, spray Potassium Nitrate (13:0:45) at 1% to mitigate heat stress.'
      ],
      whatToAvoid: [
        'Avoid flood irrigation during the hottest mid-day hours (causes scalding and root shock).',
        'Avoid chemical spraying under direct scorching sun.'
      ],
      source,
      generatedAt
    });
  }

  // 4. Extended Dry Spell Rule
  const total7DayRain = weather.daily.reduce((acc, curr) => acc + (curr.precipitationSum || 0), 0);
  if (total7DayRain < 3.0 && weather.daily.every(d => d.tempMax >= 32)) {
    risks.push({
      riskType: 'DRY_SPELL',
      severity: cropStage === 'Flowering' ? 'HIGH' : 'MEDIUM',
      crop,
      cropStage,
      reason: `Low rainfall (${total7DayRain.toFixed(1)} mm) and sustained high evaporative demand over the 7-day forecast.`,
      recommendedActions: [
        'Schedule protective irrigation for moisture-sensitive stages.',
        'In rainfed plots, practice shallow hoeing or dust mulching to break capillary pores and retain subsoil moisture.'
      ],
      whatToAvoid: ['Do not delay protective irrigation if top 5 cm of soil has cracked.'],
      source,
      generatedAt
    });
  }

  // 5. Harvest Rain Risk Rule
  if ((cropStage === 'Harvesting' || cropStage === 'Post-Harvest') && first2DaysPrecip >= 10) {
    risks.push({
      riskType: 'HARVEST_RAIN_RISK',
      severity: 'CRITICAL',
      crop,
      cropStage,
      reason: `Rain forecast during harvest stage poses high risk of pod shattering, seed discoloration, fungal aflatoxin, and grain sprouting.`,
      recommendedActions: [
        'Expedite harvesting of mature crop before the rain onset.',
        'Move harvested threshed produce to covered sheds or cover heaps securely with high-gauge plastic tarpaulins.',
        'Do not leave harvested pods unthreshed on bare open wet soil.'
      ],
      whatToAvoid: ['Never pack wet or damp grains into storage sacks (causes moisture heat and rot).'],
      source,
      generatedAt
    });
  }

  // If no risks triggered, emit favorable conditions
  if (risks.length === 0) {
    risks.push({
      riskType: 'FAVORABLE_CONDITIONS',
      severity: 'LOW',
      crop,
      cropStage,
      reason: `Weather parameters (temperature, wind, and moisture) are within standard agronomical thresholds for ${crop}.`,
      recommendedActions: [
        'Carry out routine scouting for pests and weeds.',
        'Proceed with planned fertilizer application or intercultivation as per crop calendar.'
      ],
      whatToAvoid: ['Avoid excessive irrigation beyond field capacity.'],
      source,
      generatedAt
    });
  }

  return risks;
}

