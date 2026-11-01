import { fetchWeatherData, WeatherData } from '../services/weatherService.js';
import { fetchSoilData, SoilAnalysisResult } from '../services/soilService.js';
import { getMandiPrices, MandiComparisonResult } from '../services/mandiService.js';
import { evaluateWeatherRisks, EvaluatedRisk } from '../rules/riskEngine.js';
import { generateAdvisory, StructuredAdvisoryResponse } from '../services/llmService.js';
import { CROP_CALENDARS, memoryStore, DEMO_FARMER } from '../data/seedData.js';
import { FarmTask, Alert, Advisory } from '../models/index.js';

export interface AgentExecutionStep {
  stepNumber: number;
  toolName: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  input: any;
  output: any;
  executionTimeMs: number;
  timestamp: string;
}

export interface AgentRunResult {
  runId: string;
  farmerId: string;
  cropName: string;
  language: 'mr' | 'hi' | 'en';
  executionTrace: AgentExecutionStep[];
  advisory: StructuredAdvisoryResponse;
  createdTasks: any[];
  createdAlerts: any[];
  risksIdentified: EvaluatedRisk[];
  completedAt: string;
  totalDurationMs: number;
}

export class AgriculturalAdvisoryAgent {
  private trace: AgentExecutionStep[] = [];
  private startTime: number = Date.now();

  private async executeStep<T>(
    toolName: string,
    description: string,
    input: any,
    fn: () => Promise<T>
  ): Promise<T> {
    const stepNumber = this.trace.length + 1;
    const stepStart = Date.now();
    const timestamp = new Date().toISOString();

    const step: AgentExecutionStep = {
      stepNumber,
      toolName,
      description,
      status: 'RUNNING',
      input,
      output: null,
      executionTimeMs: 0,
      timestamp
    };

    try {
      const result = await fn();
      step.status = 'COMPLETED';
      step.output = result;
      step.executionTimeMs = Date.now() - stepStart;
      this.trace.push(step);
      return result;
    } catch (error: any) {
      step.status = 'FAILED';
      step.output = { error: error.message };
      step.executionTimeMs = Date.now() - stepStart;
      this.trace.push(step);
      throw error;
    }
  }

  // Tool 1: getWeatherForecast(location)
  async getWeatherForecast(lat: number, lon: number, locationName: string): Promise<WeatherData> {
    return this.executeStep(
      'getWeatherForecast',
      `Retrieving 7-day weather forecast and hourly precipitation radar for ${locationName}`,
      { lat, lon, locationName },
      () => fetchWeatherData(lat, lon, locationName)
    );
  }

  // Tool 2: getSoilInformation(location)
  async getSoilInformation(lat: number, lon: number): Promise<SoilAnalysisResult> {
    return this.executeStep(
      'getSoilInformation',
      `Querying soil parameters (pH, Organic Carbon, Nitrogen, Texture) for farm coordinates`,
      { lat, lon },
      () => fetchSoilData(lat, lon)
    );
  }

  // Tool 3: getMandiPrices(crop, district)
  async getMandiPrices(crop: string, state: string, district: string): Promise<MandiComparisonResult> {
    return this.executeStep(
      'getMandiPrices',
      `Fetching live AGMARKNET APMC prices and comparing modal benchmarks across mandis for ${crop}`,
      { crop, state, district },
      () => getMandiPrices(crop, state, district)
    );
  }

  // Tool 4: getCropProfile(crop)
  async getCropProfile(cropName: string) {
    return this.executeStep(
      'getCropProfile',
      `Loading agronomic profile and development stages for ${cropName}`,
      { cropName },
      async () => {
        const cal = CROP_CALENDARS[cropName] || CROP_CALENDARS['Soybean'];
        return {
          cropName: cal.cropName,
          optimalSeason: cal.optimalSeason,
          duration: `${cal.totalDurationDays} days`,
          stagesCount: cal.stages.length,
          stages: cal.stages.map(s => s.stage)
        };
      }
    );
  }

  // Tool 5: evaluateWeatherRisk(crop, cropStage, forecast)
  async evaluateWeatherRisk(crop: string, cropStage: string, weather: WeatherData): Promise<EvaluatedRisk[]> {
    return this.executeStep(
      'evaluateWeatherRisk',
      `Running deterministic screening rules for heavy rain, heat stress, wind speed, and waterlogging`,
      { crop, cropStage, weatherSource: weather.metadata.source },
      async () => evaluateWeatherRisks(crop, cropStage, weather)
    );
  }

