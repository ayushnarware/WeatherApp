import { addDays, formatDate } from "@/lib/utils";
import type {
  AirQuality,
  CurrentWeather,
  DailyWeather,
  FarmLocation,
  HourlyWeather,
  MoonPhase,
  WeatherBundle
} from "./types";
import { getWeatherLabel } from "./weather-codes";

interface OpenMeteoForecast {
  timezone: string;
  current: Record<string, number | string>;
  hourly: Record<string, Array<number | string | null>>;
  daily: Record<string, Array<number | string | null>>;
}

interface AirQualityResponse {
  hourly?: Record<string, Array<number | string | null>>;
}

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
  }>;
}

const forecastCurrentVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "rain",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "surface_pressure",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m"
];

const forecastHourlyVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation_probability",
  "precipitation",
  "rain",
  "weather_code",
  "pressure_msl",
  "surface_pressure",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "uv_index",
  "visibility"
];

const forecastDailyVariables = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "sunrise",
  "sunset",
  "uv_index_max",
  "precipitation_sum",
  "rain_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "et0_fao_evapotranspiration",
  "daylight_duration"
];

const airQualityVariables = [
  "us_aqi",
  "pm10",
  "pm2_5",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone"
];

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url.toString());
  if (!response.ok) {
    let reason = response.statusText;
    try {
      const payload = (await response.json()) as { reason?: string };
      reason = payload.reason ?? reason;
    } catch {
      reason = response.statusText;
    }
    throw new Error(reason || "Open-Meteo request failed");
  }
  return (await response.json()) as T;
}

function readNumber(source: Record<string, number | string>, key: string, fallback = 0) {
  const value = source[key];
  return typeof value === "number" ? value : fallback;
}

function numberAt(source: Record<string, Array<number | string | null>>, key: string, index: number, fallback = 0) {
  const value = source[key]?.[index];
  return typeof value === "number" ? value : fallback;
}

function nullableNumberAt(source: Record<string, Array<number | string | null>>, key: string, index: number) {
  const value = source[key]?.[index];
  return typeof value === "number" ? value : null;
}

function stringAt(source: Record<string, Array<number | string | null>>, key: string, index: number, fallback = "") {
  const value = source[key]?.[index];
  return typeof value === "string" ? value : fallback;
}

