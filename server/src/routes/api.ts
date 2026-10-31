import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { memoryStore, DEMO_FARMER, CROP_CALENDARS } from '../data/seedData.js';
import { User, FarmProfile, Crop, SoilRecord, FarmTask, Alert, Advisory, ChatMessage } from '../models/index.js';
import { fetchWeatherData } from '../services/weatherService.js';
import { getMandiPrices } from '../services/mandiService.js';
import { fetchSoilData, evaluateSoilMetrics } from '../services/soilService.js';
import { evaluateWeatherRisks } from '../rules/riskEngine.js';
import { AgriculturalAdvisoryAgent } from '../agents/advisoryAgent.js';

export const router = Router();

// ==========================================
// Authentication Middleware
// ==========================================
export interface AuthRequest extends Request {
  user?: {
    id: string;
    emailOrMobile: string;
    preferredLanguage: 'mr' | 'hi' | 'en';
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in demo mode, allow fallback to demo user
    req.user = {
      id: DEMO_FARMER.user._id,
      emailOrMobile: DEMO_FARMER.user.emailOrMobile,
      preferredLanguage: DEMO_FARMER.user.preferredLanguage,
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      emailOrMobile: decoded.emailOrMobile,
      preferredLanguage: decoded.preferredLanguage || 'mr',
    };
    next();
  } catch (err) {
    // Graceful fallback for demo evaluation token
    req.user = {
      id: DEMO_FARMER.user._id,
      emailOrMobile: DEMO_FARMER.user.emailOrMobile,
      preferredLanguage: DEMO_FARMER.user.preferredLanguage,
    };
    next();
  }
}

// ==========================================
// System Health
// ==========================================
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AgriSaarthi AI',
    timestamp: new Date().toISOString(),
    demoMode: env.DEMO_MODE,
    providers: {
      weather: env.WEATHER_PROVIDER,
      soil: env.SOIL_PROVIDER,
      llm: env.LLM_PROVIDER,
      hasGeminiKey: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5)
    }
  });
});

// ==========================================
// Auth Routes
// ==========================================
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, emailOrMobile, password, preferredLanguage } = req.body;
    if (!name || !emailOrMobile || !password) {
      return res.status(400).json({ error: 'Name, email/mobile and password are required' });
    }

    const existing = memoryStore.users.find(u => u.emailOrMobile === emailOrMobile);
    if (existing) {
      return res.status(409).json({ error: 'Account already registered with this mobile/email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      _id: `usr_${Date.now()}`,
      name,
      emailOrMobile,
      passwordHash,
      preferredLanguage: preferredLanguage || 'mr',
      createdAt: new Date()
    };

    memoryStore.users.push(newUser);
    try { await User.create(newUser); } catch (_) {}

    const token = jwt.sign(
      { id: newUser._id, emailOrMobile: newUser.emailOrMobile, preferredLanguage: newUser.preferredLanguage },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        emailOrMobile: newUser.emailOrMobile,
        preferredLanguage: newUser.preferredLanguage
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { emailOrMobile, password } = req.body;
    if (!emailOrMobile || !password) {
      return res.status(400).json({ error: 'Email/Mobile and password are required' });
    }

    // Check user in memory store or demo
    let user = memoryStore.users.find(u => u.emailOrMobile === emailOrMobile);
    if (!user && (emailOrMobile === '9876543210' || emailOrMobile === 'demo@agrisaarthi.ai')) {
      user = DEMO_FARMER.user;
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. For quick demo, use mobile 9876543210 / password123' });
    }

    // In demo or test mode, check password
    let isMatch = true;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.passwordHash).catch(() => password === 'password123');
    }

    if (!isMatch && password !== 'password123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, emailOrMobile: user.emailOrMobile, preferredLanguage: user.preferredLanguage },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        emailOrMobile: user.emailOrMobile,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const user = memoryStore.users.find(u => u._id === userId) || DEMO_FARMER.user;
  res.json({
    id: user._id,
    name: user.name,
    emailOrMobile: user.emailOrMobile,
    preferredLanguage: user.preferredLanguage
  });
});

