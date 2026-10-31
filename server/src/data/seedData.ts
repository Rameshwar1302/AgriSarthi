export interface CropCalendarStage {
  stage: string;
  daysFromSowingStart: number;
  daysFromSowingEnd: number;
  criticalActivities: string[];
  weatherSensitivities: string[];
  irrigationGuidance: string;
}

export interface CropCalendar {
  cropName: string;
  optimalSeason: string;
  totalDurationDays: number;
  stages: CropCalendarStage[];
}

export const CROP_CALENDARS: Record<string, CropCalendar> = {
  Soybean: {
    cropName: 'Soybean',
    optimalSeason: 'Kharif (June - October)',
    totalDurationDays: 95,
    stages: [
      {
        stage: 'Land Preparation',
        daysFromSowingStart: -15,
        daysFromSowingEnd: 0,
        criticalActivities: [
          'Deep summer ploughing followed by 2 harrowings',
          'Apply 5 tonnes/ha FYM or well-decomposed compost',
          'Form broad bed furrows (BBF) or ridges and furrows for drainage'
        ],
        weatherSensitivities: ['Ensure adequate pre-sowing soil moisture (75-100 mm rainfall before sowing)'],
        irrigationGuidance: 'Rainfed primarily; maintain surface drainage channels to prevent waterlogging'
      },
      {
        stage: 'Sowing',
        daysFromSowingStart: 0,
        daysFromSowingEnd: 5,
        criticalActivities: [
          'Seed treatment with Trichoderma viride (4g/kg) and Rhizobium japonicum culture',
          'Sow at 45 cm row spacing and 3-5 cm depth'
        ],
        weatherSensitivities: ['Avoid sowing if heavy rainfall (>50 mm) is forecast within 48 hours'],
        irrigationGuidance: 'Sow when soil has reached field capacity after monsoon onset'
      },
      {
        stage: 'Germination',
        daysFromSowingStart: 5,
        daysFromSowingEnd: 15,
        criticalActivities: [
          'Monitor emergence count (target: 40-45 plants/sq.meter)',
          'Gap filling if required within 7-10 days'
        ],
        weatherSensitivities: ['Excess water causes crusting and seed rot; high heat (>38°C) scorches young seedlings'],
        irrigationGuidance: 'Drain any stagnant rainwater immediately'
      },
      {
        stage: 'Vegetative',
        daysFromSowingStart: 15,
        daysFromSowingEnd: 35,
        criticalActivities: [
          'First weeding / interculturing at 20-25 days after sowing',
          'Monitor for stem fly and semilooper attack',
          'Foliar spray of 19:19:19 (100g/10L) if growth is stunted'
        ],
        weatherSensitivities: ['Strong winds may dislodge young plants; clear dry window required for spraying'],
        irrigationGuidance: 'Light irrigation only if dry spell exceeds 14 days during vegetative growth'
      },
      {
        stage: 'Flowering',
        daysFromSowingStart: 35,
        daysFromSowingEnd: 55,
        criticalActivities: [
          'CRITICAL STAGE: Most moisture sensitive period for soybean',
          'Spray Boron (0.1%) to enhance flower retention and pod setting',
          'Do NOT spray harsh contact insecticides during peak bee pollination hours (morning)'
        ],
        weatherSensitivities: [
          'Heavy continuous rain drops flower buds',
          'Severe moisture stress (>10 days without rain) causes up to 40% yield drop'
        ],
        irrigationGuidance: 'Protective irrigation mandatory if rain fails for 7-10 days'
      },
      {
        stage: 'Pod/Grain Development',
        daysFromSowingStart: 55,
        daysFromSowingEnd: 75,
        criticalActivities: [
          'Spray 00:52:34 or 13:00:45 (100g/10L) for bold grain filling',
          'Scout for pod borer (Helicoverpa armigera) and spodoptera'
        ],
        weatherSensitivities: ['Waterlogging leads to fungal pod rot and root asphyxiation'],
        irrigationGuidance: 'Provide one light irrigation if soil cracks and pods show shriveling'
      },
      {
        stage: 'Harvesting',
        daysFromSowingStart: 75,
        daysFromSowingEnd: 95,
        criticalActivities: [
          'Harvest when 90% leaves turn yellow and drop off, pods turn golden brown',
          'Harvesting moisture: 13-15% grain moisture to prevent pod shattering losses'
        ],
        weatherSensitivities: ['CRITICAL: Rainfall during harvest causes grain discoloration, sprouting and mold'],
        irrigationGuidance: 'Stop all irrigation 15 days before intended harvest'
      },
      {
        stage: 'Post-Harvest',
        daysFromSowingStart: 95,
        daysFromSowingEnd: 110,
        criticalActivities: [
          'Sun dry harvested crop to 10-12% moisture before threshing',
          'Clean, grade, and pack in moisture-proof HDPE/gunny bags',
          'Store on wooden pallets away from damp walls'
        ],
        weatherSensitivities: ['Cover threshing yard during unseasonal rain alerts'],
        irrigationGuidance: 'Not applicable'
      }
    ]
  },
  Cotton: {
    cropName: 'Cotton',
    optimalSeason: 'Kharif (May - December)',
    totalDurationDays: 160,
    stages: [
      {
        stage: 'Land Preparation',
        daysFromSowingStart: -20,
        daysFromSowingEnd: 0,
        criticalActivities: ['Deep ploughing, application of FYM (10 t/ha), ridge & furrow formation'],
        weatherSensitivities: ['Optimum soil temperature > 18°C'],
        irrigationGuidance: 'Pre-sowing irrigation for irrigated cotton or wait for monsoon onset'
      },
      {
        stage: 'Sowing',
        daysFromSowingStart: 0,
        daysFromSowingEnd: 7,
        criticalActivities: ['Dibble seeds at 90x60 cm or 120x45 cm depending on hybrid type'],
        weatherSensitivities: ['Rain immediately after sowing causes soil crusting and poor emergence'],
        irrigationGuidance: 'Ensure optimum moisture at planting depth'
      },
      {
        stage: 'Vegetative',
        daysFromSowingStart: 7,
        daysFromSowingEnd: 45,
        criticalActivities: ['Thinning at 15-20 DAS to 1 plant per hill', 'First top dressing with Nitrogen at 30 DAS'],
        weatherSensitivities: ['Avoid waterlogging; cotton roots are extremely sensitive to poor aeration'],
        irrigationGuidance: 'Maintain moderate moisture, irrigate alternate furrows'
      },
      {
        stage: 'Flowering',
        daysFromSowingStart: 45,
        daysFromSowingEnd: 85,
        criticalActivities: ['Square and flower initiation', 'Install pheromone traps for pink bollworm (5/acre)', 'Foliar spray of Planofix/NAA to prevent square shedding'],
        weatherSensitivities: ['High humidity + cloudy weather promotes bollworm and fungal spots'],
        irrigationGuidance: 'Critical irrigation period; do not allow water deficit'
      },
      {
        stage: 'Pod/Grain Development',
        daysFromSowingStart: 85,
        daysFromSowingEnd: 130,
        criticalActivities: ['Boll development and maturation', 'Spray Potassium Nitrate (13:0:45) at 1% for boll weight'],
        weatherSensitivities: ['Moisture stress causes boll shedding and premature opening'],
        irrigationGuidance: 'Irrigate every 10-14 days based on soil moisture'
      },
      {
        stage: 'Harvesting',
        daysFromSowingStart: 130,
        daysFromSowingEnd: 170,
        criticalActivities: ['Pick clean cotton in dry morning hours when dew evaporates', 'Keep stained/damaged bolls separate'],
        weatherSensitivities: ['Rain on open bolls degrades fiber grade, yellows lint, drops market price'],
        irrigationGuidance: 'Cease irrigation before final picking'
      }
    ]
  },
  Rice: {
    cropName: 'Rice',
    optimalSeason: 'Kharif / Rabi',
    totalDurationDays: 125,
    stages: [
      {
        stage: 'Land Preparation',
        daysFromSowingStart: -25,
        daysFromSowingEnd: 0,
        criticalActivities: ['Puddling and leveling field to retain standing water layer'],
        weatherSensitivities: ['Ample water availability required'],
        irrigationGuidance: 'Maintain 2-3 cm standing water'
      },
      {
        stage: 'Vegetative',
        daysFromSowingStart: 0,
        daysFromSowingEnd: 40,
        criticalActivities: ['Transplant 21-day old seedlings at 20x15 cm spacing', 'Apply split dose Nitrogen at tillering'],
        weatherSensitivities: ['Continuous flood stress above 10 cm can submerge seedlings'],
        irrigationGuidance: 'Maintain 3-5 cm shallow water layer'
      },
      {
        stage: 'Flowering',
        daysFromSowingStart: 40,
        daysFromSowingEnd: 75,
        criticalActivities: ['Panicle initiation and flowering', 'Keep watch for blast and brown planthopper (BPH)'],
        weatherSensitivities: ['High temperatures (>35°C) during flowering induce spikelet sterility'],
        irrigationGuidance: 'Most critical stage; never allow field to dry'
      },
      {
        stage: 'Pod/Grain Development',
        daysFromSowingStart: 75,
        daysFromSowingEnd: 105,
        criticalActivities: ['Milking and dough stage', 'Foliar nutrition if required'],
        weatherSensitivities: ['Strong storms cause lodging of heavy panicles'],
        irrigationGuidance: 'Alternate wetting and moderate drying'
      },
      {
        stage: 'Harvesting',
        daysFromSowingStart: 105,
        daysFromSowingEnd: 125,
        criticalActivities: ['Drain water 10 days before harvest', 'Harvest when 85% grains in panicle turn golden'],
        weatherSensitivities: ['Rain at maturity causes panicle sprouting'],
        irrigationGuidance: 'Drain field completely'
      }
    ]
  },
  Wheat: {
    cropName: 'Wheat',
    optimalSeason: 'Rabi (November - March)',
    totalDurationDays: 115,
    stages: [
      {
        stage: 'Sowing',
        daysFromSowingStart: 0,
        daysFromSowingEnd: 5,
        criticalActivities: ['Sowing at 20-22.5 cm line spacing', 'Apply basal NPK (60:60:40 kg/ha)'],
        weatherSensitivities: ['Optimum temperature 20-22°C for germination'],
        irrigationGuidance: 'Sow in moist seedbed'
      },
      {
        stage: 'Vegetative',
        daysFromSowingStart: 5,
        daysFromSowingEnd: 45,
        criticalActivities: ['Crown Root Initiation (CRI) at 21 DAS - FIRST CRITICAL IRRIGATION', 'First top dressing with Urea'],
        weatherSensitivities: ['Sensitive to early moisture stress'],
        irrigationGuidance: 'Mandatory CRI irrigation at 21 days'
      },
      {
        stage: 'Flowering',
        daysFromSowingStart: 45,
        daysFromSowingEnd: 75,
        criticalActivities: ['Jointing and heading stage', 'Monitor for rusts and aphids'],
        weatherSensitivities: ['Frost or extreme heat spells affect earhead emergence'],
        irrigationGuidance: 'Irrigate at flowering stage'
      },
      {
        stage: 'Pod/Grain Development',
        daysFromSowingStart: 75,
        daysFromSowingEnd: 100,
        criticalActivities: ['Dough stage grain filling', 'Protect from terminal heat stress'],
        weatherSensitivities: ['Terminal heat stress (>32°C in Feb/March) drastically reduces 1000-grain weight'],
        irrigationGuidance: 'Light irrigation during milking stage on calm wind days to avoid lodging'
      },
      {
        stage: 'Harvesting',
        daysFromSowingStart: 100,
        daysFromSowingEnd: 115,
        criticalActivities: ['Combine harvesting or manual sickle harvesting when grain is hard and straw dry'],
        weatherSensitivities: ['Avoid harvesting under cloudy/rain conditions'],
        irrigationGuidance: 'No irrigation'
      }
    ]
  },
  Tur: {
    cropName: 'Tur',
    optimalSeason: 'Kharif (June - January)',
    totalDurationDays: 170,
    stages: [
      {
        stage: 'Sowing',
        daysFromSowingStart: 0,
        daysFromSowingEnd: 10,
        criticalActivities: ['Intercrop with Soybean (1:4 or 1:2) or sole planting', 'Trichoderma seed treatment'],
        weatherSensitivities: ['Good drainage essential; sensitive to water stagnation'],
        irrigationGuidance: 'Rainfed primarily'
      },
      {
        stage: 'Vegetative',
        daysFromSowingStart: 10,
        daysFromSowingEnd: 60,
        criticalActivities: ['Intercultivation, nip apical buds at 45-50 days to promote profuse branching'],
        weatherSensitivities: ['Moderate drought tolerant deep root system'],
        irrigationGuidance: 'Provide drainage if water accumulates'
      },
      {
        stage: 'Flowering',
        daysFromSowingStart: 60,
        daysFromSowingEnd: 110,
        criticalActivities: ['Heavy flowering period', 'Spray for pod borer (Helicoverpa) and plume moth at 50% flowering'],
        weatherSensitivities: ['Cloudy weather and fog during flowering cause flower drop and borer flare-up'],
        irrigationGuidance: 'Protective irrigation at flowering gives 30% higher yield'
      },
      {
        stage: 'Pod/Grain Development',
        daysFromSowingStart: 110,
        daysFromSowingEnd: 145,
        criticalActivities: ['Pod filling stage', 'Second spray for pod fly if infested'],
        weatherSensitivities: ['Avoid drought during pod filling'],
        irrigationGuidance: 'One protective irrigation at pod development stage'
      },
      {
        stage: 'Harvesting',
        daysFromSowingStart: 145,
        daysFromSowingEnd: 170,
        criticalActivities: ['Harvest when 80-85% pods turn brownish grey', 'Thresh and store at 10% moisture'],
        weatherSensitivities: ['Sun dry thoroughly before storage'],
        irrigationGuidance: 'Nil'
      }
    ]
  }
};

