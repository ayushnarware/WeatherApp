import { clamp } from "@/lib/utils";
import type { DailyWeather, HourlyWeather, WeatherBundle } from "@/features/weather/types";
import type { CropName, Recommendation, RiskLevel } from "./types";

function withinHours(hourly: HourlyWeather[], hours: number) {
  const now = Date.now();
  const end = now + hours * 60 * 60 * 1000;
  return hourly.filter((item) => {
    const time = new Date(item.time).getTime();
    return time >= now - 60 * 60 * 1000 && time <= end;
  });
}

function maxOf<T>(items: T[], selector: (item: T) => number | null | undefined) {
  return items.reduce((max, item) => Math.max(max, selector(item) ?? 0), 0);
}

function sumOf<T>(items: T[], selector: (item: T) => number | null | undefined) {
  return items.reduce((sum, item) => sum + (selector(item) ?? 0), 0);
}

function confidence(value: number, threshold: number, spread = threshold) {
  return Math.round(clamp((value - threshold) / spread, 0.1, 1) * 100);
}

function addRecommendation(recommendations: Recommendation[], recommendation: Recommendation) {
  recommendations.push(recommendation);
}

function severity(level: RiskLevel) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[level];
}

function cropDiseaseHint(crop: CropName) {
  if (["Tomato", "Potato", "Onion"].includes(crop)) return `${crop} is sensitive to fungal pressure in humid weather.`;
  if (["Rice", "Soybean", "Cotton"].includes(crop)) return `${crop} can see faster pest or disease spread under humid, cloudy conditions.`;
  return `${crop} should be monitored for leaf wetness and canopy disease.`;
}

