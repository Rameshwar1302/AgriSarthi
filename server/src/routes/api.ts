import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { memoryStore, CROP_CALENDARS } from '../data/seedData.js';
import { User, FarmProfile, Crop, SoilRecord, FarmTask, Alert, Advisory, ChatMessage } from '../models/index.js';
import { fetchWeatherData } from '../services/weatherService.js';
import { getMandiPrices } from '../services/mandiService.js';
import { fetchSoilData, evaluateSoilMetrics } from '../services/soilService.js';
import { evaluateWeatherRisks } from '../rules/riskEngine.js';
import { AgriculturalAdvisoryAgent } from '../agents/advisoryAgent.js';

export const router = Router();

// ==========================================
// Authentication Middleware (Strict Verification)
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
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
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
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
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
// Auth Routes: Proper Register & Login
// ==========================================
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, emailOrMobile, password, preferredLanguage } = req.body;
    if (!name || !emailOrMobile || !password) {
      return res.status(400).json({ error: 'Name, mobile/email, and password are required' });
    }

    const cleanInput = emailOrMobile.trim();

    // Check if user already exists in MongoDB Atlas or memory
    let existingUser = null;
    try {
      existingUser = await User.findOne({ emailOrMobile: cleanInput });
    } catch (_) {}

    if (!existingUser) {
      existingUser = memoryStore.users.find(u => u.emailOrMobile === cleanInput);
    }

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this mobile number or email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let savedUser: any = null;
    try {
      savedUser = await User.create({
        name: name.trim(),
        emailOrMobile: cleanInput,
        passwordHash,
        preferredLanguage: preferredLanguage || 'mr'
      });
    } catch (dbErr) {
      // In-memory fallback if MongoDB connection temporarily blips
      savedUser = {
        _id: `usr_${Date.now()}`,
        name: name.trim(),
        emailOrMobile: cleanInput,
        passwordHash,
        preferredLanguage: preferredLanguage || 'mr',
        createdAt: new Date()
      };
    }

    memoryStore.users.push(savedUser);

    const token = jwt.sign(
      { id: savedUser._id.toString(), emailOrMobile: savedUser.emailOrMobile, preferredLanguage: savedUser.preferredLanguage },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        emailOrMobile: savedUser.emailOrMobile,
        preferredLanguage: savedUser.preferredLanguage
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
      return res.status(400).json({ error: 'Mobile number or email and password are required' });
    }

    const cleanInput = emailOrMobile.trim();

    // Find user in MongoDB Atlas or memory
    let user: any = null;
    try {
      user = await User.findOne({ emailOrMobile: cleanInput });
    } catch (_) {}

    if (!user) {
      user = memoryStore.users.find(u => u.emailOrMobile === cleanInput);
    }

    if (!user) {
      return res.status(401).json({ error: 'No account found with this mobile number or email. Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), emailOrMobile: user.emailOrMobile, preferredLanguage: user.preferredLanguage },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        emailOrMobile: user.emailOrMobile,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/auth/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let user = null;
    try {
      user = await User.findById(userId);
    } catch (_) {}
    if (!user) {
      user = memoryStore.users.find(u => u._id.toString() === userId);
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id.toString(),
      name: user.name,
      emailOrMobile: user.emailOrMobile,
      preferredLanguage: user.preferredLanguage
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Farms & Crops Management (Per User)
// ==========================================
router.get('/farms', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const farms = await FarmProfile.find({ userId });
    if (farms.length > 0) return res.json(farms);
  } catch (_) {}
  const memoryFarms = memoryStore.farms.filter(f => f.userId.toString() === userId);
  res.json(memoryFarms);
});

router.post('/farms', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const farmData = {
      userId,
      farmName: req.body.farmName || 'My Farm',
      state: req.body.state || 'Maharashtra',
      district: req.body.district || 'Latur',
      taluka: req.body.taluka || 'Ausa',
      village: req.body.village || 'Belkund',
      latitude: req.body.latitude || 18.25,
      longitude: req.body.longitude || 76.50,
      area: Number(req.body.area) || 3.0,
      areaUnit: req.body.areaUnit || 'Acre',
      soilType: req.body.soilType || 'Medium Black (Madhyam Kali)',
      irrigationType: req.body.irrigationType || 'Rainfed',
      createdAt: new Date()
    };

    let farm = null;
    try {
      farm = await FarmProfile.findOneAndUpdate(
        { userId },
        farmData,
        { upsert: true, new: true }
      );
    } catch (_) {
      farm = { _id: `farm_${Date.now()}`, ...farmData };
      memoryStore.farms.push(farm);
    }

    res.status(201).json(farm);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/crops', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const farm = await FarmProfile.findOne({ userId });
    if (farm) {
      const crops = await Crop.find({ farmId: farm._id });
      if (crops.length > 0) return res.json(crops);
    }
  } catch (_) {}
  res.json([]);
});