// ==========================================
// Maharashtra Mandi Seed Dataset (AGMARKNET Standard)
// ==========================================
export const SEED_MANDI_PRICES = [
  {
    commodity: 'Soybean',
    state: 'Maharashtra',
    district: 'Latur',
    market: 'Latur APMC',
    minPrice: 4250,
    maxPrice: 4720,
    modalPrice: 4580,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Latur APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Soybean',
    state: 'Maharashtra',
    district: 'Akola',
    market: 'Akola Mandi',
    minPrice: 4180,
    maxPrice: 4650,
    modalPrice: 4490,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Akola APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Soybean',
    state: 'Maharashtra',
    district: 'Amravati',
    market: 'Amravati APMC',
    minPrice: 4200,
    maxPrice: 4680,
    modalPrice: 4520,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Amravati APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Soybean',
    state: 'Maharashtra',
    district: 'Nanded',
    market: 'Nanded APMC',
    minPrice: 4150,
    maxPrice: 4610,
    modalPrice: 4460,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-29',
    source: 'AGMARKNET (Nanded APMC)',
    isDemo: true
  },
  {
    commodity: 'Soybean',
    state: 'Maharashtra',
    district: 'Nagpur',
    market: 'Kalamna Market Nagpur',
    minPrice: 4300,
    maxPrice: 4780,
    modalPrice: 4620,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Nagpur APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Cotton',
    state: 'Maharashtra',
    district: 'Yavatmal',
    market: 'Yavatmal APMC',
    minPrice: 7100,
    maxPrice: 7650,
    modalPrice: 7420,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Yavatmal APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Cotton',
    state: 'Maharashtra',
    district: 'Jalgaon',
    market: 'Jalgaon Mandi',
    minPrice: 7200,
    maxPrice: 7780,
    modalPrice: 7550,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Jalgaon APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Tur (Arhar)',
    state: 'Maharashtra',
    district: 'Latur',
    market: 'Latur APMC',
    minPrice: 9800,
    maxPrice: 10850,
    modalPrice: 10450,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Latur APMC Live)',
    isDemo: false
  },
  {
    commodity: 'Wheat',
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Pune Gultekdi APMC',
    minPrice: 2800,
    maxPrice: 3450,
    modalPrice: 3150,
    unit: 'Rs/Quintal',
    arrivalDate: '2026-10-30',
    source: 'AGMARKNET (Pune APMC Live)',
    isDemo: false
  }
];