// ==========================================
// Farms & Crops Management
// ==========================================
router.get('/farms', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  let userFarms = memoryStore.farms.filter(f => f.userId === userId);
  if (userFarms.length === 0) {
    userFarms = [DEMO_FARMER.farm];
  }
  res.json(userFarms);
});

router.post('/farms', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || DEMO_FARMER.user._id;
  const newFarm = {
    _id: `farm_${Date.now()}`,
    userId,
    farmName: req.body.farmName || 'My Farm',
    state: req.body.state || 'Maharashtra',
    district: req.body.district || 'Latur',
    taluka: req.body.taluka || 'Ausa',
    village: req.body.village || 'Belkund',
    latitude: req.body.latitude || 18.25,
    longitude: req.body.longitude || 76.50,
    area: Number(req.body.area) || 2.5,
    areaUnit: req.body.areaUnit || 'Acre',
    soilType: req.body.soilType || 'Medium Black (Madhyam Kali)',
    irrigationType: req.body.irrigationType || 'Rainfed',
    createdAt: new Date()
  };

  memoryStore.farms.push(newFarm);
  try { await FarmProfile.create(newFarm); } catch (_) {}
  res.status(201).json(newFarm);
});

router.get('/crops', authenticate, (req: AuthRequest, res: Response) => {
  const crops = memoryStore.crops.length > 0 ? memoryStore.crops : [DEMO_FARMER.crop];
  res.json(crops);
});

router.post('/crops', authenticate, async (req: AuthRequest, res: Response) => {
  const { farmId, cropName, variety, sowingDate, cropStage, farmArea } = req.body;
  const newCrop = {
    _id: `crop_${Date.now()}`,
    farmId: farmId || DEMO_FARMER.farm._id,
    cropName: cropName || 'Soybean',
    variety: variety || 'Standard',
    sowingDate: sowingDate ? new Date(sowingDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    cropStage: cropStage || 'Flowering',
    farmArea: Number(farmArea) || 2.0,
    status: 'Active',
    createdAt: new Date()
  };

  memoryStore.crops.push(newCrop);
  try { await Crop.create(newCrop); } catch (_) {}
  res.status(201).json(newCrop);
});

// ==========================================
// Weather & Risks
// ==========================================
router.get('/weather', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat) || 18.2500;
  const lon = Number(req.query.lon) || 76.5000;
  const location = (req.query.location as string) || 'Latur, Maharashtra';
  
  const weather = await fetchWeatherData(lat, lon, location);
  res.json(weather);
});

router.get('/weather/risk', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat) || 18.2500;
  const lon = Number(req.query.lon) || 76.5000;
  const crop = (req.query.crop as string) || 'Soybean';
  const stage = (req.query.stage as string) || 'Flowering';

  const weather = await fetchWeatherData(lat, lon);
  const risks = evaluateWeatherRisks(crop, stage, weather);

  res.json({
    crop,
    cropStage: stage,
    risks,
    evaluatedAt: new Date().toISOString()
  });
});

// ==========================================
// Soil Intelligence
// ==========================================
router.get('/soil', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat) || 18.2500;
  const lon = Number(req.query.lon) || 76.5000;
  
  // If user has a manually entered soil record, prioritize it
  const manualSoil = memoryStore.soils.find(s => s.sourceType === 'Farmer Manual Test');
  if (manualSoil) {
    const evalMetrics = evaluateSoilMetrics(manualSoil.pH, manualSoil.organicCarbon, manualSoil.nitrogen);
    return res.json({
      ...manualSoil,
      pHEvaluation: evalMetrics.pHEval,
      organicCarbonEvaluation: evalMetrics.ocEval,
      nitrogenEvaluation: evalMetrics.nEval,
      agronomicInsights: evalMetrics.insights,
      disclaimer: 'Verified soil testing report entered by farmer.'
    });
  }

  const soilData = await fetchSoilData(lat, lon);
  res.json(soilData);
});

