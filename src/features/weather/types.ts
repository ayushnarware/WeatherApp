export type LocationSource = "gps" | "search" | "saved";

export interface FarmLocation {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  source: LocationSource;
}

export interface MoonPhase {
  name: string;
  value: number;
  illumination: number;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  pressure: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  precipitation: number;
  rain: number;
  cloudCover: number;
  weatherCode: number;
  weatherLabel: string;
  isDay: boolean;
  uvIndex: number | null;
  visibilityKm: number | null;
  rainProbability: number | null;
}

export interface HourlyWeather {
  time: string;
  label: string;
  temperature: number;
  humidity: number;
  rainProbability: number;
  precipitation: number;
  rain: number;
  pressure: number;
  surfacePressure: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  uvIndex: number | null;
  visibilityKm: number | null;
  cloudCover: number;
  weatherCode: number;
  weatherLabel: string;
}

export interface DailyWeather {
  date: string;
  weatherCode: number;
  weatherLabel: string;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number | null;
  precipitationSum: number;
  rainSum: number;
  rainProbabilityMax: number;
  windSpeedMax: number;
  windGustMax: number;
  evapotranspiration: number | null;
  daylightHours: number | null;
  moonPhase: MoonPhase;
}

export interface AirQuality {
  time: string;
  usAqi: number | null;
  pm10: number | null;
  pm25: number | null;
  carbonMonoxide: number | null;
  nitrogenDioxide: number | null;
  sulphurDioxide: number | null;
  ozone: number | null;
  label: string;
}

export interface WeatherBundle {
  location: FarmLocation;
  timezone: string;
  fetchedAt: string;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  airQuality: AirQuality | null;
}
