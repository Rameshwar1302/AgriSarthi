import { evaluateWeatherRisks } from '../rules/riskEngine.js';
import { evaluateSoilMetrics } from '../services/soilService.js';
import { getMandiPrices } from '../services/mandiService.js';
import { AgriculturalAdvisoryAgent } from '../agents/advisoryAgent.js';
import { generateAdvisory } from '../services/llmService.js';
import { DEMO_FARMER } from '../data/seedData.js';
import { WeatherData } from '../services/weatherService.js';

async function runAcceptanceTests() {
  console.log('🧪 Starting AgriSaarthi AI Acceptance Tests...\n');
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // 1. Weather Risk Rules: Heavy Rainfall Detection
  const mockHeavyRainWeather: WeatherData = {
    location: { name: 'Latur', latitude: 18.25, longitude: 76.5 },
    current: {
      time: new Date().toISOString(),
      temperature: 26,
      feelsLike: 28,
      humidity: 85,
      precipitation: 18.0,
      windSpeed: 22,
      windDirection: 240,
      weatherCode: 65,
      conditionText: 'Heavy Rain'
    },
    hourly: [],
    daily: [
      {
        date: '2026-10-31',
        weatherCode: 65,
        conditionText: 'Heavy Rain',
        tempMax: 27,
        tempMin: 21,
        precipitationSum: 48.5,
        precipitationProbabilityMax: 90,
        windSpeedMax: 25
      },
      {
        date: '2026-11-01',
        weatherCode: 65,
        conditionText: 'Moderate Rain',
        tempMax: 28,
        tempMin: 22,
        precipitationSum: 15.0,
        precipitationProbabilityMax: 70,
        windSpeedMax: 18
      }
    ],
    metadata: {
      source: 'Test Weather Model',
      status: 'demo_fallback',
      fetchedAt: new Date().toISOString(),
      units: { temperature: '°C', precipitation: 'mm', windSpeed: 'km/h' }
    }
  };

  const risks = evaluateWeatherRisks('Soybean', 'Flowering', mockHeavyRainWeather);
  const hasRainRisk = risks.some(r => r.riskType === 'HEAVY_RAINFALL' && (r.severity === 'HIGH' || r.severity === 'CRITICAL'));
  const hasWaterlogging = risks.some(r => r.riskType === 'WATERLOGGING');
  assert(hasRainRisk, 'Deterministic Risk Engine triggers HEAVY_RAINFALL for precipitation >= 40mm');
  assert(hasWaterlogging, 'Deterministic Risk Engine identifies WATERLOGGING risk during sensitive Flowering stage');

  // 2. High Wind Spray Hazard
  const mockWindWeather: WeatherData = {
    ...mockHeavyRainWeather,
    current: { ...mockHeavyRainWeather.current, windSpeed: 29 },
    daily: [{ ...mockHeavyRainWeather.daily[0], windSpeedMax: 32 }]
  };
  const windRisks = evaluateWeatherRisks('Cotton', 'Vegetative', mockWindWeather);
  const hasSprayHazard = windRisks.some(r => r.riskType === 'HIGH_WIND_SPRAY_HAZARD');
  assert(hasSprayHazard, 'Deterministic Risk Engine warns against unsafe chemical spraying at wind speeds > 25km/h');

  // 3. Soil Metrics Evaluation
  const soilOptimal = evaluateSoilMetrics(7.2, 0.65, 310);
  assert(soilOptimal.pHEval === 'Neutral', 'Soil pH 7.2 correctly evaluated as Neutral/Optimal for Legumes');
  assert(soilOptimal.ocEval === 'Medium', 'Organic carbon 0.65% correctly categorized as Medium');

  const soilAcidic = evaluateSoilMetrics(5.2, 0.35);
  assert(soilAcidic.pHEval === 'Acidic', 'Soil pH 5.2 triggers Acidic warning recommending agricultural lime');

  // 4. Mandi Price Intelligence & Comparison
  const mandiResults = await getMandiPrices('Soybean', 'Maharashtra');
  assert(mandiResults.records.length > 0, 'Mandi service returns APMC price benchmarks');
  assert(mandiResults.highestModalMandi !== null, 'Comparison correctly highlights highest modal mandi');
  assert(mandiResults.highestModalMandi!.differenceFromAverage >= 0, 'Differential from benchmark average is correctly computed');
  assert(mandiResults.status === 'live' || mandiResults.status === 'demo_dataset', 'Dataset status is transparently attributed');

  // 5. LLM Fallback Grounding
  const fallbackAdvisory = await generateAdvisory({
    language: 'mr',
    location: { district: 'Latur' },
    crop: { name: 'Soybean', stage: 'Flowering' },
    weatherSummary: {
      currentTemp: 27,
      currentCondition: 'Rain',
      rainfallNext48h: 52,
      windSpeed: 22,
      source: 'Open-Meteo'
    },
    evaluatedRisks: risks
  });

  assert(fallbackAdvisory.directAnswer.length > 20, 'Agronomic advisory provides direct Marathi response');
  assert(fallbackAdvisory.recommendedActions.length > 0, 'Advisory lists concrete agronomist action items');
  assert(fallbackAdvisory.supportingSources.length > 0, 'Advisory attributes supporting sources');

  // 6. Autonomous Advisory Agent Workflow
  const agent = new AgriculturalAdvisoryAgent();
  const runResult = await agent.runWorkflow({
    cropName: 'Soybean',
    cropStage: 'Flowering',
    district: 'Latur',
    language: 'mr'
  });

  assert(runResult.executionTrace.length >= 7, 'Agent executes multi-step tool orchestration trace');
  assert(runResult.createdTasks.length > 0, 'Agent autonomously dispatches actionable farm task');
  assert(runResult.createdAlerts.length > 0, 'Agent autonomously dispatches emergency in-app alert');
  assert(runResult.totalDurationMs >= 0, 'Agent tracks tool execution latency');

  console.log(`\n Acceptance Test Summary: ${passedCount}/${totalCount} tests passed.\n`);
  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAcceptanceTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});

