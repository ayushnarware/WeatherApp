import { addDays, daysBetween, toIsoDate } from "@/lib/utils";
import type { WeatherBundle } from "@/features/weather/types";
import { cropProfiles } from "@/features/advisor/cropProfiles";
import type { CropName, RiskLevel } from "@/features/advisor/types";

export type TaskType = "Sowing" | "Irrigation" | "Fertilizer" | "Spraying" | "Harvest";
export type TaskStatus = "completed" | "due" | "upcoming" | "delayed";

export interface CalendarTask {
  id: string;
  type: TaskType;
  date: string;
  day: number;
  title: string;
  action: string;
  status: TaskStatus;
  riskLevel: RiskLevel;
  weatherNote: string;
}

function taskStatus(date: Date) {
  const delta = daysBetween(new Date(), date);
  if (delta < -2) return "completed";
  if (delta <= 1 && delta >= -2) return "due";
  return "upcoming";
}

function rainNext(weather: WeatherBundle | null, days: number) {
  if (!weather) return 0;
  return weather.daily.slice(0, days).reduce((sum, day) => sum + day.precipitationSum, 0);
}

function maxRainProbability(weather: WeatherBundle | null) {
  if (!weather) return 0;
  return Math.max(weather.current.rainProbability ?? 0, ...weather.daily.slice(0, 3).map((day) => day.rainProbabilityMax));
}

function maxWind(weather: WeatherBundle | null) {
  if (!weather) return 0;
  return Math.max(weather?.current.windSpeed ?? 0, ...(weather?.hourly.slice(0, 12).map((hour) => hour.windSpeed) ?? []));
}

function weatherDecision(type: TaskType, weather: WeatherBundle | null) {
  const rain3 = rainNext(weather, 3);
  const rainProbability = maxRainProbability(weather);
  const wind = maxWind(weather);

  if (type === "Irrigation") {
    if (rainProbability > 70 || rain3 > 12) {
      return {
        status: "delayed" as TaskStatus,
        riskLevel: "medium" as RiskLevel,
        note: "Rain is likely soon, so irrigation can be skipped or reduced."
      };
    }
    if (rain3 < 5) {
      return {
        status: null,
        riskLevel: "medium" as RiskLevel,
        note: "Dry weather supports irrigation after checking soil moisture."
      };
    }
  }

  if (type === "Spraying") {
    if (wind > 25 || rainProbability > 60) {
      return {
        status: "delayed" as TaskStatus,
        riskLevel: "high" as RiskLevel,
        note: "Wind or rain can reduce spray coverage; wait for a calm, dry slot."
      };
    }
  }

  if (type === "Fertilizer") {
    if (rain3 > 40) {
      return {
        status: "delayed" as TaskStatus,
        riskLevel: "high" as RiskLevel,
        note: "Heavy rain may leach nutrients; delay application."
      };
    }
  }

  if (type === "Harvest" && rainProbability > 50) {
    return {
      status: "delayed" as TaskStatus,
      riskLevel: "medium" as RiskLevel,
      note: "Harvest quality is safer in a dry window."
    };
  }

  return {
    status: null,
    riskLevel: "low" as RiskLevel,
    note: "Weather is acceptable for this task if field conditions are workable."
  };
}

function makeTask(
  crop: CropName,
  type: TaskType,
  sowing: Date,
  day: number,
  action: string,
  weather: WeatherBundle | null
): CalendarTask {
  const date = addDays(sowing, day);
  const decision = weatherDecision(type, weather);
  return {
    id: `${crop}-${type}-${day}`,
    type,
    date: toIsoDate(date),
    day,
    title: `${crop} ${type.toLowerCase()}`,
    action,
    status: decision.status ?? taskStatus(date),
    riskLevel: decision.riskLevel,
    weatherNote: decision.note
  };
}

export function generateCropCalendar(crop: CropName, sowingDate: string, weather: WeatherBundle | null) {
  const profile = cropProfiles[crop];
  const sowing = new Date(`${sowingDate}T00:00:00`);
  const tasks: CalendarTask[] = [
    makeTask(crop, "Sowing", sowing, 0, `Sow ${crop} in prepared soil during the local ${profile.season} window.`, weather)
  ];

  for (let day = profile.irrigationIntervalDays; day < profile.harvestDays; day += profile.irrigationIntervalDays) {
    tasks.push(makeTask(crop, "Irrigation", sowing, day, "Irrigate based on soil moisture, crop stage, and rainfall.", weather));
  }

  profile.fertilizerDays.forEach((day, index) => {
    const label = index === 0 ? "basal dose" : `top dressing ${index}`;
    tasks.push(makeTask(crop, "Fertilizer", sowing, day, `Apply ${label} as per soil test and local recommendation.`, weather));
  });

  profile.sprayDays.forEach((day) => {
    tasks.push(makeTask(crop, "Spraying", sowing, day, "Scout first, then spray only when pest or disease threshold is met.", weather));
  });

  tasks.push(makeTask(crop, "Harvest", sowing, profile.harvestDays, "Harvest when crop maturity and grain or produce quality are ready.", weather));

  return tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function todaysTasks(tasks: CalendarTask[]) {
  return tasks.filter((task) => task.status === "due" || task.status === "delayed").slice(0, 8);
}

export function upcomingTasks(tasks: CalendarTask[], limit = 8) {
  return tasks.filter((task) => task.status === "upcoming").slice(0, limit);
}
