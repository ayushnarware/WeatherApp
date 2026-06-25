import type { WeatherBundle } from "@/features/weather/types";

export type CropName =
  | "Wheat"
  | "Rice"
  | "Soybean"
  | "Cotton"
  | "Maize"
  | "Sugarcane"
  | "Tomato"
  | "Potato"
  | "Onion"
  | "Mustard"
  | "Chickpea"
  | "Millets";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Recommendation {
  id: string;
  title: string;
  titleHi: string;
  reason: string;
  reasonHi: string;
  confidence: number;
  riskLevel: RiskLevel;
  action: string;
  actionHi: string;
  category: "irrigation" | "spraying" | "disease" | "heat" | "fertilizer" | "fieldwork" | "air";
}

export interface AdvisoryContext {
  weather: WeatherBundle;
  crop: CropName;
  sowingDate: string;
}

export interface CropProfile {
  crop: CropName;
  season: string;
  sowingWindow: string;
  harvestDays: number;
  irrigationIntervalDays: number;
  waterNeed: "low" | "moderate" | "high";
  fertilizerDays: number[];
  sprayDays: number[];
  criticalStages: Array<{ day: number; label: string }>;
}