  // Tool 6: generateCropSchedule(profile, cropCalendar)
  async generateCropSchedule(cropName: string, sowingDate: Date) {
    return this.executeStep(
      'generateCropSchedule',
      `Synthesizing dynamic crop calendar milestones based on sowing date (${sowingDate.toISOString().split('T')[0]})`,
      { cropName, sowingDate: sowingDate.toISOString() },
      async () => {
        const cal = CROP_CALENDARS[cropName] || CROP_CALENDARS['Soybean'];
        const sowingTime = sowingDate.getTime();
        return cal.stages.map(s => {
          const start = new Date(sowingTime + s.daysFromSowingStart * 24 * 60 * 60 * 1000);
          const end = new Date(sowingTime + s.daysFromSowingEnd * 24 * 60 * 60 * 1000);
          return {
            stage: s.stage,
            window: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
            activities: s.criticalActivities,
            weatherSensitivities: s.weatherSensitivities
          };
        });
      }
    );
  }

  // Tool 7: generatePersonalizedAdvisory(context)
  async generatePersonalizedAdvisory(context: any): Promise<StructuredAdvisoryResponse> {
    return this.executeStep(
      'generatePersonalizedAdvisory',
      `Formulating grounded multilingual agronomic advisory with validated actionable recommendations`,
      { language: context.language, crop: context.crop.name, risksCount: context.evaluatedRisks.length },
      () => generateAdvisory(context)
    );
  }

  // Tool 8: createFarmTask(userId, task)
  async createFarmTask(userId: string, farmId: string, taskData: any) {
    return this.executeStep(
      'createFarmTask',
      `Automating actionable farm task creation: "${taskData.title}"`,
      { userId, farmId, taskTitle: taskData.title, priority: taskData.priority },
      async () => {
        const newTask = {
          _id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          farmId,
          title: taskData.title,
          description: taskData.description,
          scheduledDate: taskData.scheduledDate || new Date(),
          priority: taskData.priority || 'MEDIUM',
          status: 'PENDING',
          source: 'AGENT_AUTO',
          createdAt: new Date()
        };

        // Persist to memory store
        memoryStore.tasks.unshift(newTask);

        // Also attempt Mongoose if connected
        try {
          await FarmTask.create(newTask);
        } catch (_) {}

        return newTask;
      }
    );
  }

  // Tool 9: createInAppAlert(userId, alert)
  async createInAppAlert(userId: string, farmId: string, alertData: any) {
    return this.executeStep(
      'createInAppAlert',
      `Dispatching high-priority farmer in-app alert: "${alertData.title}"`,
      { userId, farmId, severity: alertData.severity },
      async () => {
        const newAlert = {
          _id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          farmId,
          title: alertData.title,
          description: alertData.description,
          severity: alertData.severity || 'WARNING',
          relatedCrop: alertData.relatedCrop || 'Soybean',
          recommendedAction: alertData.recommendedAction,
          source: 'AgriSaarthi Advisory Agent Engine',
          isRead: false,
          createdAt: new Date()
        };

        // Persist to memory store
        memoryStore.alerts.unshift(newAlert);

        // Also attempt Mongoose if connected
        try {
          await Alert.create(newAlert);
        } catch (_) {}

        return newAlert;
      }
    );
  }

