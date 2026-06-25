import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CropName, RiskLevel } from "@/features/advisor/types";

export type CopyPair = {
  hi: string;
  en: string;
};

export function pair(hi: string, en: string): CopyPair {
  return { hi, en };
}

export function text(copy: CopyPair, language: "hi" | "en") {
  return language === "hi" ? copy.hi : copy.en;
}

export function DualText({
  hi,
  en,
  language = "hi",
  className,
  subClassName
}: CopyPair & { language?: "hi" | "en"; className?: string; subClassName?: string }) {
  const primary = language === "hi" ? hi : en;
  const secondary = language === "hi" ? en : hi;
  return (
    <span className={cn("inline-flex min-w-0 flex-col", className)}>
      <span>{primary}</span>
      <span className={cn("text-[0.72em] font-medium leading-tight text-muted-foreground", subClassName)}>{secondary}</span>
    </span>
  );
}

export function InlineDual({ hi, en, language = "hi" }: CopyPair & { language?: "hi" | "en" }) {
  return <>{language === "hi" ? `${hi} / ${en}` : `${en} / ${hi}`}</>;
}

export const cropHindi: Record<CropName, string> = {
  Wheat: "गेहूं",
  Rice: "धान",
  Soybean: "सोयाबीन",
  Cotton: "कपास",
  Maize: "मक्का",
  Sugarcane: "गन्ना",
  Tomato: "टमाटर",
  Potato: "आलू",
  Onion: "प्याज",
  Mustard: "सरसों",
  Chickpea: "चना",
  Millets: "मिलेट्स"
};

export const riskHindi: Record<RiskLevel, string> = {
  low: "कम",
  medium: "मध्यम",
  high: "ज्यादा",
  critical: "बहुत ज्यादा"
};

export const taskHindi: Record<string, string> = {
  Sowing: "बुवाई",
  Irrigation: "सिंचाई",
  Fertilizer: "खाद",
  Spraying: "छिड़काव",
  Harvest: "कटाई"
};

export const statusHindi: Record<string, string> = {
  completed: "पूरा",
  due: "आज",
  upcoming: "आने वाला",
  delayed: "रोकें"
};