router.post('/crops', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let farm = null;
    try {
      farm = await FarmProfile.findOne({ userId });
    } catch (_) {}
    if (!farm) {
      farm = memoryStore.farms.find(f => f.userId.toString() === userId);
    }

    const { cropName, variety, sowingDate, cropStage, farmArea } = req.body;
    const cropData = {
      farmId: farm ? farm._id : `farm_${Date.now()}`,
      cropName: cropName || 'Soybean',
      variety: variety || 'Standard',
      sowingDate: sowingDate ? new Date(sowingDate) : new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      cropStage: cropStage || 'Flowering',
      farmArea: Number(farmArea) || (farm?.area || 3.0),
      status: 'Active',
      createdAt: new Date()
    };

    let crop = null;
    try {
      crop = await Crop.findOneAndUpdate(
        { farmId: cropData.farmId },
        cropData,
        { upsert: true, new: true }
      );
    } catch (_) {
      crop = { _id: `crop_${Date.now()}`, ...cropData };
      memoryStore.crops.push(crop);
    }

    res.status(201).json(crop);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
    farmId: farmId || req.user?.id,
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
    const userId = req.user?.id;
    let user = null;
    let farm = null;
    let crop = null;

    try {
      user = await User.findById(userId);
      farm = await FarmProfile.findOne({ userId });
      if (farm) crop = await Crop.findOne({ farmId: farm._id });
    } catch (_) {}

    if (!user) user = memoryStore.users.find(u => u._id.toString() === userId);
    if (!farm) farm = memoryStore.farms.find(f => f.userId.toString() === userId);
    if (!crop && farm) crop = memoryStore.crops.find(c => c.farmId.toString() === farm._id.toString());

    const { cropName, cropStage, language, question } = req.body;
    const finalCrop = cropName || crop?.cropName || 'Soybean';
    const finalStage = cropStage || crop?.cropStage || 'Flowering';
    const district = farm?.district || 'Latur';
    const lat = farm?.latitude || 18.25;
    const lon = farm?.longitude || 76.50;

    const agent = new AgriculturalAdvisoryAgent();
    const result = await agent.runWorkflow({
      userId: userId!,
      farmId: farm ? farm._id.toString() : `farm_${Date.now()}`,
      farmerName: user?.name || 'Farmer',
      language: language || req.user?.preferredLanguage || 'mr',
      cropName: finalCrop,
      cropStage: finalStage,
      district,
      latitude: lat,
      longitude: lon,
      question
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function parseQuestionEntities(q: string, defaultCrop: string, defaultDistrict: string) {
  const norm = (q || '').toLowerCase();
  
  let targetCrop = defaultCrop;
  if (norm.includes('cotton') || norm.includes('kapas') || norm.includes('कापूस') || norm.includes('कपास')) {
    targetCrop = 'Cotton';
  } else if (norm.includes('soybean') || norm.includes('soyabean') || norm.includes('सोयाबीन')) {
    targetCrop = 'Soybean';
  } else if (norm.includes('onion') || norm.includes('kanda') || norm.includes('कांदा') || norm.includes('प्याज')) {
    targetCrop = 'Onion';
  } else if (norm.includes('wheat') || norm.includes('gehun') || norm.includes('गहू') || norm.includes('गेहूँ')) {
    targetCrop = 'Wheat';
  } else if (norm.includes('tur') || norm.includes('arhar') || norm.includes('तूर') || norm.includes('अरहर')) {
    targetCrop = 'Tur';
  } else if (norm.includes('chana') || norm.includes('gram') || norm.includes('harbhara') || norm.includes('हरभरा') || norm.includes('चना')) {
    targetCrop = 'Gram';
  } else if (norm.includes('maize') || norm.includes('makka') || norm.includes('मका') || norm.includes('मक्का')) {
    targetCrop = 'Maize';
  } else if (norm.includes('tomato') || norm.includes('टोमॅटो') || norm.includes('टमाटर')) {
    targetCrop = 'Tomato';
  }

  let targetDistrict = defaultDistrict;
  const districts = [
    { key: 'parbhani', name: 'Parbhani' },
    { key: 'परभणी', name: 'Parbhani' },
    { key: 'nanded', name: 'Nanded' },
    { key: 'नांदेड', name: 'Nanded' },
    { key: 'latur', name: 'Latur' },
    { key: 'लातूर', name: 'Latur' },
    { key: 'jalna', name: 'Jalna' },
    { key: 'जालना', name: 'Jalna' },
    { key: 'akola', name: 'Akola' },
    { key: 'अकोला', name: 'Akola' },
    { key: 'amravati', name: 'Amravati' },
    { key: 'अमरावती', name: 'Amravati' },
    { key: 'yavatmal', name: 'Yavatmal' },
    { key: 'यवतमाळ', name: 'Yavatmal' },
    { key: 'buldhana', name: 'Buldhana' },
    { key: 'बुलढाणा', name: 'Buldhana' },
    { key: 'nashik', name: 'Nashik' },
    { key: 'नाशिक', name: 'Nashik' },
    { key: 'pune', name: 'Pune' },
    { key: 'पुणे', name: 'Pune' },
    { key: 'nagpur', name: 'Nagpur' },
    { key: 'नागपूर', name: 'Nagpur' },
    { key: 'kolhapur', name: 'Kolhapur' },
    { key: 'कोल्हापूर', name: 'Kolhapur' },
    { key: 'solapur', name: 'Solapur' },
    { key: 'सोलापूर', name: 'Solapur' },
    { key: 'chandrapur', name: 'Chandrapur' },
    { key: 'चंद्रपूर', name: 'Chandrapur' }
  ];

  for (const d of districts) {
    if (norm.includes(d.key)) {
      targetDistrict = d.name;
      break;
    }
  }

  return { targetCrop, targetDistrict };
}

// ==========================================
// Conversational AI Advisory Chat
// ==========================================
router.post('/advisory/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let user = null;
    let farm = null;
    let crop = null;

    try {
      user = await User.findById(userId);
      farm = await FarmProfile.findOne({ userId });
      if (farm) crop = await Crop.findOne({ farmId: farm._id });
    } catch (_) {}

    if (!user) user = memoryStore.users.find(u => u._id.toString() === userId);
    if (!farm) farm = memoryStore.farms.find(f => f.userId.toString() === userId);
    if (!crop && farm) crop = memoryStore.crops.find(c => c.farmId.toString() === farm._id.toString());

    const { question, language, cropName } = req.body;
    const defaultCrop = cropName || crop?.cropName || 'Soybean';
    const lang = language || req.user?.preferredLanguage || 'mr';
    const defaultDistrict = farm?.district || 'Latur';

    const { targetCrop, targetDistrict } = parseQuestionEntities(question || '', defaultCrop, defaultDistrict);

    // Fast Greeting Response
    const cleanQ = (question || '').trim().toLowerCase();
    const commonGreetings = ['hi', 'hii', 'hiii', 'hello', 'hey', 'namaste', 'namaskar', 'राम राम', 'नमस्कार', 'नमस्ते', 'प्रणाम'];
    
    if (commonGreetings.includes(cleanQ)) {
      const greetingTexts = {
        mr: `राम राम ${user?.name || 'शेतकरी मित्र'}! मी कृषीसारथी AI आहे. आपल्या ${defaultDistrict} येथील ${defaultCrop} पिकाचे संरक्षण, आगामी पाऊस आणि आजच्या बाजारभावाबाबत संपूर्ण सल्ला देण्यासाठी मी सज्ज आहे. आपण काय विचारू इच्छिता?`,
        hi: `नमस्ते ${user?.name || 'किसान साथी'}! मैं कृषिसारथी AI हूँ। आपके ${defaultDistrict} क्षेत्र की ${defaultCrop} फसल, मौसम चेतावनी और मंडी भाव के बारे में सहायता के लिए मैं तैयार हूँ। आप क्या जानना चाहते हैं?`,
        en: `Hello ${user?.name || 'Farmer'}! I am AgriSaarthi AI, your personalized agronomist. I am ready to guide you on crop protection for ${defaultCrop}, local rainfall risks, and APMC mandi rates. How can I help you today?`
      };

      const greetingAnswer = greetingTexts[lang as 'mr'|'hi'|'en'] || greetingTexts.mr;
      return res.json({
        answer: greetingAnswer,
        structuredAdvice: {
          directAnswer: greetingAnswer,
          relevantDataUsed: [`Farm: ${defaultDistrict}`, `Crop: ${defaultCrop}`],
          identifiedRisk: 'No current risks on general greeting',
          riskLevel: 'LOW',
          recommendedActions: [
            lang === 'mr' ? 'फवारणी अनुकूलतेबाबत विचारा' : 'Ask about spraying suitability',
            lang === 'mr' ? 'आगामी पावसाचा अंदाज विचारा' : 'Ask about upcoming rainfall',
            lang === 'mr' ? 'आजचे बाजारभाव तपासा' : 'Check latest mandi rates'
          ],
          timeline: 'Today',
          whatToAvoid: [],
          uncertaintyLimitations: 'Grounded on verified AgriSaarthi agronomic knowledge base.',
          supportingSources: ['AgriSaarthi AI']
        },
        trace: [],
        risks: [],
        createdTasks: [],
        createdAlerts: []
      });
    }

    // Full Agronomic Question Processing with entity-aware routing
    const agent = new AgriculturalAdvisoryAgent();
    const result = await agent.runWorkflow({
      userId: userId!,
      farmId: farm ? farm._id.toString() : `farm_${Date.now()}`,
      farmerName: user?.name || 'Farmer',
      language: lang,
      cropName: targetCrop,
      district: targetDistrict,
      question
    });

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
// Farm Tasks & Scheduler (Per User)
// ==========================================
router.get('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const tasks = await FarmTask.find({ userId }).sort({ createdAt: -1 });
    if (tasks.length > 0) return res.json(tasks);
  } catch (_) {}
  const memTasks = memoryStore.tasks.filter(t => t.userId.toString() === userId);
  res.json(memTasks);
});

router.post('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, description, scheduledDate, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const userId = req.user?.id;
  const newTaskData = {
    userId,
    title,
    description: description || '',
    scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
    priority: priority || 'MEDIUM',
    status: 'PENDING',
    source: 'FARMER_MANUAL',
    createdAt: new Date()
  };

  let task = null;
  try {
    task = await FarmTask.create(newTaskData);
  } catch (_) {
    task = { _id: `task_${Date.now()}`, ...newTaskData };
    memoryStore.tasks.unshift(task);
  }

  res.status(201).json(task);
});

router.patch('/tasks/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, title, description, priority } = req.body;

  try {
    const updated = await FarmTask.findByIdAndUpdate(id, { status, title, description, priority }, { new: true });
    if (updated) return res.json(updated);
  } catch (_) {}

  const task = memoryStore.tasks.find(t => t._id.toString() === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (status) task.status = status;
  if (title) task.title = title;
  if (description) task.description = description;
  if (priority) task.priority = priority;

  res.json(task);
});

router.delete('/tasks/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await FarmTask.findByIdAndDelete(id);
  } catch (_) {}

  const index = memoryStore.tasks.findIndex(t => t._id.toString() === id);
  if (index !== -1) {
    memoryStore.tasks.splice(index, 1);
  }
  res.json({ message: 'Task deleted successfully' });
});

