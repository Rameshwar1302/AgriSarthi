export type Language = 'mr' | 'hi' | 'en';

export interface UserProfile {
  id: string;
  name: string;
  emailOrMobile: string;
  preferredLanguage: Language;
}

export interface FarmDetails {
  id: string;
  name: string;
  location: string;
  area: string;
  soilType?: string;
  irrigationType: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface CropDetails {
  id: string;
  name: string;
  variety?: string;
  stage: string;
  sowingDate: string;
}

export interface WeatherData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    conditionText: string;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    precipitationProbability: number;
    precipitation: number;
    windSpeed: number;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    conditionText: string;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    precipitationProbabilityMax: number;
    windSpeedMax: number;
  }>;
  metadata: {
    source: string;
    status: 'live' | 'cached' | 'demo_fallback';
    fetchedAt: string;
    units: {
      temperature: string;
      precipitation: string;
      windSpeed: string;
    };
  };
}

export interface EvaluatedRisk {
  riskType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  crop: string;
  cropStage: string;
  reason: string;
  recommendedActions: string[];
  whatToAvoid: string[];
  source: string;
  generatedAt: string;
}

export interface MandiRecord {
  commodity: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrivalDate: string;
  source: string;
  isDemo: boolean;
}

export interface MandiComparisonResult {
  commodity: string;
  records: MandiRecord[];
  highestModalMandi: {
    market: string;
    district: string;
    modalPrice: number;
    differenceFromAverage: number;
  } | null;
  lowestModalMandi: {
    market: string;
    district: string;
    modalPrice: number;
  } | null;
  averageModalPrice: number;
  historicalTrends: Array<{ date: string; modalPrice: number; minPrice: number; maxPrice: number }>;
  sourceNote: string;
  status: 'live' | 'cached' | 'demo_dataset';
}

export interface SoilData {
  pH: number;
  pHEvaluation: 'Acidic' | 'Neutral' | 'Slightly Alkaline' | 'Strongly Alkaline';
  organicCarbon: number;
  organicCarbonEvaluation: 'Low' | 'Medium' | 'High';
  nitrogen?: number;
  nitrogenEvaluation?: 'Low' | 'Medium' | 'High';
  phosphorus?: number;
  potassium?: number;
  soilTexture: string;
  sourceType: string;
  source: string;
  measuredAt?: string;
  fetchedAt: string;
  agronomicInsights: string[];
  disclaimer: string;
}

export interface FarmTask {
  _id: string;
  userId: string;
  farmId: string;
  title: string;
  description: string;
  scheduledDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  source: 'AGENT_AUTO' | 'FARMER_MANUAL' | 'CROP_CALENDAR';
  createdAt: string;
}

export interface AlertNotification {
  _id: string;
  userId: string;
  farmId: string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  relatedCrop?: string;
  recommendedAction?: string;
  source: string;
  isRead: boolean;
  createdAt: string;
}

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

export interface StructuredAdvisory {
  directAnswer: string;
  relevantDataUsed: string[];
  identifiedRisk: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  timeline: string;
  whatToAvoid: string[];
  mandiAdvisory?: string;
  uncertaintyLimitations: string;
  supportingSources: string[];
}

export interface DashboardData {
  hasFarm?: boolean;
  greeting: string;
  language: Language;
  farmer: UserProfile;
  farm?: FarmDetails | null;
  crop?: CropDetails | null;
  weather?: WeatherData | null;
  weatherRisks?: EvaluatedRisk[];
  mandiPrices?: MandiComparisonResult | null;
  soil?: SoilData | null;
  tasks: FarmTask[];
  alerts: AlertNotification[];
  timestamp: string;
  isCached?: boolean;
}