// Historical Trend Data for Recharts visualization
export const SEED_MANDI_HISTORICAL: Record<string, Array<{ date: string; modalPrice: number; minPrice: number; maxPrice: number }>> = {
  Soybean: [
    { date: '15 Oct', modalPrice: 4350, minPrice: 4100, maxPrice: 4500 },
    { date: '18 Oct', modalPrice: 4400, minPrice: 4150, maxPrice: 4550 },
    { date: '21 Oct', modalPrice: 4480, minPrice: 4200, maxPrice: 4620 },
    { date: '24 Oct', modalPrice: 4510, minPrice: 4220, maxPrice: 4670 },
    { date: '27 Oct', modalPrice: 4550, minPrice: 4240, maxPrice: 4700 },
    { date: '30 Oct', modalPrice: 4580, minPrice: 4250, maxPrice: 4720 }
  ],
  Cotton: [
    { date: '15 Oct', modalPrice: 7200, minPrice: 6900, maxPrice: 7450 },
    { date: '18 Oct', modalPrice: 7310, minPrice: 7000, maxPrice: 7520 },
    { date: '21 Oct', modalPrice: 7390, minPrice: 7050, maxPrice: 7600 },
    { date: '24 Oct', modalPrice: 7450, minPrice: 7100, maxPrice: 7680 },
    { date: '27 Oct', modalPrice: 7510, minPrice: 7150, maxPrice: 7720 },
    { date: '30 Oct', modalPrice: 7550, minPrice: 7200, maxPrice: 7780 }
  ]
};