export function buildFarmAdvisory(weather: WeatherBundle, crop: CropName): Recommendation[] {
  const next24 = withinHours(weather.hourly, 24);
  const next72 = withinHours(weather.hourly, 72);
  const next3Days = weather.daily.slice(0, 3);

  const maxRainProbability24 = maxOf(next24, (item) => item.rainProbability);
  const maxRainProbability72 = maxOf(next72, (item) => item.rainProbability);
  const maxWind24 = Math.max(weather.current.windSpeed, maxOf(next24, (item) => item.windSpeed));
  const maxHumidity24 = Math.max(weather.current.humidity, maxOf(next24, (item) => item.humidity));
  const maxTemperature24 = Math.max(weather.current.temperature, maxOf(next24, (item) => item.temperature));
  const maxUv24 = Math.max(weather.current.uvIndex ?? 0, maxOf(next24, (item) => item.uvIndex));
  const rainfallNext3Days = sumOf<DailyWeather>(next3Days, (item) => item.precipitationSum);
  const recommendations: Recommendation[] = [];

  if (maxRainProbability24 > 70) {
    addRecommendation(recommendations, {
      id: "skip-irrigation-rain",
      title: "Do not irrigate before the next rain window",
      titleHi: "अभी सिंचाई न करें",
      reason: `Rain probability reaches ${Math.round(maxRainProbability24)}% in the next 24 hours.`,
      reasonHi: `अगले 24 घंटे में बारिश की संभावना ${Math.round(maxRainProbability24)}% तक है।`,
      confidence: confidence(maxRainProbability24, 70, 30),
      riskLevel: "medium",
      action: "Keep pumps off and inspect drainage channels instead.",
      actionHi: "पंप बंद रखें और पानी निकासी की नाली चेक करें।",
      category: "irrigation"
    });
  }

  if (maxWind24 > 25) {
    addRecommendation(recommendations, {
      id: "avoid-spraying-wind",
      title: "Do not spray pesticides in windy conditions",
      titleHi: "तेज हवा में छिड़काव न करें",
      reason: `Wind speed may reach ${Math.round(maxWind24)} km/h, increasing spray drift and poor leaf coverage.`,
      reasonHi: `हवा ${Math.round(maxWind24)} km/h तक जा सकती है, दवा उड़ सकती है और पत्तों पर ठीक से नहीं बैठेगी।`,
      confidence: confidence(maxWind24, 25, 20),
      riskLevel: "high",
      action: "Shift pesticide or foliar spray work to a calmer morning or evening slot.",
      actionHi: "छिड़काव शांत सुबह या शाम के समय करें।",
      category: "spraying"
    });
  }

  if (maxHumidity24 > 85) {
    addRecommendation(recommendations, {
      id: "humidity-disease-risk",
      title: "Disease pressure is elevated",
      titleHi: "रोग का खतरा बढ़ा है",
      reason: `${cropDiseaseHint(crop)} Humidity is forecast near ${Math.round(maxHumidity24)}%.`,
      reasonHi: `नमी ${Math.round(maxHumidity24)}% तक जा सकती है, इसलिए पत्तों पर फफूंद/रोग का खतरा बढ़ सकता है।`,
      confidence: confidence(maxHumidity24, 85, 15),
      riskLevel: maxHumidity24 > 92 ? "high" : "medium",
      action: "Scout lower leaves, improve airflow, and avoid late-evening irrigation.",
      actionHi: "नीचे की पत्तियां देखें, हवा आने दें और देर शाम सिंचाई से बचें।",
      category: "disease"
    });
  }

  if (maxTemperature24 > 40) {
    addRecommendation(recommendations, {
      id: "heat-stress",
      title: "Heat stress risk for crop and workers",
      titleHi: "गर्मी से फसल और मजदूरों को खतरा",
      reason: `Temperature may exceed ${Math.round(maxTemperature24)}°C in the next 24 hours.`,
      reasonHi: `अगले 24 घंटे में तापमान ${Math.round(maxTemperature24)}°C से ऊपर जा सकता है।`,
      confidence: confidence(maxTemperature24, 40, 8),
      riskLevel: maxTemperature24 > 44 ? "critical" : "high",
      action: "Irrigate during cooler hours if soil is dry, pause transplanting, and schedule labor before midday.",
      actionHi: "मिट्टी सूखी हो तो ठंडे समय सिंचाई करें, रोपाई रोकें और काम दोपहर से पहले रखें।",
      category: "heat"
    });
  }

  if (rainfallNext3Days > 40) {
    addRecommendation(recommendations, {
      id: "delay-fertilizer-heavy-rain",
      title: "Delay fertilizer application",
      titleHi: "खाद अभी रोकें",
      reason: `Forecast rainfall totals about ${Math.round(rainfallNext3Days)} mm over the next 3 days.`,
      reasonHi: `अगले 3 दिन में करीब ${Math.round(rainfallNext3Days)} mm बारिश हो सकती है।`,
      confidence: confidence(rainfallNext3Days, 40, 45),
      riskLevel: "high",
      action: "Wait for a dry soil window to reduce nutrient leaching and runoff.",
      actionHi: "मिट्टी सूखने का इंतजार करें, ताकि खाद बहकर खराब न हो।",
      category: "fertilizer"
    });
  }

  if (rainfallNext3Days < 5 && maxRainProbability72 < 35) {
    addRecommendation(recommendations, {
      id: "dry-window-irrigation",
      title: "Plan irrigation during the dry window",
      titleHi: "सूखे मौसम में सिंचाई प्लान करें",
      reason: `Only ${rainfallNext3Days.toFixed(1)} mm rain is expected over 3 days, with rain probability below ${Math.round(maxRainProbability72)}%.`,
      reasonHi: `अगले 3 दिन में सिर्फ ${rainfallNext3Days.toFixed(1)} mm बारिश दिख रही है और संभावना ${Math.round(maxRainProbability72)}% से कम है।`,
      confidence: 78,
      riskLevel: "medium",
      action: "Check soil moisture and irrigate priority plots during early morning or late evening.",
      actionHi: "मिट्टी की नमी देखकर सुबह जल्दी या शाम को जरूरी खेत में सिंचाई करें।",
      category: "irrigation"
    });
  }

  if (maxUv24 >= 8) {
    addRecommendation(recommendations, {
      id: "high-uv-fieldwork",
      title: "High UV during field operations",
      titleHi: "तेज धूप में खेत का काम सावधानी से",
      reason: `UV index may reach ${Math.round(maxUv24)}, which increases worker heat load and chemical evaporation.`,
      reasonHi: `UV index ${Math.round(maxUv24)} तक जा सकता है, इससे गर्मी और दवा उड़ने का खतरा बढ़ता है।`,
      confidence: confidence(maxUv24, 8, 4),
      riskLevel: "medium",
      action: "Move spraying and hand labor away from peak sun hours.",
      actionHi: "छिड़काव और मेहनत वाला काम तेज धूप के समय न रखें।",
      category: "fieldwork"
    });
  }

  if ((weather.airQuality?.usAqi ?? 0) > 100) {
    addRecommendation(recommendations, {
      id: "air-quality-fieldwork",
      title: "Air quality may affect field work",
      titleHi: "हवा की गुणवत्ता काम पर असर डाल सकती है",
      reason: `US AQI is ${weather.airQuality?.usAqi}, rated ${weather.airQuality?.label}.`,
      reasonHi: `US AQI ${weather.airQuality?.usAqi} है, स्थिति ${weather.airQuality?.label} है।`,
      confidence: confidence(weather.airQuality?.usAqi ?? 0, 100, 80),
      riskLevel: (weather.airQuality?.usAqi ?? 0) > 150 ? "high" : "medium",
      action: "Reduce dust-generating work and give sensitive workers lighter tasks.",
      actionHi: "धूल वाला काम कम करें और संवेदनशील मजदूरों को हल्का काम दें।",
      category: "air"
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "stable-weather-window",
      title: "Weather window is suitable for routine farm work",
      titleHi: "आज सामान्य खेत काम के लिए मौसम ठीक है",
      reason: "Rain, wind, humidity, and heat thresholds are below alert levels for the next day.",
      reasonHi: "अगले दिन बारिश, हवा, नमी और गर्मी खतरे की सीमा से नीचे हैं।",
      confidence: 82,
      riskLevel: "low",
      action: "Proceed with planned scouting, light irrigation checks, and field sanitation.",
      actionHi: "फसल निरीक्षण, हल्की सिंचाई जांच और खेत सफाई जारी रखें।",
      category: "fieldwork"
    });
  }

  return recommendations.sort((a, b) => severity(b.riskLevel) - severity(a.riskLevel));
}

export function weeklyInsights(weather: WeatherBundle) {
  const week = weather.daily.slice(0, 7);
  const totalRain = sumOf<DailyWeather>(week, (item) => item.precipitationSum);
  const wetDays = week.filter((item) => item.precipitationSum >= 2 || item.rainProbabilityMax >= 55).length;
  const hottest = week.reduce((max, day) => (day.temperatureMax > max.temperatureMax ? day : max), week[0]);
  const windiest = week.reduce((max, day) => (day.windSpeedMax > max.windSpeedMax ? day : max), week[0]);

  return {
    totalRain,
    wetDays,
    hottest,
    windiest,
    irrigationWindow: totalRain < 12 && wetDays <= 1 ? "Likely needed" : "Watch soil before irrigating",
    sprayWindow: windiest.windSpeedMax < 22 && wetDays <= 2 ? "Good calm windows expected" : "Use calm, dry hours only"
  };
}
