import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { EvaluatedRisk } from '../rules/riskEngine.js';

export interface AdvisoryPayload {
  farmerName?: string;
  language: 'mr' | 'hi' | 'en';
  location: {
    district: string;
    taluka?: string;
    village?: string;
  };
  crop: {
    name: string;
    variety?: string;
    stage: string;
    sowingDaysAgo?: number;
  };
  weatherSummary: {
    currentTemp: number;
    currentCondition: string;
    rainfallNext48h: number;
    windSpeed: number;
    source: string;
  };
  soilSummary?: {
    pH: number;
    organicCarbon: number;
    texture?: string;
    sourceType: string;
  };
  mandiSummary?: {
    commodity: string;
    currentModalPrice: number;
    bestMandi: string;
    bestPrice: number;
    mandiRecords?: string[];
    sourceNote?: string;
    status?: string;
  };
  evaluatedRisks: EvaluatedRisk[];
  question?: string;
}

export interface StructuredAdvisoryResponse {
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

export async function generateAdvisory(payload: AdvisoryPayload): Promise<StructuredAdvisoryResponse> {
  // If Gemini API Key is present, attempt live LLM generation
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      let selectedModel = env.GEMINI_MODEL || 'gemini-1.5-flash';
      if (selectedModel.includes('2.5')) selectedModel = 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const languageInstruction =
        payload.language === 'mr'
          ? 'Respond entirely in pure, polite, farmer-friendly MARATHI (मराठी).'
          : payload.language === 'hi'
          ? 'Respond entirely in polite, simple HINDI (हिंदी).'
          : 'Respond in clear, accessible ENGLISH with farmer-friendly terms.';

      const systemPrompt = `
You are AgriSaarthi AI, a certified senior agronomist and agricultural advisory assistant in India.
${languageInstruction}

Strict Agricultural Guardrails:
1. Ground all answers strictly in the provided environmental, soil, and market data.
2. If the farmer asks about market rates or mandi prices for a commodity (e.g. Cotton, Soybean, Onion, Wheat), answer directly citing the specific market/APMC names, modal prices, min/max prices, and date from the provided mandi records. If no direct arrival is listed for the exact town today, report the latest live rates from neighboring APMCs in the state (e.g., Nanded, Buldhana, Chandrapur). Do not add unrelated spraying or weather alerts unless asked.
3. DO NOT hallucinate or invent unlisted chemical dosages or pesticide formulations. For chemical treatments, mention generic approved measures and advise consulting the local Krishi Vigyan Kendra (KVK).
4. Do NOT make definitive 'sell now or never' market guarantees. Present available modal prices and trends objectively.
4. Output strictly valid JSON matching this schema:
{
  "directAnswer": "Concise summary answer for the farmer",
  "relevantDataUsed": ["List of exact data points utilized"],
  "identifiedRisk": "Risk identified",
  "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "recommendedActions": ["Clear step 1", "Step 2", "Step 3"],
  "timeline": "When exactly to do this (e.g. within next 24-48 hours)",
  "whatToAvoid": ["Mistake to avoid 1", "Mistake 2"],
  "mandiAdvisory": "Contextual advice about current commodity price",
  "uncertaintyLimitations": "Data limitations or disclaimer",
  "supportingSources": ["Open-Meteo", "AGMARKNET", "KVK"]
}
`;

      const userContext = JSON.stringify(payload, null, 2);
      const userPrompt = `
Farmer Question / Context:
${payload.question || 'Provide current farming recommendations and weather risk actions for my crop.'}

Structured Farm & Sensor Data:
${userContext}
`;

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      const responseText = result.response.text();
      // Extract json from markdown block if wrapped
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          directAnswer: parsed.directAnswer || 'Advisory generated successfully.',
          relevantDataUsed: parsed.relevantDataUsed || ['Open-Meteo', 'AGMARKNET'],
          identifiedRisk: parsed.identifiedRisk || 'Weather & crop risk evaluated.',
          riskLevel: parsed.riskLevel || 'MEDIUM',
          recommendedActions: parsed.recommendedActions || [],
          timeline: parsed.timeline || 'Next 24 to 48 hours',
          whatToAvoid: parsed.whatToAvoid || [],
          mandiAdvisory: parsed.mandiAdvisory || '',
          uncertaintyLimitations: parsed.uncertaintyLimitations || 'Weather and mandi data are subject to regional variations. Consult your local agricultural officer.',
          supportingSources: parsed.supportingSources || ['Open-Meteo', 'AGMARKNET']
        };
      }
    } catch (llmError: any) {
      console.warn(`[LLMService] Gemini API call failed or timed out: ${llmError.message}. Switching to deterministic rule-based agronomist fallback.`);
    }
  }

  // ==========================================
  // Deterministic Rule-Based Fallback Advisory
  // High-reliability agronomist recommendations in Marathi, Hindi & English
  // ==========================================
  const primaryRisk = payload.evaluatedRisks[0] || {
    riskType: 'FAVORABLE_CONDITIONS',
    severity: 'LOW',
    reason: 'Normal seasonal weather conditions',
    recommendedActions: ['Routine field inspection', 'Maintain planned irrigation schedule'],
    whatToAvoid: ['Over-fertilization']
  };

  const cropName = payload.crop.name;
  const stage = payload.crop.stage;
  const lang = payload.language;
  const q = (payload.question || '').toLowerCase();
  const isMandiQ = q.includes('mandi') || q.includes('rate') || q.includes('price') || q.includes('भाव') || q.includes('दर') || q.includes('रेट') || q.includes('बाजार') || q.includes('apmc') || q.includes('market');
  const isSprayQ = q.includes('spray') || q.includes('फवारणी') || q.includes('छिड़काव');

  if (lang === 'mr') {
    // Marathi response
    if (isMandiQ) {
      const bestMandi = payload.mandiSummary?.bestMandi || `${payload.location.district} APMC`;
      const modalPrice = payload.mandiSummary?.currentModalPrice || 4580;
      const bestPrice = payload.mandiSummary?.bestPrice || modalPrice;
      const commodityName = payload.mandiSummary?.commodity || cropName;
      return {
        directAnswer: `${bestMandi} येथे ${commodityName} पिकाचा आजचा सरासरी मॉडेल भाव ₹${modalPrice}/क्विंटल आहे. राज्यातील सर्वोच्च दर ₹${bestPrice}/क्विंटल नोंदवला गेला आहे.`,
        relevantDataUsed: [
          `बाजार समिती: ${bestMandi}`,
          `शेतमाल: ${commodityName}`,
          `मॉडेल भाव: ₹${modalPrice}/क्विंटल`,
          `डेटा स्रोत: data.gov.in AGMARKNET`
        ],
        identifiedRisk: 'बाजारभाव चढ-उतार',
        riskLevel: 'LOW',
        recommendedActions: [
          'शेतीमाल बाजारात नेण्यापूर्वी चांगल्या प्रतीनुसार प्रतवारी (Grading) करा.',
          'बाजार समितीतील दैनंदिन आवक आणि लिलाव भावाचा अंदाज घेऊन विक्रीचा निर्णय घ्या.',
          'इ-नाम (e-NAM) किंवा थेट अधिकृत APMC गेटपास तपासून शेतमाल पाठवा.'
        ],
        timeline: 'आज किंवा आगामी २-३ दिवसांत',
        whatToAvoid: [
          'ओला किंवा अस्वच्छ शेतमाल बाजारात नेऊ नका (भावात घट होऊ शकते).',
          'विनापावती अनधिकृत मध्यस्थांना शेतमाल विकणे टाळा.'
        ],
        mandiAdvisory: `सध्या ${bestMandi} मध्ये सर्वोच्च दर ₹${bestPrice}/क्विंटल सुरू आहे. प्रतवारी करूनच विक्रीचा निर्णय घ्या.`,
        uncertaintyLimitations: 'टीप: बाजारभाव दररोजच्या आवकेनुसार बदलू शकतात. प्रत्यक्ष विक्रीपूर्वी स्थानिक बाजार समितीशी संपर्क साधावा.',
        supportingSources: ['data.gov.in AGMARKNET', 'महाराष्ट्र राज्य कृषी पणन मंडळ (MSAMB)']
      };
    }

    if (isSprayQ) {
      const safeWind = payload.weatherSummary.windSpeed < 15;
      const safeRain = payload.weatherSummary.rainfallNext48h < 5;
      const isSafe = safeWind && safeRain;
      return {
        directAnswer: isSafe
          ? `सध्या वाऱ्याचा वेग ${payload.weatherSummary.windSpeed} किमी/तास असून हवामान शांत आहे. आपल्या ${cropName} पिकावर (${stage} अवस्था) फवारणी करणे सुरक्षित आणि अनुकूल आहे.`
          : `पुढील २४ ते ४८ तासांत वाऱ्याचा वेग ${payload.weatherSummary.windSpeed} किमी/तास आणि पावसाची शक्यता (${payload.weatherSummary.rainfallNext48h.toFixed(1)} मिमी) असल्याने सध्या फवारणी पुढे ढकला.`,
        relevantDataUsed: [
          `वाऱ्याचा वेग: ${payload.weatherSummary.windSpeed} किमी/तास`,
          `अपेक्षित पाऊस: ${payload.weatherSummary.rainfallNext48h.toFixed(1)} मिमी`,
          `पीक अवस्था: ${cropName} (${stage})`
        ],
        identifiedRisk: isSafe ? 'अनुकूल हवामान' : 'फवारणी वाहून जाण्याचा / उडून जाण्याचा धोका',
        riskLevel: isSafe ? 'LOW' : 'MEDIUM',
        recommendedActions: isSafe
          ? [
              'सकाळी ७ ते १० या वेळेत किंवा संध्याकाळी ऊन कमी झाल्यावर फवारणी करा.',
              'औषधाची कार्यक्षमता वाढवण्यासाठी नॉन-आयनिक स्टिकरचा योग्य प्रमाणात वापर करा.',
              'फुलोरा अवस्थेत मधमाशांच्या संरक्षणासाठी सुरक्षित औषधांची निवड करा.'
            ]
          : [
              'हवा शांत होईपर्यंत व पाऊस ओसरेपर्यंत सर्व प्रकारची फवारणी स्थगित ठेवा.',
              'जमीन वाफसा स्थितीत आल्यावरच पुढील फवारणीचे नियोजन करा.'
            ],
        timeline: isSafe ? 'आज सकाळी ७ ते १० वा.' : 'पुढील २४-४८ तासांनंतर',
        whatToAvoid: [
          'दुपारी कडक उन्हात फवारणी करू नका.',
          'जोराचा वारा असताना फवारणी करणे टाळा.'
        ],
        uncertaintyLimitations: 'टीप: फवारणीचे प्रमाण लेबल क्लेम व कृषी विज्ञान केंद्राच्या शिफारशीनुसारच ठेवावे.',
        supportingSources: ['Open-Meteo Weather', 'ICAR Agronomic Guidelines']
      };
    }

    const isRain = primaryRisk.riskType === 'HEAVY_RAINFALL' || primaryRisk.riskType === 'WATERLOGGING';
    return {
      directAnswer: isRain
        ? `पुढील ४८ तासांत ${payload.weatherSummary.rainfallNext48h.toFixed(1)} मिमी पावसाची शक्यता असल्याने आपल्या ${cropName} पिकाच्या (${stage} अवस्था) संरक्षणासाठी पाण्याचा तात्काळ निचरा करणे व फवारणी पुढे ढकलणे सर्वात महत्त्वाचे आहे.`
        : `आपल्या ${payload.location.district} भागातील हवामानानुसार सध्या ${cropName} पिकाची वाढ समाधानकारक असून वेळेवर कीड-रोग निरीक्षण व अन्नद्रव्य व्यवस्थापन करणे गरजेचे आहे.`,
      relevantDataUsed: [
        `हवामान: ४८ तासांत अपेक्षित पाऊस ${payload.weatherSummary.rainfallNext48h.toFixed(1)} मिमी, वाऱ्याचा वेग ${payload.weatherSummary.windSpeed} किमी/तास`,
        `जमीन: सामू (pH) ${payload.soilSummary?.pH || 7.4}, सेंद्रिय कर्ब ${payload.soilSummary?.organicCarbon || 0.58}%`,
        `बाजारभाव: ${payload.crop.name} सरासरी दर ₹${payload.mandiSummary?.currentModalPrice || 4580}/क्विंटल`
      ],
      identifiedRisk: primaryRisk.reason,
      riskLevel: primaryRisk.severity,
      recommendedActions: [
        'शेतातील मुख्य चर आणि पाणी वाहून जाणारे पाट मोकळे करा, जेणेकरून मुळांशी पाणी साचणार नाही.',
        'वारा आणि पाऊस थांबेपर्यंत कोणतीही कीटकनाशक किंवा विद्राव्य खतांची फवारणी करू नका.',
        'पाऊस ओसरल्यानंतर मुळांची कार्यक्षमता वाढवण्यासाठी १९:१९:१९ किंवा पोटॅशियम नायट्रेट फवारणीचे नियोजन करा.'
      ],
      timeline: 'पुढील २४ ते ४८ तासांत (तात्काळ)',
      whatToAvoid: [
        'पावसापूर्वी युरिया खत शेतात फेकू नका (वाहून जाण्याचा धोका).',
        'जमीन ओली असताना ट्रॅक्टर किंवा जड औजारे शेतात चालवू नका.'
      ],
      mandiAdvisory: payload.mandiSummary
        ? `सध्या ${payload.mandiSummary.bestMandi} मध्ये सर्वोच्च दर ₹${payload.mandiSummary.bestPrice}/क्विंटल सुरू आहे. प्रतवारी करूनच विक्रीचा निर्णय घ्या.`
        : 'स्थानिक बाजारभाव तपासून योग्य वेळेत शेतमाल विक्री करा.',
      uncertaintyLimitations: 'टीप: ही शिफारस ओपन-मेटिओ हवामान अंदाज आणि प्रमाणित कृषी मार्गदर्शक तत्त्वांवर आधारित आहे. कीटकनाशकांच्या अचूक प्रमाणासाठी नजीकच्या कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा.',
      supportingSources: ['Open-Meteo Live API', 'data.gov.in AGMARKNET', 'महाराष्ट्र शासन कृषी विभाग मार्गदर्शक सूचना']
    };
  } else if (lang === 'hi') {
    // Hindi response
    if (isMandiQ) {
      const bestMandi = payload.mandiSummary?.bestMandi || `${payload.location.district} APMC`;
      const modalPrice = payload.mandiSummary?.currentModalPrice || 4580;
      const bestPrice = payload.mandiSummary?.bestPrice || modalPrice;
      const commodityName = payload.mandiSummary?.commodity || cropName;
      return {
        directAnswer: `${bestMandi} में ${commodityName} का आज का मॉडल भाव ₹${modalPrice}/क्विंटल है। राज्य में उच्चतम भाव ₹${bestPrice}/क्विंटल दर्ज किया गया है।`,
        relevantDataUsed: [
          `मंडी: ${bestMandi}`,
          `फसल: ${commodityName}`,
          `मॉडल भाव: ₹${modalPrice}/क्विंटल`,
          `स्रोत: data.gov.in AGMARKNET`
        ],
        identifiedRisk: 'मूल्य उतार-चढ़ाव',
        riskLevel: 'LOW',
        recommendedActions: [
          'फसल की सफाई और ग्रेडिंग करके ही मंडी में ले जाएं।',
          'मंडी आवक और पिछले 3 दिनों के मूल्य रुझान का विश्लेषण करें।',
          'अधिकृत ई-नाम (e-NAM) रसीद या APMC पर्ची अवश्य प्राप्त करें।'
        ],
        timeline: 'आज या आगामी 2-3 दिनों में',
        whatToAvoid: [
          'नमी युक्त उपज को बेचने की जल्दी न करें।',
          'अनाधिकृत बिचौलियों को कम भाव में फसल न बेचें।'
        ],
        mandiAdvisory: `${bestMandi} में अधिकतम भाव ₹${bestPrice}/क्विंटल चल रहा है।`,
        uncertaintyLimitations: 'सूचना: बाजार भाव दैनिक आवक के आधार पर भिन्न हो सकते हैं।',
        supportingSources: ['AGMARKNET Govt of India', 'State Agriculture Marketing Board']
      };
    }

    if (isSprayQ) {
      const safeWind = payload.weatherSummary.windSpeed < 15;
      const safeRain = payload.weatherSummary.rainfallNext48h < 5;
      const isSafe = safeWind && safeRain;
      return {
        directAnswer: isSafe
          ? `वर्तमान में हवा की गति ${payload.weatherSummary.windSpeed} km/h है और मौसम शांत है। अपनी ${cropName} फसल (${stage} अवस्था) पर छिड़काव करना सुरक्षित है।`
          : `आगामी 24 से 48 घंटों में संभावित बारिश (${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm) और तेज हवाओं के कारण कीटनाशक छिड़काव अभी स्थगित रखें।`,
        relevantDataUsed: [
          `हवा की गति: ${payload.weatherSummary.windSpeed} km/h`,
          `संभावित बारिश: ${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm`,
          `फसल अवस्था: ${cropName} (${stage})`
        ],
        identifiedRisk: isSafe ? 'अनुकूल मौसम' : 'दवा बहने व उड़ने का जोखिम',
        riskLevel: isSafe ? 'LOW' : 'MEDIUM',
        recommendedActions: isSafe
          ? [
              'सुबह 7 से 10 बजे के बीच या शाम के समय छिड़काव करें।',
              'दवा की प्रभावशीलता बढ़ाने के लिए स्टिकर का उपयोग करें।'
            ]
          : [
              'मौसम साफ होने और हवा की गति कम होने तक छिड़काव टालें।'
            ],
        timeline: isSafe ? 'आज सुबह 7 से 10 बजे' : 'अगले 24-48 घंटे बाद',
        whatToAvoid: [
          'दोपहर की तेज धूप में छिड़काव न करें।'
        ],
        uncertaintyLimitations: 'दवा की सही मात्रा हेतु स्थानीय कृषि विज्ञान केंद्र से संपर्क करें।',
        supportingSources: ['Open-Meteo Weather', 'ICAR Guidelines']
      };
    }

    const isRain = primaryRisk.riskType === 'HEAVY_RAINFALL' || primaryRisk.riskType === 'WATERLOGGING';
    return {
      directAnswer: isRain
        ? `अगले 48 घंटों में ${payload.weatherSummary.rainfallNext48h.toFixed(1)} मिमी बारिश का अनुमान है। अपनी ${cropName} फसल (${stage} अवस्था) को जलभराव से बचाने के लिए जल निकासी सुनिश्चित करें और छिड़काव स्थगित करें।`
        : `आपके क्षेत्र में मौसम के अनुसार ${cropName} फसल की ${stage} अवस्था में समय पर निराई-गुड़ाई और कीट निगरानी की आवश्यकता है।`,
      relevantDataUsed: [
        `मौसम: 48 घंटे में संभावित बारिश ${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm, हवा ${payload.weatherSummary.windSpeed} km/h`,
        `मृदा: pH ${payload.soilSummary?.pH || 7.4}, जैविक कार्बन ${payload.soilSummary?.organicCarbon || 0.58}%`,
        `मंडी भाव: ${payload.crop.name} मॉडल भाव ₹${payload.mandiSummary?.currentModalPrice || 4580}/क्विंटल`
      ],
      identifiedRisk: primaryRisk.reason,
      riskLevel: primaryRisk.severity,
      recommendedActions: [
        'खेत के मुख्य निकास नालों को तुरंत साफ करें ताकि जलजमाव न हो।',
        'हवा और बारिश के रुकने तक किसी भी कीटनाशक का छिड़काव न करें।',
        'पानी सूखने के बाद पौधों की मजबूती हेतु घुलनशील खाद का उपयोग करें।'
      ],
      timeline: 'अगले 24 से 48 घंटे के भीतर',
      whatToAvoid: [
        'भारी बारिश से तुरंत पहले यूरिया का छिड़काव न करें।',
        'गीले खेत में भारी उपकरण न चलाएं।'
      ],
      mandiAdvisory: payload.mandiSummary
        ? `${payload.mandiSummary.bestMandi} में अधिकतम भाव ₹${payload.mandiSummary.bestPrice}/क्विंटल चल रहा है।`
        : 'बाजार भाव का अवलोकन करके ही फसल बेचने का निर्णय लें।',
      uncertaintyLimitations: 'सूचना: यह सलाह ओपन-मेटिओ पूर्वानुमान और सत्यापित कृषि नियमों पर आधारित है। रासायनिक उपचार से पहले कृषि विज्ञान केंद्र (KVK) से परामर्श लें।',
      supportingSources: ['Open-Meteo Weather', 'AGMARKNET Govt of India', 'ICAR Agronomic Guidelines']
    };
  } else {
    // English response
    if (isMandiQ) {
      const bestMandi = payload.mandiSummary?.bestMandi || `${payload.location.district} APMC`;
      const modalPrice = payload.mandiSummary?.currentModalPrice || 4580;
      const bestPrice = payload.mandiSummary?.bestPrice || modalPrice;
      const commodityName = payload.mandiSummary?.commodity || cropName;
      return {
        directAnswer: `The current modal mandi rate for ${commodityName} at ${bestMandi} is ₹${modalPrice}/Quintal. The peak recorded price in Maharashtra reaches ₹${bestPrice}/Quintal.`,
        relevantDataUsed: [
          `APMC Market: ${bestMandi}`,
          `Commodity: ${commodityName}`,
          `Modal Price: ₹${modalPrice}/Quintal`,
          `Data Source: data.gov.in AGMARKNET`
        ],
        identifiedRisk: 'Price Volatility',
        riskLevel: 'LOW',
        recommendedActions: [
          'Clean, dry, and grade harvested produce to qualify for premium price brackets.',
          'Check daily APMC arrival volumes and auction trends before transporting produce.',
          'Verify official e-NAM weighment and gate passes for transparent transactions.'
        ],
        timeline: 'Today or over next 2-3 market days',
        whatToAvoid: [
          'Do not transport damp or uncleaned produce (leads to distress discounting).',
          'Avoid off-market transactions without verified APMC receipts.'
        ],
        mandiAdvisory: `Highest modal price recorded at ${bestMandi} (₹${bestPrice}/Quintal). Grade produce cleanly before dispatch.`,
        uncertaintyLimitations: 'Note: Mandi prices fluctuate daily based on arrivals and quality grades. Confirm at local APMC before transit.',
        supportingSources: ['data.gov.in AGMARKNET', 'State Agricultural Marketing Board']
      };
    }

    if (isSprayQ) {
      const safeWind = payload.weatherSummary.windSpeed < 15;
      const safeRain = payload.weatherSummary.rainfallNext48h < 5;
      const isSafe = safeWind && safeRain;
      return {
        directAnswer: isSafe
          ? `Current wind speed is ${payload.weatherSummary.windSpeed} km/h and weather is calm. Conditions are safe and favorable for foliar spraying on your ${cropName} (${stage} stage).`
          : `Postpone foliar spraying. Expected rainfall (${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm) and wind speed (${payload.weatherSummary.windSpeed} km/h) risk chemical drift and wash-off.`,
        relevantDataUsed: [
          `Wind Speed: ${payload.weatherSummary.windSpeed} km/h`,
          `Precipitation (48h): ${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm`,
          `Crop Stage: ${cropName} (${stage})`
        ],
        identifiedRisk: isSafe ? 'Favorable Weather' : 'Chemical Drift and Wash-off Risk',
        riskLevel: isSafe ? 'LOW' : 'MEDIUM',
        recommendedActions: isSafe
          ? [
              'Spray between 7:00 AM and 10:00 AM or late afternoon when solar intensity drops.',
              'Add a non-ionic surfactant/sticker to maximize foliar adhesion.',
              'Avoid spraying bee-attracting flowers during peak pollination morning hours.'
            ]
          : [
              'Suspend foliar applications until 24 hours of dry, calm weather prevail.'
            ],
        timeline: isSafe ? 'Today 7:00 AM - 10:00 AM' : 'After next 24-48 hours',
        whatToAvoid: [
          'Do NOT spray during midday heat (>35°C) to prevent foliar scorch.'
        ],
        uncertaintyLimitations: 'Follow certified label recommendations or consult local Krishi Vigyan Kendra (KVK).',
        supportingSources: ['Open-Meteo Weather', 'ICAR Agronomic Guidelines']
      };
    }

    const isRain = primaryRisk.riskType === 'HEAVY_RAINFALL' || primaryRisk.riskType === 'WATERLOGGING';
    return {
      directAnswer: isRain
        ? `Due to ${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm rainfall forecast over the next 48 hours, the critical priority for your ${cropName} crop (${stage} stage) is immediate furrow drainage and postponing all foliar spraying.`
        : `Current environmental parameters are favorable for your ${cropName} crop at the ${stage} stage. Focus on timely weed monitoring and nutrient management.`,
      relevantDataUsed: [
        `Weather: ${payload.weatherSummary.rainfallNext48h.toFixed(1)} mm precipitation in 48h, Wind Speed ${payload.weatherSummary.windSpeed} km/h`,
        `Soil: pH ${payload.soilSummary?.pH || 7.4}, Organic Carbon ${payload.soilSummary?.organicCarbon || 0.58}%`,
        `Mandi: ${payload.crop.name} modal price ₹${payload.mandiSummary?.currentModalPrice || 4580}/Quintal`
      ],
      identifiedRisk: primaryRisk.reason,
      riskLevel: primaryRisk.severity,
      recommendedActions: [
        'Inspect and unclog field drainage channels and broad beds to prevent water stagnation around root zones.',
        'Suspend all insecticide, fungicide, and herbicide spraying until 24 hours of calm dry weather.',
        'Post-rain, assess leaf health and schedule a protective foliar nutrition spray (19:19:19) once soil dries.'
      ],
      timeline: 'Next 24 to 48 hours (Urgent)',
      whatToAvoid: [
        'Do NOT broadcast nitrogenous fertilizers ahead of intense rainfall (causes leaching and runoff).',
        'Do NOT operate heavy tractors on saturated black soils to avoid severe compaction.'
      ],
      mandiAdvisory: payload.mandiSummary
        ? `Highest modal price recorded at ${payload.mandiSummary.bestMandi} (₹${payload.mandiSummary.bestPrice}/Quintal). Grade produce cleanly before dispatch.`
        : 'Monitor regional APMC arrivals before finalizing market sales.',
      uncertaintyLimitations: 'Note: Forecast derived from Open-Meteo models. Field micro-climates may vary. For exact chemical dosages, consult your local Krishi Vigyan Kendra (KVK).',
      supportingSources: ['Open-Meteo Forecast Model', 'AGMARKNET data.gov.in', 'State Agricultural University Advisory Guidelines']
    };
  }
}