function closestTimeIndex(times: Array<number | string | null>, target: string) {
  const targetMs = new Date(target).getTime();
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  times.forEach((time, index) => {
    if (typeof time !== "string") return;
    const distance = Math.abs(new Date(time).getTime() - targetMs);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function phaseForDate(date: Date): MoonPhase {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const synodicMonth = 29.530588853;
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const value = ((days % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * value)) / 2) * 100);
  const names = [
    { max: 0.03, name: "New moon" },
    { max: 0.22, name: "Waxing crescent" },
    { max: 0.28, name: "First quarter" },
    { max: 0.47, name: "Waxing gibbous" },
    { max: 0.53, name: "Full moon" },
    { max: 0.72, name: "Waning gibbous" },
    { max: 0.78, name: "Last quarter" },
    { max: 0.97, name: "Waning crescent" },
    { max: 1, name: "New moon" }
  ];
  return {
    name: names.find((item) => value <= item.max)?.name ?? "Moon phase",
    value: Number(value.toFixed(2)),
    illumination
  };
}

function normalizeHourly(data: OpenMeteoForecast): HourlyWeather[] {
  const times = data.hourly.time ?? [];
  return times
    .map((time, index) => {
      if (typeof time !== "string") return null;
      const code = numberAt(data.hourly, "weather_code", index);
      return {
        time,
        label: formatDate(time, { hour: "numeric", day: "numeric" }),
        temperature: numberAt(data.hourly, "temperature_2m", index),
        humidity: numberAt(data.hourly, "relative_humidity_2m", index),
        rainProbability: numberAt(data.hourly, "precipitation_probability", index),
        precipitation: numberAt(data.hourly, "precipitation", index),
        rain: numberAt(data.hourly, "rain", index),
        pressure: numberAt(data.hourly, "pressure_msl", index),
        surfacePressure: numberAt(data.hourly, "surface_pressure", index),
        windSpeed: numberAt(data.hourly, "wind_speed_10m", index),
        windDirection: numberAt(data.hourly, "wind_direction_10m", index),
        windGust: numberAt(data.hourly, "wind_gusts_10m", index),
        uvIndex: nullableNumberAt(data.hourly, "uv_index", index),
        visibilityKm: nullableNumberAt(data.hourly, "visibility", index)
          ? Number((numberAt(data.hourly, "visibility", index) / 1000).toFixed(1))
          : null,
        cloudCover: numberAt(data.hourly, "cloud_cover", index),
        weatherCode: code,
        weatherLabel: getWeatherLabel(code)
      } satisfies HourlyWeather;
    })
    .filter((item): item is HourlyWeather => Boolean(item));
}

function normalizeDaily(data: OpenMeteoForecast): DailyWeather[] {
  const times = data.daily.time ?? [];
  return times
    .map((date, index) => {
      if (typeof date !== "string") return null;
      const code = numberAt(data.daily, "weather_code", index);
      return {
        date,
        weatherCode: code,
        weatherLabel: getWeatherLabel(code),
        temperatureMax: numberAt(data.daily, "temperature_2m_max", index),
        temperatureMin: numberAt(data.daily, "temperature_2m_min", index),
        apparentTemperatureMax: numberAt(data.daily, "apparent_temperature_max", index),
        apparentTemperatureMin: numberAt(data.daily, "apparent_temperature_min", index),
        sunrise: stringAt(data.daily, "sunrise", index),
        sunset: stringAt(data.daily, "sunset", index),
        uvIndexMax: nullableNumberAt(data.daily, "uv_index_max", index),
        precipitationSum: numberAt(data.daily, "precipitation_sum", index),
        rainSum: numberAt(data.daily, "rain_sum", index),
        rainProbabilityMax: numberAt(data.daily, "precipitation_probability_max", index),
        windSpeedMax: numberAt(data.daily, "wind_speed_10m_max", index),
        windGustMax: numberAt(data.daily, "wind_gusts_10m_max", index),
        evapotranspiration: nullableNumberAt(data.daily, "et0_fao_evapotranspiration", index),
        daylightHours: nullableNumberAt(data.daily, "daylight_duration", index)
          ? Number((numberAt(data.daily, "daylight_duration", index) / 3600).toFixed(1))
          : null,
        moonPhase: phaseForDate(new Date(`${date}T12:00:00`))
      } satisfies DailyWeather;
    })
    .filter((item): item is DailyWeather => Boolean(item));
}

function normalizeCurrent(data: OpenMeteoForecast, hourly: HourlyWeather[]): CurrentWeather {
  const currentTime = typeof data.current.time === "string" ? data.current.time : new Date().toISOString();
  const nearestHourly = hourly[closestTimeIndex(data.hourly.time ?? [], currentTime)];
  const code = readNumber(data.current, "weather_code");

  return {
    time: currentTime,
    temperature: readNumber(data.current, "temperature_2m"),
    apparentTemperature: readNumber(data.current, "apparent_temperature"),
    humidity: readNumber(data.current, "relative_humidity_2m"),
    pressure: readNumber(data.current, "pressure_msl"),
    surfacePressure: readNumber(data.current, "surface_pressure"),
    windSpeed: readNumber(data.current, "wind_speed_10m"),
    windDirection: readNumber(data.current, "wind_direction_10m"),
    windGust: readNumber(data.current, "wind_gusts_10m"),
    precipitation: readNumber(data.current, "precipitation"),
    rain: readNumber(data.current, "rain"),
    cloudCover: readNumber(data.current, "cloud_cover"),
    weatherCode: code,
    weatherLabel: getWeatherLabel(code),
    isDay: readNumber(data.current, "is_day") === 1,
    uvIndex: nearestHourly?.uvIndex ?? null,
    visibilityKm: nearestHourly?.visibilityKm ?? null,
    rainProbability: nearestHourly?.rainProbability ?? null
  };
}

function normalizeAirQuality(data: AirQualityResponse | null): AirQuality | null {
  const hourly = data?.hourly;
  if (!hourly?.time?.length) return null;
  const index = closestTimeIndex(hourly.time, new Date().toISOString());
  const usAqi = nullableNumberAt(hourly, "us_aqi", index);
  let label = "Unavailable";
  if (usAqi !== null) {
    if (usAqi <= 50) label = "Good";
    else if (usAqi <= 100) label = "Moderate";
    else if (usAqi <= 150) label = "Unhealthy for sensitive groups";
    else if (usAqi <= 200) label = "Unhealthy";
    else label = "Very unhealthy";
  }

  return {
    time: stringAt(hourly, "time", index, new Date().toISOString()),
    usAqi,
    pm10: nullableNumberAt(hourly, "pm10", index),
    pm25: nullableNumberAt(hourly, "pm2_5", index),
    carbonMonoxide: nullableNumberAt(hourly, "carbon_monoxide", index),
    nitrogenDioxide: nullableNumberAt(hourly, "nitrogen_dioxide", index),
    sulphurDioxide: nullableNumberAt(hourly, "sulphur_dioxide", index),
    ozone: nullableNumberAt(hourly, "ozone", index),
    label
  };
}

export async function fetchWeatherBundle(location: FarmLocation): Promise<WeatherBundle> {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: "auto",
    forecast_days: "16",
    wind_speed_unit: "kmh",
    current: forecastCurrentVariables.join(","),
    hourly: forecastHourlyVariables.join(","),
    daily: forecastDailyVariables.join(",")
  }).toString();

  const airQualityUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  airQualityUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: "auto",
    forecast_days: "5",
    hourly: airQualityVariables.join(",")
  }).toString();

  const [forecast, airQuality] = await Promise.all([
    fetchJson<OpenMeteoForecast>(forecastUrl),
    fetchJson<AirQualityResponse>(airQualityUrl).catch(() => null)
  ]);

  const hourly = normalizeHourly(forecast);
  const daily = normalizeDaily(forecast);

  return {
    location,
    timezone: forecast.timezone,
    fetchedAt: new Date().toISOString(),
    current: normalizeCurrent(forecast, hourly),
    hourly,
    daily,
    airQuality: normalizeAirQuality(airQuality)
  };
}

export async function searchLocations(query: string): Promise<FarmLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: trimmed,
    count: "8",
    language: "en",
    format: "json"
  }).toString();

  const data = await fetchJson<GeocodingResponse>(url);
  return (data.results ?? []).map((item) => ({
    id: String(item.id),
    name: item.name,
    admin1: item.admin3 || item.admin2 || item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
    source: "search"
  }));
}

export function makeGpsLocation(latitude: number, longitude: number): FarmLocation {
  return {
    id: `gps-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
    name: "Current farm location",
    admin1: "Detected by browser",
    latitude,
    longitude,
    source: "gps"
  };
}

export function nextNDays(hourly: HourlyWeather[], days: number) {
  const end = addDays(new Date(), days).getTime();
  return hourly.filter((item) => new Date(item.time).getTime() <= end);
}