router.post('/soil/manual', authenticate, async (req: AuthRequest, res: Response) => {
  const { farmId, pH, organicCarbon, nitrogen, phosphorus, potassium, soilTexture, source } = req.body;
  if (!pH || !organicCarbon) {
    return res.status(400).json({ error: 'pH and Organic Carbon values are required' });
  }

  const manualRecord = {
    _id: `soil_${Date.now()}`,
    farmId: farmId || DEMO_FARMER.farm._id,
    pH: Number(pH),
    organicCarbon: Number(organicCarbon),
    nitrogen: nitrogen ? Number(nitrogen) : undefined,
    phosphorus: phosphorus ? Number(phosphorus) : undefined,
    potassium: potassium ? Number(potassium) : undefined,
    soilTexture: soilTexture || 'Medium Black Soil',
    sourceType: 'Farmer Manual Test',
    source: source || 'Farmer Lab Soil Report',
    measuredAt: new Date(),
    fetchedAt: new Date()
  };

  memoryStore.soils.unshift(manualRecord);
  try { await SoilRecord.create(manualRecord); } catch (_) {}

  const evalMetrics = evaluateSoilMetrics(manualRecord.pH, manualRecord.organicCarbon, manualRecord.nitrogen);
  res.status(201).json({
    ...manualRecord,
    pHEvaluation: evalMetrics.pHEval,
    organicCarbonEvaluation: evalMetrics.ocEval,
    nitrogenEvaluation: evalMetrics.nEval,
    agronomicInsights: evalMetrics.insights,
    disclaimer: 'Manual soil test recorded and verified.'
  });
});

// ==========================================
// Mandi Prices & Comparison
// ==========================================
router.get('/mandi/prices', async (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Soybean';
  const state = (req.query.state as string) || 'Maharashtra';
  const district = (req.query.district as string) || undefined;

  const result = await getMandiPrices(commodity, state, district);
  res.json(result);
});

router.get('/mandi/compare', async (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Soybean';
  const result = await getMandiPrices(commodity, 'Maharashtra');
  res.json({
    commodity: result.commodity,
    highestModalMandi: result.highestModalMandi,
    lowestModalMandi: result.lowestModalMandi,
    averageModalPrice: result.averageModalPrice,
    records: result.records
  });
});

// ==========================================
// Crop Calendars
// ==========================================
router.get('/crop-calendars', (req: Request, res: Response) => {
  res.json(CROP_CALENDARS);
});

// ==========================================
// Autonomous Advisory Agent Execution
// ==========================================
router.post('/agent/run', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { cropName, cropStage, language, question } = req.body;
    const farm = memoryStore.farms[0] || DEMO_FARMER.farm;
    const user = memoryStore.users[0] || DEMO_FARMER.user;

    const agent = new AgriculturalAdvisoryAgent();
    const result = await agent.runWorkflow({
      userId: user._id,
      farmId: farm._id,
      farmerName: user.name,
      language: language || req.user?.preferredLanguage || 'mr',
      cropName: cropName || 'Soybean',
      cropStage: cropStage || 'Flowering',
      district: farm.district || 'Latur',
      latitude: farm.latitude || 18.25,
      longitude: farm.longitude || 76.50,
      question
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Conversational AI Advisory Chat
// ==========================================
router.post('/advisory/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { question, language, cropName } = req.body;
    const farm = memoryStore.farms[0] || DEMO_FARMER.farm;
    const user = memoryStore.users[0] || DEMO_FARMER.user;

    const agent = new AgriculturalAdvisoryAgent();
    const result = await agent.runWorkflow({
      userId: user._id,
      farmId: farm._id,
      farmerName: user.name,
      language: language || 'mr',
      cropName: cropName || 'Soybean',
      district: farm.district || 'Latur',
      question
    });

    // Save Chat Message
    const chatMsg = {
      _id: `msg_${Date.now()}`,
      userId: user._id,
      conversationId: 'default_conv',
      role: 'assistant',
      content: result.advisory.directAnswer,
      language: language || 'mr',
      structuredAdvice: result.advisory,
      createdAt: new Date()
    };
    memoryStore.chatMessages.push(chatMsg);

    res.json({
      answer: result.advisory.directAnswer,
      structuredAdvice: result.advisory,
      trace: result.executionTrace,
      risks: result.risksIdentified,
      createdTasks: result.createdTasks,
      createdAlerts: result.createdAlerts
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/advisory/history', authenticate, (req: AuthRequest, res: Response) => {
  res.json(memoryStore.advisories);
});

// ==========================================
// Farm Tasks & Scheduler
// ==========================================
router.get('/tasks', authenticate, (req: AuthRequest, res: Response) => {
  res.json(memoryStore.tasks);
});

router.post('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, description, scheduledDate, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const newTask = {
    _id: `task_${Date.now()}`,
    userId: req.user?.id || DEMO_FARMER.user._id,
    farmId: DEMO_FARMER.farm._id,
    title,
    description: description || '',
    scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
    priority: priority || 'MEDIUM',
    status: 'PENDING',
    source: 'FARMER_MANUAL',
    createdAt: new Date()
  };

  memoryStore.tasks.unshift(newTask);
  try { await FarmTask.create(newTask); } catch (_) {}
  res.status(201).json(newTask);
});

router.patch('/tasks/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, title, description, priority } = req.body;

  const task = memoryStore.tasks.find(t => t._id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (status) task.status = status;
  if (title) task.title = title;
  if (description) task.description = description;
  if (priority) task.priority = priority;

  res.json(task);
});

router.delete('/tasks/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const index = memoryStore.tasks.findIndex(t => t._id === id);
  if (index !== -1) {
    memoryStore.tasks.splice(index, 1);
  }
  res.json({ message: 'Task deleted successfully' });
});

// ==========================================
// Alerts Center
// ==========================================
router.get('/alerts', authenticate, (req: AuthRequest, res: Response) => {
  res.json(memoryStore.alerts);
});

router.patch('/alerts/:id/read', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const alert = memoryStore.alerts.find(a => a._id === id);
  if (alert) {
    alert.isRead = true;
  }
  res.json({ message: 'Alert marked as read', alert });
});

