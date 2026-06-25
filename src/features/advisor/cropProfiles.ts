import type { CropName, CropProfile } from "./types";

export const cropNames: CropName[] = [
  "Wheat",
  "Rice",
  "Soybean",
  "Cotton",
  "Maize",
  "Sugarcane",
  "Tomato",
  "Potato",
  "Onion",
  "Mustard",
  "Chickpea",
  "Millets"
];

export const cropProfiles: Record<CropName, CropProfile> = {
  Wheat: {
    crop: "Wheat",
    season: "Rabi",
    sowingWindow: "Late October to November",
    harvestDays: 130,
    irrigationIntervalDays: 18,
    waterNeed: "moderate",
    fertilizerDays: [0, 22, 45],
    sprayDays: [35, 62, 88],
    criticalStages: [
      { day: 21, label: "Crown root initiation" },
      { day: 65, label: "Heading" },
      { day: 95, label: "Grain filling" }
    ]
  },
  Rice: {
    crop: "Rice",
    season: "Kharif",
    sowingWindow: "June to July",
    harvestDays: 120,
    irrigationIntervalDays: 7,
    waterNeed: "high",
    fertilizerDays: [0, 25, 50, 75],
    sprayDays: [28, 52, 78],
    criticalStages: [
      { day: 28, label: "Tillering" },
      { day: 65, label: "Panicle initiation" },
      { day: 92, label: "Flowering" }
    ]
  },
  Soybean: {
    crop: "Soybean",
    season: "Kharif",
    sowingWindow: "June to early July",
    harvestDays: 105,
    irrigationIntervalDays: 14,
    waterNeed: "moderate",
    fertilizerDays: [0, 25],
    sprayDays: [25, 48, 70],
    criticalStages: [
      { day: 35, label: "Flowering" },
      { day: 68, label: "Pod filling" }
    ]
  },
  Cotton: {
    crop: "Cotton",
    season: "Kharif",
    sowingWindow: "April to June",
    harvestDays: 180,
    irrigationIntervalDays: 12,
    waterNeed: "moderate",
    fertilizerDays: [0, 30, 60, 90],
    sprayDays: [35, 58, 82, 110, 140],
    criticalStages: [
      { day: 55, label: "Square formation" },
      { day: 85, label: "Flowering" },
      { day: 125, label: "Boll development" }
    ]
  },
  Maize: {
    crop: "Maize",
    season: "Kharif or Rabi",
    sowingWindow: "June to July or October",
    harvestDays: 105,
    irrigationIntervalDays: 12,
    waterNeed: "moderate",
    fertilizerDays: [0, 25, 45],
    sprayDays: [25, 48, 68],
    criticalStages: [
      { day: 45, label: "Knee-high stage" },
      { day: 65, label: "Tasseling" },
      { day: 80, label: "Grain filling" }
    ]
  },
  Sugarcane: {
    crop: "Sugarcane",
    season: "Annual",
    sowingWindow: "February to March or September to October",
    harvestDays: 360,
    irrigationIntervalDays: 10,
    waterNeed: "high",
    fertilizerDays: [0, 45, 90, 135],
    sprayDays: [45, 80, 130, 190, 250],
    criticalStages: [
      { day: 60, label: "Tillering" },
      { day: 150, label: "Grand growth" },
      { day: 285, label: "Maturity" }
    ]
  },
  Tomato: {
    crop: "Tomato",
    season: "Rabi or protected cultivation",
    sowingWindow: "August to October or January",
    harvestDays: 95,
    irrigationIntervalDays: 5,
    waterNeed: "high",
    fertilizerDays: [0, 18, 38, 58],
    sprayDays: [18, 32, 48, 65, 82],
    criticalStages: [
      { day: 28, label: "Vegetative growth" },
      { day: 48, label: "Flowering" },
      { day: 70, label: "Fruit development" }
    ]
  },
  Potato: {
    crop: "Potato",
    season: "Rabi",
    sowingWindow: "October to November",
    harvestDays: 105,
    irrigationIntervalDays: 8,
    waterNeed: "moderate",
    fertilizerDays: [0, 25, 45],
    sprayDays: [25, 42, 58, 75],
    criticalStages: [
      { day: 30, label: "Stolon formation" },
      { day: 55, label: "Tuber initiation" },
      { day: 82, label: "Tuber bulking" }
    ]
  },
  Onion: {
    crop: "Onion",
    season: "Rabi",
    sowingWindow: "October to December",
    harvestDays: 125,
    irrigationIntervalDays: 9,
    waterNeed: "moderate",
    fertilizerDays: [0, 30, 55],
    sprayDays: [30, 50, 75, 95],
    criticalStages: [
      { day: 45, label: "Vegetative growth" },
      { day: 85, label: "Bulb formation" }
    ]
  },
  Mustard: {
    crop: "Mustard",
    season: "Rabi",
    sowingWindow: "October to November",
    harvestDays: 115,
    irrigationIntervalDays: 20,
    waterNeed: "low",
    fertilizerDays: [0, 28],
    sprayDays: [35, 60, 82],
    criticalStages: [
      { day: 40, label: "Branching" },
      { day: 62, label: "Flowering" },
      { day: 88, label: "Pod filling" }
    ]
  },
  Chickpea: {
    crop: "Chickpea",
    season: "Rabi",
    sowingWindow: "October to November",
    harvestDays: 110,
    irrigationIntervalDays: 22,
    waterNeed: "low",
    fertilizerDays: [0],
    sprayDays: [32, 58, 82],
    criticalStages: [
      { day: 40, label: "Flowering" },
      { day: 72, label: "Pod development" }
    ]
  },
  Millets: {
    crop: "Millets",
    season: "Kharif",
    sowingWindow: "June to July",
    harvestDays: 90,
    irrigationIntervalDays: 16,
    waterNeed: "low",
    fertilizerDays: [0, 25],
    sprayDays: [30, 55],
    criticalStages: [
      { day: 35, label: "Tillering" },
      { day: 58, label: "Flowering" },
      { day: 75, label: "Grain filling" }
    ]
  }
};
