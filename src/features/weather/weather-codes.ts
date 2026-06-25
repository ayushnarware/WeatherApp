export const weatherCodeLabels: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail"
};

export const weatherCodeHindiLabels: Record<number, string> = {
  0: "साफ आसमान",
  1: "ज्यादातर साफ",
  2: "हल्के बादल",
  3: "घने बादल",
  45: "कोहरा",
  48: "घना कोहरा",
  51: "हल्की बूंदाबांदी",
  53: "बूंदाबांदी",
  55: "तेज बूंदाबांदी",
  56: "ठंडी बूंदाबांदी",
  57: "घनी ठंडी बूंदाबांदी",
  61: "हल्की बारिश",
  63: "बारिश",
  65: "तेज बारिश",
  66: "ठंडी बारिश",
  67: "तेज ठंडी बारिश",
  71: "हल्की बर्फ",
  73: "बर्फबारी",
  75: "तेज बर्फबारी",
  77: "बर्फ के दाने",
  80: "हल्की बारिश की बौछार",
  81: "बारिश की बौछार",
  82: "तेज बारिश की बौछार",
  85: "हल्की बर्फ बौछार",
  86: "तेज बर्फ बौछार",
  95: "आंधी-तूफान",
  96: "ओलों के साथ तूफान",
  99: "तेज ओलों वाला तूफान"
};

export function getWeatherLabel(code: number | null | undefined) {
  if (code === null || code === undefined) return "Weather unavailable";
  return weatherCodeLabels[code] ?? "Variable weather";
}

export function getWeatherHindiLabel(code: number | null | undefined) {
  if (code === null || code === undefined) return "मौसम उपलब्ध नहीं";
  return weatherCodeHindiLabels[code] ?? "बदलता मौसम";
}

export function getWeatherEmoji(code: number | null | undefined, isDay = true) {
  if (code === null || code === undefined) return "🌾";
  if (code === 0 || code === 1) return isDay ? "☀️" : "🌙";
  if (code === 2) return isDay ? "🌤️" : "☁️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️";
  if (code >= 71 && code <= 86) return "❄️";
  if (code >= 95) return "⛈️";
  return "🌾";
}