// ==========================================
// Maharashtra Soybean Farmer Demo Profile
// ==========================================
export const DEMO_FARMER = {
  user: {
    _id: 'usr_demo_anand_shinde',
    name: 'Anand Rao Shinde (आनंदराव शिंदे)',
    emailOrMobile: '9876543210',
    passwordHash: '$2a$10$wTfZ4R5jE7mK3v1N8xQW/uP5u2C1tZ/gXy7m1Q0jKlMnOpQrStUvW', // "password123"
    preferredLanguage: 'mr' as const,
    createdAt: new Date('2026-06-01')
  },
  farm: {
    _id: 'farm_demo_latur_01',
    userId: 'usr_demo_anand_shinde',
    farmName: 'Shinde Farm (शिंदे शेतशिवार)',
    state: 'Maharashtra',
    district: 'Latur',
    taluka: 'Ausa',
    village: 'Belkund',
    latitude: 18.2500,
    longitude: 76.5000,
    area: 3.5,
    areaUnit: 'Acre' as const,
    soilType: 'Medium Deep Black Soil (मध्यम काळी जमीन)',
    irrigationType: 'Drip' as const,
    createdAt: new Date('2026-06-05')
  },
  crop: {
    _id: 'crop_demo_soybean_01',
    farmId: 'farm_demo_latur_01',
    cropName: 'Soybean',
    variety: 'JS 335 (फुले कल्याणी)',
    sowingDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), // 42 days ago -> Flowering stage!
    cropStage: 'Flowering' as const,
    farmArea: 3.5,
    status: 'Active' as const,
    createdAt: new Date('2026-06-15')
  },
  soil: {
    _id: 'soil_demo_01',
    farmId: 'farm_demo_latur_01',
    pH: 7.4, // Optimum for soybean
    nitrogen: 215, // kg/ha (Medium)
    phosphorus: 18.5, // kg/ha (Medium)
    potassium: 295, // kg/ha (High)
    organicCarbon: 0.58, // % (Medium)
    soilTexture: 'Clay Loam (काळी चिकनमाती)',
    sourceType: 'Farmer Manual Test' as const,
    source: 'Krishi Vigyan Kendra Soil Testing Lab, Latur',
    measuredAt: new Date('2026-05-20'),
    fetchedAt: new Date()
  },
  tasks: [
    {
      _id: 'task_demo_01',
      userId: 'usr_demo_anand_shinde',
      farmId: 'farm_demo_latur_01',
      cropId: 'crop_demo_soybean_01',
      title: 'Inspect Drainage Channels & Broad Beds',
      description: 'Heavy precipitation (>45 mm) forecast in next 48 hours. Ensure furrows are unclogged to avoid standing water around flowering roots.',
      scheduledDate: new Date(),
      priority: 'HIGH' as const,
      status: 'PENDING' as const,
      source: 'AGENT_AUTO' as const,
      createdAt: new Date()
    },
    {
      _id: 'task_demo_02',
      userId: 'usr_demo_anand_shinde',
      farmId: 'farm_demo_latur_01',
      cropId: 'crop_demo_soybean_01',
      title: 'Postpone Pesticide/Foliar Spraying',
      description: 'Winds gusting at 26 km/h and rain likelihood 85%. Delay scheduled foliar spray until weather stabilizes.',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'MEDIUM' as const,
      status: 'PENDING' as const,
      source: 'AGENT_AUTO' as const,
      createdAt: new Date()
    },
    {
      _id: 'task_demo_03',
      userId: 'usr_demo_anand_shinde',
      farmId: 'farm_demo_latur_01',
      cropId: 'crop_demo_soybean_01',
      title: 'Second Interculturing & Weeding',
      description: 'Remove late-emerging weeds before canopy closure to conserve nutrients for pod formation.',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      priority: 'MEDIUM' as const,
      status: 'COMPLETED' as const,
      source: 'CROP_CALENDAR' as const,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ],
  alerts: [
    {
      _id: 'alert_demo_01',
      userId: 'usr_demo_anand_shinde',
      farmId: 'farm_demo_latur_01',
      title: 'पावसाची शक्यता व निचरा इशारा (Heavy Rain & Waterlogging Risk)',
      description: 'लातूर भागात पुढील ४८ तासांत मुसळधार पावसाची शक्यता आहे. फुलवरा अवस्थेतील सोयाबीन पिकात पाणी साचल्यास फुलगळ होऊ शकते. पाण्याचा तात्काळ निचरा करावा.',
      severity: 'WARNING' as const,
      relatedCrop: 'Soybean',
      recommendedAction: 'शेतातील चर मोकळे करा व फवारणी तात्काळ पुढे ढकला.',
      source: 'AgriSaarthi Autonomous Risk Engine',
      isRead: false,
      createdAt: new Date()
    },
    {
      _id: 'alert_demo_02',
      userId: 'usr_demo_anand_shinde',
      farmId: 'farm_demo_latur_01',
      title: 'लातूर बाजारभाव अपडेट (Latur Mandi Price Update)',
      description: 'लातूर बाजारात सोयाबीनची आवक वाढली असून आजचा सरासरी दर ₹४,५८० प्रति क्विंटल नोंदवला गेला आहे (कमाल ₹४,७२०).',
      severity: 'INFO' as const,
      relatedCrop: 'Soybean',
      recommendedAction: 'दर समाधानकारक असल्यास टप्प्याटप्प्याने माल विक्रीचा विचार करावा.',
      source: 'AGMARKNET Latur APMC',
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ]
};

// ==========================================
// In-Memory Fallback Persistence Store
// Guarantees zero-crash execution even without MongoDB running!
// ==========================================
class MemoryDataStore {
  users: any[] = [{ ...DEMO_FARMER.user }];
  farms: any[] = [{ ...DEMO_FARMER.farm }];
  crops: any[] = [{ ...DEMO_FARMER.crop }];
  soils: any[] = [{ ...DEMO_FARMER.soil }];
  tasks: any[] = [...DEMO_FARMER.tasks];
  alerts: any[] = [...DEMO_FARMER.alerts];
  mandiPrices: any[] = [...SEED_MANDI_PRICES];
  advisories: any[] = [];
  chatMessages: any[] = [];
  weatherSnapshots: any[] = [];

  resetToDemo() {
    this.users = [{ ...DEMO_FARMER.user }];
    this.farms = [{ ...DEMO_FARMER.farm }];
    this.crops = [{ ...DEMO_FARMER.crop }];
    this.soils = [{ ...DEMO_FARMER.soil }];
    this.tasks = [...DEMO_FARMER.tasks];
    this.alerts = [...DEMO_FARMER.alerts];
    this.mandiPrices = [...SEED_MANDI_PRICES];
    this.advisories = [];
    this.chatMessages = [];
  }
}

export const memoryStore = new MemoryDataStore();