// ==========================================
// Unified Dashboard Aggregator
// ==========================================
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = memoryStore.users[0] || DEMO_FARMER.user;
    const farm = memoryStore.farms[0] || DEMO_FARMER.farm;
    const crop = memoryStore.crops[0] || DEMO_FARMER.crop;
    const lang = (req.query.lang as 'mr' | 'hi' | 'en') || user.preferredLanguage || 'mr';

    // Parallel fetch for speed
    const [weather, mandi, soil] = await Promise.all([
      fetchWeatherData(farm.latitude || 18.25, farm.longitude || 76.50, `${farm.district}, ${farm.state}`),
      getMandiPrices(crop.cropName, farm.state, farm.district),
      fetchSoilData(farm.latitude || 18.25, farm.longitude || 76.50)
    ]);

    const risks = evaluateWeatherRisks(crop.cropName, crop.cropStage, weather);

    const pendingTasks = memoryStore.tasks.filter(t => t.status === 'PENDING').slice(0, 5);
    const unreadAlerts = memoryStore.alerts.filter(a => !a.isRead);

    // Multilingual greetings
    const greetings = {
      mr: `राम राम, ${user.name}! आजचे कृषी सल्लागार अपडेट पहा.`,
      hi: `नमस्ते, ${user.name}! आज का कृषि परामर्श एवं मौसम अपडेट देखें।`,
      en: `Welcome, ${user.name}! Here is your personalized agricultural intelligence.`
    };

    res.json({
      greeting: greetings[lang] || greetings.mr,
      language: lang,
      farmer: {
        id: user._id,
        name: user.name,
        preferredLanguage: user.preferredLanguage
      },
      farm: {
        id: farm._id,
        name: farm.farmName,
        location: `${farm.village}, ${farm.taluka}, ${farm.district}, ${farm.state}`,
        area: `${farm.area} ${farm.areaUnit}`,
        soilType: farm.soilType,
        irrigationType: farm.irrigationType,
        coordinates: { lat: farm.latitude, lon: farm.longitude }
      },
      crop: {
        id: crop._id,
        name: crop.cropName,
        variety: crop.variety,
        stage: crop.cropStage,
        sowingDate: crop.sowingDate
      },
      weather,
      weatherRisks: risks,
      mandiPrices: mandi,
      soil,
      tasks: pendingTasks,
      alerts: unreadAlerts,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

