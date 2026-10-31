import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// 1. User Model
// ==========================================
export interface IUser extends Document {
  name: string;
  emailOrMobile: string;
  passwordHash: string;
  preferredLanguage: 'mr' | 'hi' | 'en';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  emailOrMobile: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  preferredLanguage: { type: String, enum: ['mr', 'hi', 'en'], default: 'mr' },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);

// ==========================================
// 2. FarmProfile Model
// ==========================================
export interface IFarmProfile extends Document {
  userId: mongoose.Types.ObjectId | string;
  farmName: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  latitude?: number;
  longitude?: number;
  area: number;
  areaUnit: 'Acre' | 'Hectare' | 'Guntha';
  soilType?: string;
  irrigationType: 'Drip' | 'Sprinkler' | 'Flood' | 'Rainfed' | 'None';
  createdAt: Date;
}

const FarmProfileSchema = new Schema<IFarmProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmName: { type: String, default: 'My Farm' },
  state: { type: String, required: true, default: 'Maharashtra' },
  district: { type: String, required: true },
  taluka: { type: String, required: true },
  village: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  area: { type: Number, required: true, default: 2.5 },
  areaUnit: { type: String, enum: ['Acre', 'Hectare', 'Guntha'], default: 'Acre' },
  soilType: { type: String, default: 'Medium Black (Madhyam Kali)' },
  irrigationType: { type: String, enum: ['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'None'], default: 'Rainfed' },
  createdAt: { type: Date, default: Date.now },
});

export const FarmProfile = mongoose.model<IFarmProfile>('FarmProfile', FarmProfileSchema);

// ==========================================
// 3. Crop Model
// ==========================================
export interface ICrop extends Document {
  farmId: mongoose.Types.ObjectId | string;
  cropName: string;
  variety?: string;
  sowingDate: Date;
  cropStage: 'Land Preparation' | 'Sowing' | 'Germination' | 'Vegetative' | 'Flowering' | 'Pod/Grain Development' | 'Harvesting' | 'Post-Harvest';
  farmArea: number;
  status: 'Active' | 'Harvested' | 'Planned';
  createdAt: Date;
}

const CropSchema = new Schema<ICrop>({
  farmId: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true, index: true },
  cropName: { type: String, required: true },
  variety: { type: String },
  sowingDate: { type: Date, required: true },
  cropStage: { 
    type: String, 
    enum: ['Land Preparation', 'Sowing', 'Germination', 'Vegetative', 'Flowering', 'Pod/Grain Development', 'Harvesting', 'Post-Harvest'],
    default: 'Flowering'
  },
  farmArea: { type: Number, default: 2.0 },
  status: { type: String, enum: ['Active', 'Harvested', 'Planned'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
});

export const Crop = mongoose.model<ICrop>('Crop', CropSchema);

// ==========================================
// 4. SoilRecord Model
// ==========================================
export interface ISoilRecord extends Document {
  farmId: mongoose.Types.ObjectId | string;
  pH: number;
  nitrogen?: number; // kg/ha or rating
  phosphorus?: number;
  potassium?: number;
  organicCarbon: number; // %
  soilTexture?: string;
  sourceType: 'Farmer Manual Test' | 'ISRIC SoilGrids Estimate' | 'Demo Seed';
  source: string;
  measuredAt?: Date;
  fetchedAt: Date;
}

const SoilRecordSchema = new Schema<ISoilRecord>({
  farmId: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true, index: true },
  pH: { type: Number, required: true },
  nitrogen: { type: Number },
  phosphorus: { type: Number },
  potassium: { type: Number },
  organicCarbon: { type: Number, required: true },
  soilTexture: { type: String },
  sourceType: { type: String, enum: ['Farmer Manual Test', 'ISRIC SoilGrids Estimate', 'Demo Seed'], required: true },
  source: { type: String, required: true },
  measuredAt: { type: Date },
  fetchedAt: { type: Date, default: Date.now },
});