  // Master Orchestration Workflow
  async runWorkflow(params: {
    userId?: string;
    farmId?: string;
    farmerName?: string;
    language?: 'mr' | 'hi' | 'en';
    cropName?: string;
    cropStage?: string;
    sowingDate?: Date;
    district?: string;
    latitude?: number;
    longitude?: number;
    question?: string;
  }): Promise<AgentRunResult> {
    this.trace = [];
    this.startTime = Date.now();

    const userId = params.userId || DEMO_FARMER.user._id;
    const farmId = params.farmId || DEMO_FARMER.farm._id;
    const farmerName = params.farmerName || DEMO_FARMER.user.name;
    const language = params.language || 'mr';
    const cropName = params.cropName || 'Soybean';
    const cropStage = params.cropStage || 'Flowering';
    const sowingDate = params.sowingDate || DEMO_FARMER.crop.sowingDate;
    const district = params.district || 'Latur';
    const lat = params.latitude || 18.2500;
    const lon = params.longitude || 76.5000;

    // 1-4. Concurrent Tool Calls: Weather, Soil, Mandi, Crop Profile
    const [weather, soil, mandi, cropProfile] = await Promise.all([
      this.getWeatherForecast(lat, lon, `${district}, Maharashtra`),
      this.getSoilInformation(lat, lon),
      this.getMandiPrices(cropName, 'Maharashtra', district),
      this.getCropProfile(cropName)
    ]);

    // 5-6. Concurrent Tool Calls: Evaluate Weather Risk & Dynamic Schedule
    const [evaluatedRisks, schedule] = await Promise.all([
      this.evaluateWeatherRisk(cropName, cropStage, weather),
      this.generateCropSchedule(cropName, sowingDate)
    ]);

    // 7. Tool Call: Generate Personalized Advisory
    const precip48h = (weather.daily.slice(0, 2) || []).reduce((acc, curr) => acc + (curr.precipitationSum || 0), 0);
    const advisoryPayload = {
      farmerName,
      language,
      location: { district, taluka: 'Ausa', village: 'Belkund' },
      crop: { name: cropName, stage: cropStage },
      weatherSummary: {
        currentTemp: weather.current.temperature,
        currentCondition: weather.current.conditionText,
        rainfallNext48h: precip48h,
        windSpeed: weather.current.windSpeed,
        source: weather.metadata.source
      },
      soilSummary: {
        pH: soil.pH,
        organicCarbon: soil.organicCarbon,
        texture: soil.soilTexture,
        sourceType: soil.sourceType
      },
      mandiSummary: {
        commodity: cropName,
        currentModalPrice: mandi.averageModalPrice,
        bestMandi: mandi.highestModalMandi?.market || `${district} Mandi`,
        bestPrice: mandi.highestModalMandi?.modalPrice || 4580,
        mandiRecords: mandi.records.slice(0, 6).map(r => `${r.market} (${r.district}): Modal ₹${r.modalPrice}/Q (Min: ₹${r.minPrice}, Max: ₹${r.maxPrice}) on ${r.arrivalDate} [${r.source}]`),
        sourceNote: mandi.sourceNote,
        status: mandi.status
      },
      evaluatedRisks,
      question: params.question
    };

    const advisory = await this.generatePersonalizedAdvisory(advisoryPayload);

    // Persist Advisory to Store
    const savedAdvisory = {
      _id: `adv_${Date.now()}`,
      userId,
      farmId,
      language,
      question: params.question || 'Automated Comprehensive Advisory Run',
      response: advisory.directAnswer,
      structuredAdvice: advisory,
      riskLevel: advisory.riskLevel,
      supportingSources: advisory.supportingSources,
      createdAt: new Date()
    };
    memoryStore.advisories.unshift(savedAdvisory);
    try {
      await Advisory.create(savedAdvisory);
    } catch (_) {}

    // 8. Tool Call: Automatically create Farm Task based on risks
    const createdTasks: any[] = [];
    const highestRisk = evaluatedRisks[0];
    if (highestRisk && highestRisk.recommendedActions && highestRisk.recommendedActions.length > 0) {
      const task = await this.createFarmTask(userId, farmId, {
        title: highestRisk.recommendedActions[0],
        description: `${highestRisk.reason}. Prioritized action for ${cropName} (${cropStage} stage).`,
        priority: highestRisk.severity === 'HIGH' || highestRisk.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        scheduledDate: new Date()
      });
      createdTasks.push(task);
    }

    // 9. Tool Call: Dispatch In-App Alert
    const createdAlerts: any[] = [];
    if (highestRisk && (highestRisk.severity === 'HIGH' || highestRisk.severity === 'CRITICAL')) {
      const alert = await this.createInAppAlert(userId, farmId, {
        title: language === 'mr' ? `सावधान: ${cropName} पिकासाठी हवामान जोखीम` : `Weather Advisory: ${cropName} Risk`,
        description: highestRisk.reason,
        severity: highestRisk.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        relatedCrop: cropName,
        recommendedAction: highestRisk.recommendedActions[0]
      });
      createdAlerts.push(alert);
    }

    const totalDurationMs = Date.now() - this.startTime;

    return {
      runId: `run_${Date.now()}`,
      farmerId: userId,
      cropName,
      language,
      executionTrace: this.trace,
      advisory,
      createdTasks,
      createdAlerts,
      risksIdentified: evaluatedRisks,
      completedAt: new Date().toISOString(),
      totalDurationMs
    };
  }
}