export const weatherUi = {
  dashboard: pair("डैशबोर्ड", "Dashboard"),
  calendar: pair("फसल कैलेंडर", "Crop Calendar"),
  map: pair("नक्शा", "Map"),
  appName: pair("मौसम साथी किसान", "Smart Farmer Weather Advisor"),
  appShort: pair("मौसम साथी", "Smart Farmer"),
  liveFarm: pair("लाइव खेत मौसम", "Live farm weather"),
  browserOnly: pair("ब्राउज़र में चलता है", "Browser-only"),
  browserOnlyBody: pair("लाइव Open-Meteo डाटा, नियम आधारित सलाह और आखिरी मौसम ऑफलाइन कैश।", "Live Open-Meteo data, rule-based advice, and last weather cached offline."),
  search: pair("गांव, शहर या जिला खोजें", "Search village, city, or district"),
  detect: pair("लोकेशन", "Detect"),
  selectedLocation: pair("चुनी हुई जगह", "Selected location"),
  crop: pair("फसल", "Crop"),
  sowingDate: pair("बुवाई तारीख", "Sowing date"),
  language: pair("भाषा", "Language"),
  noLocationTitle: pair("अपने खेत की जगह चुनें", "Select your farm location"),
  noLocationDesc: pair("लोकेशन अनुमति दें या गांव, शहर, जिला खोजें। मौसम हमेशा Open-Meteo से लाइव आता है।", "Allow location or search a village, city, or district. Weather always comes live from Open-Meteo."),
  noMock: pair("यहां नकली मौसम नहीं दिखाया जाता। जगह चुनते ही 16 दिन का मौसम, हवा, बारिश, AQI और खेती सलाह दिखेगी।", "No mock weather is shown. Select a place to load 16-day weather, wind, rain, AQI, and farm advice."),
  liveOpenMeteo: pair("लाइव Open-Meteo", "Live Open-Meteo"),
  feelsLike: pair("महसूस", "Feels like"),
  updated: pair("अपडेट", "Updated"),
  rainChance: pair("बारिश chance", "Rain chance"),
  wind: pair("हवा", "Wind"),
  humidity: pair("नमी", "Humidity"),
  farmStatus: pair("आज खेत का काम", "Farm work status"),
  watchRain: pair("बारिश देखें", "Watch rain"),
  operational: pair("काम हो सकता है", "Operational"),
  sunrise: pair("सूर्योदय", "Sunrise"),
  sunset: pair("सूर्यास्त", "Sunset"),
  moonPhase: pair("चांद", "Moon phase"),
  uv: pair("UV", "UV Index"),
  pressure: pair("दबाव", "Pressure"),
  visibility: pair("दिखाई", "Visibility"),
  windGust: pair("तेज हवा", "Wind gust"),
  cloudCover: pair("बादल", "Cloud cover"),
  rainToday: pair("आज बारिश", "Rain today"),
  moonLight: pair("चांद रोशनी", "Moon light"),
  airQuality: pair("हवा गुणवत्ता", "Air quality"),
  advisor: pair("किसान सलाह", "Smart Farm Advisor"),
  advisorDesc: pair("लाइव मौसम और फसल के हिसाब से आसान नियम आधारित फैसला।", "Rule-based decisions from live weather and crop context."),
  confidence: pair("भरोसा", "Confidence"),
  rainTimeline: pair("बारिश टाइमलाइन", "Rain Timeline"),
  tempTimeline: pair("तापमान टाइमलाइन", "Temperature Timeline"),
  windTimeline: pair("हवा टाइमलाइन", "Wind Timeline"),
  next48: pair("अगले 48 घंटे", "Next 48 hours"),
  sprayPlanning: pair("छिड़काव प्लानिंग", "Spray planning"),
  forecast16: pair("16 दिन मौसम", "16-Day Forecast"),
  forecastDesc: pair("खेत की योजना के लिए लाइव दैनिक मौसम।", "Live daily forecast for farm planning."),
  weekly: pair("साप्ताहिक संकेत", "Weekly Insights"),
  summary: pair("मौसम सार", "Weather Summary"),
  todayTasks: pair("आज के काम", "Today's Tasks"),
  todayTasksDesc: pair("फसल, बुवाई तारीख और मौसम नियम से बने काम।", "Generated from crop, sowing date, and weather rules."),
  noUrgent: pair("आज कोई जरूरी काम नहीं। खेत देखें और मिट्टी की नमी चेक करें।", "No urgent task today. Scout the field and check soil moisture."),
  couldNotLoad: pair("मौसम लोड नहीं हुआ", "Weather could not load"),
  checkInternet: pair("इंटरनेट चेक करें या पास की जगह खोजें।", "Check internet or search a nearby location."),
  cached: pair("लाइव request नहीं चल रही, आखिरी सेव मौसम दिख रहा है।", "Showing last cached weather while live request is unavailable."),
  mapTitle: pair("खेत मौसम नक्शा", "Farm Weather Map"),
  mapDesc: pair("OpenStreetMap, खेत मार्कर, लाइव बादल और हवा दिशा।", "OpenStreetMap, farm marker, live cloud and wind direction."),
  cloudTrack: pair("लाइव बादल ट्रैक", "Live Cloud Track"),
  cloudTrackDesc: pair("Open-Meteo बादल % और हवा दिशा से बादल की चाल दिखाई गई है।", "Cloud movement is inferred from Open-Meteo cloud cover and wind direction."),
  clickMap: pair("खेत मार्कर बदलने के लिए नक्शे पर टैप करें", "Tap map to move farm marker")
};

export function WithEmoji({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true">{emoji}</span>
      {children}
    </span>
  );
}
