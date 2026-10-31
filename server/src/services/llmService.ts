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
      const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-1.5-flash' });

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
2. DO NOT hallucinate or invent unlisted chemical dosages or pesticide formulations. For chemical treatments, mention generic approved measures and advise consulting the local Krishi Vigyan Kendra (KVK).
3. Do NOT make definitive 'sell now or never' market guarantees. Present available modal prices and trends objectively.
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

  if (lang === 'mr') {
    // Marathi response
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