export const SoilRecord = mongoose.model<ISoilRecord>('SoilRecord', SoilRecordSchema);

// ==========================================
// 5. WeatherSnapshot Model
// ==========================================
export interface IWeatherSnapshot extends Document {
  farmId: mongoose.Types.ObjectId | string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  forecastData: any;
  source: string;
  fetchedAt: Date;
}

const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>({
  farmId: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  forecastData: { type: Schema.Types.Mixed, required: true },
  source: { type: String, default: 'Open-Meteo' },
  fetchedAt: { type: Date, default: Date.now },
});

export const WeatherSnapshot = mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema);

// ==========================================
// 6. MandiPrice Model
// ==========================================
export interface IMandiPrice extends Document {
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
  isDemo?: boolean;
  fetchedAt: Date;
}

const MandiPriceSchema = new Schema<IMandiPrice>({
  commodity: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  market: { type: String, required: true },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  modalPrice: { type: Number, required: true },
  unit: { type: String, default: 'Rs/Quintal' },
  arrivalDate: { type: String, required: true },
  source: { type: String, default: 'data.gov.in AGMARKNET' },
  isDemo: { type: Boolean, default: false },
  fetchedAt: { type: Date, default: Date.now },
});

export const MandiPrice = mongoose.model<IMandiPrice>('MandiPrice', MandiPriceSchema);

// ==========================================
// 7. Advisory Model
// ==========================================
export interface IAdvisory extends Document {
  userId: mongoose.Types.ObjectId | string;
  farmId: mongoose.Types.ObjectId | string;
  cropId?: mongoose.Types.ObjectId | string;
  language: 'mr' | 'hi' | 'en';
  question: string;
  response: string;
  structuredAdvice?: {
    directAnswer: string;
    relevantDataUsed: string[];
    identifiedRisk: string;
    recommendedActions: string[];
    timeline: string;
    whatToAvoid: string[];
    uncertaintyLimitations: string;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  supportingSources: string[];
  createdAt: Date;
}

const AdvisorySchema = new Schema<IAdvisory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmId: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
  language: { type: String, enum: ['mr', 'hi', 'en'], default: 'mr' },
  question: { type: String, required: true },
  response: { type: String, required: true },
  structuredAdvice: { type: Schema.Types.Mixed },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
  supportingSources: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const Advisory = mongoose.model<IAdvisory>('Advisory', AdvisorySchema);

// ==========================================
// 8. FarmTask Model
// ==========================================
export interface IFarmTask extends Document {
  userId: mongoose.Types.ObjectId | string;
  farmId: mongoose.Types.ObjectId | string;
  cropId?: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  scheduledDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  source: 'AGENT_AUTO' | 'FARMER_MANUAL' | 'CROP_CALENDAR';
  createdAt: Date;
}

const FarmTaskSchema = new Schema<IFarmTask>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmId: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
  cropId: { type: Schema.Types.ObjectId, ref: 'Crop' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  scheduledDate: { type: Date, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  source: { type: String, enum: ['AGENT_AUTO', 'FARMER_MANUAL', 'CROP_CALENDAR'], default: 'FARMER_MANUAL' },
  createdAt: { type: Date, default: Date.now },
});

export const FarmTask = mongoose.model<IFarmTask>('FarmTask', FarmTaskSchema);

// ==========================================
// 9. Alert Model
// ==========================================
export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId | string;
  farmId: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  relatedCrop?: string;
  recommendedAction?: string;
  source: string;
  isRead: boolean;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  farmId: { type: Schema.Types.ObjectId, ref: 'FarmProfile', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
  relatedCrop: { type: String },
  recommendedAction: { type: String },
  source: { type: String, default: 'AgriSaarthi Engine' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

// ==========================================
// 10. ChatMessage Model
// ==========================================
export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId | string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: 'mr' | 'hi' | 'en';
  structuredAdvice?: any;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conversationId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  language: { type: String, enum: ['mr', 'hi', 'en'], default: 'mr' },
  structuredAdvice: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
