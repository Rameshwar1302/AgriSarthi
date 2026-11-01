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
  weather: WeatherData,
  lang: 'mr' | 'hi' | 'en' = 'en'
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
      reason: lang === 'mr'
        ? `पुढील ४८ तासांत अंदाज वर्तवलेला ${first2DaysPrecip.toFixed(1)} मिमी पाऊस ${cropStage} अवस्थेतील ${crop} पिकासाठी सुरक्षित पातळीपेक्षा जास्त आहे.`
        : lang === 'hi'
        ? `अगले 48 घंटों में अनुमानित ${first2DaysPrecip.toFixed(1)} मिमी बारिश ${cropStage} अवस्था में ${crop} फसल के लिए सुरक्षित सीमा से अधिक है।`
        : `Forecast rainfall of ${first2DaysPrecip.toFixed(1)} mm over next 48h exceeds the safety threshold for ${crop} during the ${cropStage} stage.`,
      recommendedActions: lang === 'mr'
        ? [
            'शेतातील सर्व चर आणि पाण्याचे निचरा मार्ग त्वरित मोकळे करा.',
            'पाणी साचू नये म्हणून गादी वाफे किंवा सरी-वरंब्यांचे तोंड मोकळे करा.',
            '२४ तास कोरडे हवामान होईपर्यंत सर्व रासायनिक फवारण्या पुढे ढकला.',
            'काढणी केलेले पीक ताडपत्रीने झाकून सुरक्षित ठेवा.'
          ]
        : lang === 'hi'
        ? [
            'खेत की सभी जल निकासी नालियों को तुरंत साफ करें।',
            'पानी का जमाव रोकने के लिए मेड़ों के निकास खोलें।',
            'मौसम साफ होने तक सभी रासायनिक छिड़काव स्थगित रखें।',
            'काटी गई फसल को तिरपाल से ढंककर सुरक्षित रखें।'
          ]
        : [
            'Inspect and clear all drainage channels, furrows, and farm outlets immediately.',
            'If planted on Broad Bed Furrow (BBF) or ridges, ensure water drains away from root zones.',
            'Postpone all scheduled pesticide, fungicide, and herbicide spraying until 24 hours of dry weather.',
            'Ensure harvested produce or threshing areas are covered with tarpaulins.'
          ],
      whatToAvoid: lang === 'mr'
        ? [
            'मुसळधार पावसापूर्वी खत किंवा युरिया टाकू नका (वाहून जाण्याचा धोका).',
            'पाणी साचलेल्या जमिनीत ट्रॅक्टर चालवू नका.'
          ]
        : lang === 'hi'
        ? [
            'बारिश से ठीक पहले यूरिया या खाद का छिड़काव न करें।',
            'गीले खेत में ट्रैक्टर न चलाएं।'
          ]
        : [
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
        reason: lang === 'mr'
          ? 'काळी कसदार जमिनीत पाणी साचल्यास मुळांना हवा न मिळून फुलगळ किंवा शेंगागळ होण्याची दाट शक्यता आहे.'
          : lang === 'hi'
          ? 'काली मिट्टी में जलभराव से जड़ों को हवा नहीं मिलेगी और फूल झड़ने का खतरा रहेगा।'
          : `Water stagnation in heavy black clay soils will suffocate legume root nodules and cause sudden flower/pod drop.`,
        recommendedActions: lang === 'mr'
          ? [
              'साचलेले पाणी १२-२४ तासांत बाहेर काढा.',
              'पाणी ओसरल्यानंतर १९:१९:१९ विद्राव्य खताची फवारणी करावी.'
            ]
          : lang === 'hi'
          ? [
              'जमा हुआ पानी 12-24 घंटे के भीतर निकालें।',
              'पानी सूखने पर 19:19:19 घुलनशील खाद का छिड़काव करें।'
            ]
          : [
              'Drain stagnant surface water within 12-24 hours.',
              'After water recedes and soil is workable, spray 19:19:19 (100g/10L) to revive root uptake.'
            ],
        whatToAvoid: lang === 'mr'
          ? ['फुलोऱ्यातील पिकात २४ तासांपेक्षा जास्त वेळ पाणी साचू देऊ नका.']
          : lang === 'hi'
          ? ['फूल आने की अवस्था में 24 घंटे से अधिक जलभराव न होने दें।']
          : ['Never allow stagnant water to remain standing around flowering soybean for >24 hours.'],
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
      reason: lang === 'mr'
        ? `वाऱ्याचा वेग ${maxWindSpeedNext3Days.toFixed(1)} किमी/तास आणि पावसाची शक्यता ${rainProbToday}% असल्याने कीटकनाशक वाहून जाण्याची मोठी जोखीम आहे.`
        : lang === 'hi'
        ? `हवा की गति ${maxWindSpeedNext3Days.toFixed(1)} किमी/घंटा और बारिश की संभावना ${rainProbToday}% होने से कीटनाशक छिड़काव बहने का जोखिम है।`
        : `Wind speeds reaching ${maxWindSpeedNext3Days.toFixed(1)} km/h with ${rainProbToday}% rain probability creates severe spray drift hazard and chemical wash-off.`,
      recommendedActions: lang === 'mr'
        ? [
            'वाऱ्याचा वेग १२ किमी/तास खाली येईपर्यंत सर्व फवारण्या स्थगित करा.',
            'उंच पिकांना (कापूस, मका) आधार द्या.'
          ]
        : lang === 'hi'
        ? [
            'हवा की गति 12 किमी/घंटा से कम होने तक छिड़काव रोकें।',
            'लंबी फसलों (कपास, मक्का) को सहारा दें।'
          ]
        : [
            'Suspend all foliar insecticide and fungicide spraying until early morning when winds are below 12 km/h.',
            'Check physical stakes and supports for tall crops (like Cotton or Maize).'
          ],
      whatToAvoid: lang === 'mr'
        ? ['जोरदार वाऱ्यात फवारणी करू नका.', '४-६ तासांत पाऊस अपेक्षित असल्यास स्टिकरशिवाय फवारणी टाळा.']
        : lang === 'hi'
        ? ['तेज हवा में छिड़काव न करें।', '4-6 घंटे में बारिश की संभावना पर छिड़काव न करें।']
        : [
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
      reason: lang === 'mr'
        ? `तापमान ${maxTempNext3Days.toFixed(1)}°C जवळ पोहोचल्याने पिकावर उष्णतेचा ताण येईल आणि परागीभवन क्षमतेवर परिणाम होईल.`
        : lang === 'hi'
        ? `तापमान ${maxTempNext3Days.toFixed(1)}°C तक पहुंचने से फसल पर लू का तनाव और परागण पर प्रभाव पड़ेगा।`
        : `Maximum temperatures approaching ${maxTempNext3Days.toFixed(1)}°C cause thermal stress, stomatal closure, and reduced pollen viability.`,
      recommendedActions: lang === 'mr'
        ? [
            'सायंकाळी किंवा पहाटे हलके पाणी द्यावे.',
            'ओलावा टिकवण्यासाठी आच्छादनाचा (मल्चिंग) वापर करावा.'
          ]
        : lang === 'hi'
        ? [
            'शाम या सुबह के समय हल्की सिंचाई करें।',
            'नमी बनाए रखने के लिए मल्चिंग का उपयोग करें।'
          ]
        : [
            'Provide light, frequent irrigation during late evening or early morning to cool root zones.',
            'Use drip irrigation or mulching with crop residue to conserve soil moisture.'
          ],
      whatToAvoid: lang === 'mr'
        ? ['दुपारच्या कडक उन्हात जास्त पाणी देणे टाळा.']
        : lang === 'hi'
        ? ['दोपहर की तेज धूप में अधिक सिंचाई से बचें।']
        : ['Avoid flood irrigation during the hottest mid-day hours.'],
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
      reason: lang === 'mr'
        ? `पुढील ७ दिवसांत अत्यल्प पाऊस (${total7DayRain.toFixed(1)} मिमी) आणि जास्त उष्णतेमुळे पिकास पाण्याचा ताण बसेल.`
        : lang === 'hi'
        ? `अगले 7 दिनों में कम बारिश (${total7DayRain.toFixed(1)} मिमी) और तेज धूप से फसल में पानी की कमी होगी।`
        : `Low rainfall (${total7DayRain.toFixed(1)} mm) and sustained high evaporative demand over the 7-day forecast.`,
      recommendedActions: lang === 'mr'
        ? ['संवेदनशील अवस्थेत संरक्षित सिंचन द्या.', 'जमिनीतील ओलावा टिकवण्यासाठी कोळपणी करून भुसभुशीत करा.']
        : lang === 'hi'
        ? ['संवेदनशील अवस्था में संरक्षी सिंचाई दें।', 'नमी रोकने के लिए हल्की निराई करें।']
        : [
            'Schedule protective irrigation for moisture-sensitive stages.',
            'In rainfed plots, practice shallow hoeing to retain subsoil moisture.'
          ],
      whatToAvoid: lang === 'mr'
        ? ['जमिनीला मोठ्या भेगा पडू देऊ नका.']
        : lang === 'hi'
        ? ['जमीन में दरारें न पड़ने दें।']
        : ['Do not delay protective irrigation if top 5 cm of soil has cracked.'],
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
      reason: lang === 'mr'
        ? 'काढणीच्या वेळी पाऊस आल्यास दाण्यांचा दर्जा खराब होणे, बुरशी लागणे आणि शेंगा फुटण्याचा मोठा धोका असतो.'
        : lang === 'hi'
        ? 'कटाई के समय बारिश से दाना खराब होने, फफूंद लगने और फलियां चटकने का बड़ा जोखिम है।'
        : `Rain forecast during harvest stage poses high risk of pod shattering, seed discoloration, fungal aflatoxin, and grain sprouting.`,
      recommendedActions: lang === 'mr'
        ? ['कापणी केलेले पीक तात्काळ गोळा करून कोरड्या जागेत किंवा ताडपत्रीखाली ठेवा.']
        : lang === 'hi'
        ? ['काटी गई फसल को तुरंत सुरक्षित सूखे स्थान या तिरपाल के नीचे रखें।']
        : ['Immediately move harvested crop to covered storage or cover heaps securely with waterproof tarpaulins.'],
      whatToAvoid: lang === 'mr'
        ? ['कापलेले पीक शेतात उघड्यावर ठेवू नका.']
        : lang === 'hi'
        ? ['कटी फसल को खुले खेत में न छोड़ें।']
        : ['Never leave cut swaths uncollected in low-lying furrow basins.'],
      source,
      generatedAt
    });
  }

  // 6. Default Favorable Conditions
  if (risks.length === 0) {
    risks.push({
      riskType: 'FAVORABLE_CONDITIONS',
      severity: 'LOW',
      crop,
      cropStage,
      reason: lang === 'mr'
        ? `सध्याचे हवामान ${crop} पिकासाठी अनुकूल आहे. कोणताही गंभीर हवामान धोका नाही.`
        : lang === 'hi'
        ? `वर्तमान मौसम ${crop} फसल के लिए अनुकूल है। कोई गंभीर मौसम जोखिम नहीं है।`
        : `Current weather conditions are favorable for ${crop} growth. No acute meteorological stress identified.`,
      recommendedActions: lang === 'mr'
        ? ['नियोजित शेती कामे नियमित सुरू ठेवा.']
        : lang === 'hi'
        ? ['नियमित कृषि कार्य जारी रखें।']
        : ['Proceed with regular agronomic calendar and planned field activities.'],
      whatToAvoid: [],
      source,
      generatedAt
    });
  }

  return risks;
}