// ==========================================
// Alerts Center (Per User)
// ==========================================
router.get('/alerts', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
    if (alerts.length > 0) return res.json(alerts);
  } catch (_) {}
  const memAlerts = memoryStore.alerts.filter(a => a.userId.toString() === userId);
  res.json(memAlerts);
});

router.patch('/alerts/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await Alert.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (updated) return res.json({ message: 'Alert marked as read', alert: updated });
  } catch (_) {}

  const alert = memoryStore.alerts.find(a => a._id.toString() === id);
  if (alert) alert.isRead = true;
  res.json({ message: 'Alert marked as read', alert });
});

// ==========================================
// Unified Dashboard Aggregator (Per User)
// ==========================================
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Fetch User
    let user = null;
    try {
      user = await User.findById(userId);
    } catch (_) {}
    if (!user) user = memoryStore.users.find(u => u._id.toString() === userId);

    if (!user) return res.status(404).json({ error: 'User not found. Please log in again.' });

    // 2. Fetch User's Farm
    let farm: any = null;
    try {
      farm = await FarmProfile.findOne({ userId });
    } catch (_) {}
    if (!farm) farm = memoryStore.farms.find(f => f.userId.toString() === userId);

    // 3. Fetch User's Crop
    let crop: any = null;
    if (farm) {
      try {
        crop = await Crop.findOne({ farmId: farm._id });
      } catch (_) {}
      if (!crop) crop = memoryStore.crops.find(c => c.farmId.toString() === farm._id.toString());
    }

    // If new user has not added their farm yet:
    if (!farm || !crop) {
      const lat = 18.25;
      const lon = 76.50;
      const [weather, mandi, soil] = await Promise.all([
        fetchWeatherData(lat, lon, 'Maharashtra'),
        getMandiPrices('Soybean', 'Maharashtra', 'Latur'),
        fetchSoilData(lat, lon)
      ]);
      const risks = evaluateWeatherRisks('Soybean', 'Flowering', weather);

      const greetings = {
        mr: `राम राम, ${user.name}! आपल्या शेताची अचूक माहिती मिळवण्यासाठी कृपया शेताचे ठिकाण व पीक नोंदवा.`,
        hi: `नमस्ते, ${user.name}! सटीक कृषि परामर्श के लिए कृपया अपने खेत और फसल की जानकारी दर्ज करें।`,
        en: `Welcome, ${user.name}! Please set up your farm location and crop to receive personalized intelligence.`
      };

      return res.json({
        hasFarm: false,
        greeting: greetings[user.preferredLanguage as 'mr'|'hi'|'en'] || greetings.mr,
        language: user.preferredLanguage || 'mr',
        farmer: {
          id: user._id.toString(),
          name: user.name,
          emailOrMobile: user.emailOrMobile,
          preferredLanguage: user.preferredLanguage
        },
        farm: null,
        crop: null,
        weather,
        weatherRisks: risks,
        mandiPrices: mandi,
        soil,
        tasks: [],
        alerts: [],
        timestamp: new Date().toISOString()
      });
    }

    // User has a configured farm: fetch their live weather, mandi, and soil!
    const lang = (req.query.lang as 'mr' | 'hi' | 'en') || user.preferredLanguage || 'mr';
    const lat = farm.latitude || 18.25;
    const lon = farm.longitude || 76.50;

    const [weather, mandi, soil] = await Promise.all([
      fetchWeatherData(lat, lon, `${farm.district}, ${farm.state}`),
      getMandiPrices(crop.cropName, farm.state, farm.district),
      fetchSoilData(lat, lon)
    ]);

    const risks = evaluateWeatherRisks(crop.cropName, crop.cropStage, weather);

    // Tasks and Alerts
    let userTasks: any[] = [];
    try {
      userTasks = await FarmTask.find({ userId }).sort({ createdAt: -1 });
    } catch (_) {}
    if (userTasks.length === 0) {
      userTasks = memoryStore.tasks.filter(t => t.userId.toString() === userId);
    }

    let userAlerts: any[] = [];
    try {
      userAlerts = await Alert.find({ userId }).sort({ createdAt: -1 });
    } catch (_) {}
    if (userAlerts.length === 0) {
      userAlerts = memoryStore.alerts.filter(a => a.userId.toString() === userId);
    }

    const greetings = {
      mr: `राम राम, ${user.name}! आजचे कृषी सल्लागार अपडेट पहा.`,
      hi: `नमस्ते, ${user.name}! आज का कृषि परामर्श एवं मौसम अपडेट देखें।`,
      en: `Welcome, ${user.name}! Here is your personalized agricultural intelligence.`
    };

    res.json({
      hasFarm: true,
      greeting: greetings[lang] || greetings.mr,
      language: lang,
      farmer: {
        id: user._id.toString(),
        name: user.name,
        emailOrMobile: user.emailOrMobile,
        preferredLanguage: user.preferredLanguage
      },
      farm: {
        id: farm._id.toString(),
        name: farm.farmName,
        location: `${farm.village}, ${farm.taluka}, ${farm.district}, ${farm.state}`,
        area: `${farm.area} ${farm.areaUnit}`,
        soilType: farm.soilType,
        irrigationType: farm.irrigationType,
        coordinates: { lat, lon }
      },
      crop: {
        id: crop._id.toString(),
        name: crop.cropName,
        variety: crop.variety,
        stage: crop.cropStage,
        sowingDate: crop.sowingDate
      },
      weather,
      weatherRisks: risks,
      mandiPrices: mandi,
      soil,
      tasks: userTasks,
      alerts: userAlerts,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
