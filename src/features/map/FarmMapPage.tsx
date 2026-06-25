import { useMemo, useState } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import {
  CalendarDays,
  Cloud,
  CloudRain,
  Droplets,
  LocateFixed,
  MapPin,
  Navigation,
  ThermometerSun,
  Wind
} from "lucide-react";
import { useAppState } from "@/app/AppState";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getWeatherEmoji, getWeatherHindiLabel } from "@/features/weather/weather-codes";
import { useWeather } from "@/features/weather/hooks";
import type { DailyWeather, FarmLocation, HourlyWeather, WeatherBundle } from "@/features/weather/types";
import { DualText, text, weatherUi } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/utils";

function markerIcon(color: string) {
  return L.divIcon({
    className: "smart-marker",
    html: `<span style="background:${color}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function cloudIcon(opacity: number, size: number) {
  return L.divIcon({
    className: "smart-cloud-marker",
    html: `<span style="opacity:${opacity};font-size:${size}px">☁️</span>`,
    iconSize: [size + 12, size + 12],
    iconAnchor: [(size + 12) / 2, (size + 12) / 2]
  });
}

function arrowIcon(bearing: number) {
  return L.divIcon({
    className: "smart-arrow-marker",
    html: `<span style="transform:rotate(${bearing}deg)">➜</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

function FarmMarkerSetter({ onSet }: { onSet: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onSet(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

function cloneLocation(location: FarmLocation, latitude: number, longitude: number): FarmLocation {
  return {
    ...location,
    id: `farm-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
    name: "Farm marker",
    admin1: location.name,
    latitude,
    longitude,
    source: "saved"
  };
}

function offsetCoordinate(latitude: number, longitude: number, distanceKm: number, bearingDegrees: number) {
  const radiusKm = 6371;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (latitude * Math.PI) / 180;
  const lon1 = (longitude * Math.PI) / 180;
  const ratio = distanceKm / radiusKm;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(ratio) + Math.cos(lat1) * Math.sin(ratio) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(ratio) * Math.cos(lat1),
      Math.cos(ratio) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [Number(((lat2 * 180) / Math.PI).toFixed(6)), Number(((lon2 * 180) / Math.PI).toFixed(6))] as [number, number];
}

function average(items: number[]) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + item, 0) / items.length;
}

function averageWindDirection(hours: HourlyWeather[], fallback: number) {
  if (!hours.length) return fallback;
  const vectors = hours.reduce(
    (acc, hour) => {
      const radians = (hour.windDirection * Math.PI) / 180;
      return {
        x: acc.x + Math.cos(radians),
        y: acc.y + Math.sin(radians)
      };
    },
    { x: 0, y: 0 }
  );
  return (Math.atan2(vectors.y, vectors.x) * 180) / Math.PI + 360;
}

function hoursForDate(weather: WeatherBundle, date: string) {
  return weather.hourly.filter((hour) => hour.time.startsWith(date)).slice(0, 24);
}

function forecastForDate(weather: WeatherBundle, selectedDate: string | undefined) {
  const day = weather.daily.find((item) => item.date === selectedDate) ?? weather.daily[0];
  const hours = day ? hoursForDate(weather, day.date) : [];
  return { day, hours };
}

function DaySelector({
  weather,
  selectedDate,
  onSelect
}: {
  weather: WeatherBundle;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const { language } = useAppState();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <DualText hi="दिन चुनें" en="Choose date" language={language} />
        </CardTitle>
        <CardDescription>
          {language === "hi"
            ? "जिस तारीख पर टैप करेंगे, उसी दिन के 24 घंटे और map layer update होंगे।"
            : "Tap a date to update the 24-hour details and map layer for that day."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {weather.daily.map((day) => {
            const isSelected = day.date === selectedDate;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelect(day.date)}
                className={[
                  "min-w-[118px] rounded-lg border p-3 text-left transition",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background/62 hover:bg-accent"
                ].join(" ")}
              >
                <span className="text-2xl" aria-hidden="true">
                  {getWeatherEmoji(day.weatherCode, true)}
                </span>
                <span className="mt-2 block text-xs font-semibold">
                  {formatDate(`${day.date}T12:00:00`, { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className={["mt-1 block text-[11px]", isSelected ? "text-primary-foreground/80" : "text-muted-foreground"].join(" ")}>
                  {language === "hi" ? getWeatherHindiLabel(day.weatherCode) : day.weatherLabel}
                </span>
                <span className="mt-2 block text-sm font-bold">
                  {Math.round(day.temperatureMax)}° / {Math.round(day.temperatureMin)}°
                </span>
                <span className={["mt-1 block text-[11px]", isSelected ? "text-primary-foreground/80" : "text-muted-foreground"].join(" ")}>
                  🌧️ {day.rainProbabilityMax}% · ☁️ {formatNumber(day.precipitationSum, 1)} mm
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CloudTrackOverlay({
  weather,
  hours,
  day
}: {
  weather: WeatherBundle;
  hours: HourlyWeather[];
  day: DailyWeather;
}) {
  const center: [number, number] = [weather.location.latitude, weather.location.longitude];
  const avgCloud = average(hours.map((hour) => hour.cloudCover)) || weather.current.cloudCover;
  const avgWind = average(hours.map((hour) => hour.windSpeed)) || day.windSpeedMax || weather.current.windSpeed;
  const windFromDirection = averageWindDirection(hours, weather.current.windDirection) % 360;
  const movementBearing = (windFromDirection + 180) % 360;
  const trackLengthKm = Math.max(5, Math.min(18, 5 + avgWind * 0.35));
  const upwind = offsetCoordinate(center[0], center[1], trackLengthKm / 2, (movementBearing + 180) % 360);
  const downwind = offsetCoordinate(center[0], center[1], trackLengthKm / 2, movementBearing);
  const arrowPoint = offsetCoordinate(center[0], center[1], trackLengthKm * 0.62, movementBearing);
  const cloudOpacity = Math.max(0.35, Math.min(0.95, avgCloud / 100));
  const cloudSize = Math.round(24 + avgCloud / 4);
  const cloudPoints = [
    offsetCoordinate(center[0], center[1], trackLengthKm * 0.24, (movementBearing + 180) % 360),
    center,
    offsetCoordinate(center[0], center[1], trackLengthKm * 0.28, movementBearing)
  ];

  return (
    <>
      <Circle
        center={center}
        radius={2800 + avgCloud * 38}
        pathOptions={{
          color: "#64748b",
          fillColor: "#94a3b8",
          fillOpacity: Math.max(0.08, avgCloud / 650),
          weight: 1,
          dashArray: "8 10"
        }}
      />
      <Polyline
        positions={[upwind, center, downwind]}
        pathOptions={{
          color: avgCloud > 65 ? "#0ea5e9" : "#64748b",
          weight: 4,
          opacity: 0.75,
          dashArray: "12 12"
        }}
      />
      {cloudPoints.map((point, index) => (
        <Marker key={`${point[0]}-${point[1]}`} position={point} icon={cloudIcon(cloudOpacity - index * 0.08, cloudSize - index * 3)}>
          <Popup>
            <strong>Badal track / Cloud track</strong>
            <br />
            Cloud cover: {Math.round(avgCloud)}%
            <br />
            Movement: {Math.round(movementBearing)}°
          </Popup>
        </Marker>
      ))}
      <Marker position={arrowPoint} icon={arrowIcon(movementBearing)}>
        <Popup>
          <strong>Badal ki direction</strong>
          <br />
          Clouds moving around {Math.round(movementBearing)}°
          <br />
          Avg wind: {Math.round(avgWind)} km/h
        </Popup>
      </Marker>
    </>
  );
}

function DayDetailPanel({ day, hours }: { day: DailyWeather; hours: HourlyWeather[] }) {
  const { language } = useAppState();
  const avgCloud = average(hours.map((hour) => hour.cloudCover));
  const avgHumidity = average(hours.map((hour) => hour.humidity));
  const topRainHour = hours.reduce((max, hour) => (hour.rainProbability > max.rainProbability ? hour : max), hours[0] ?? null);

  const metrics = [
    {
      icon: ThermometerSun,
      label: { hi: "तापमान", en: "Temperature" },
      value: `${Math.round(day.temperatureMax)}° / ${Math.round(day.temperatureMin)}°C`
    },
    {
      icon: CloudRain,
      label: { hi: "बारिश", en: "Rain" },
      value: `${day.rainProbabilityMax}% · ${day.precipitationSum.toFixed(1)} mm`
    },
    {
      icon: Wind,
      label: { hi: "तेज हवा", en: "Wind max" },
      value: `${Math.round(day.windSpeedMax)} km/h`
    },
    {
      icon: Cloud,
      label: { hi: "बादल औसत", en: "Avg clouds" },
      value: `${Math.round(avgCloud)}%`
    },
    {
      icon: Droplets,
      label: { hi: "नमी औसत", en: "Avg humidity" },
      value: `${Math.round(avgHumidity)}%`
    },
    {
      icon: Navigation,
      label: { hi: "बारिश का समय", en: "Peak rain hour" },
      value: topRainHour ? formatDate(topRainHour.time, { hour: "numeric", minute: "2-digit" }) : "NA"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden="true">
                {getWeatherEmoji(day.weatherCode, true)}
              </span>
              <DualText
                hi={`${formatDate(`${day.date}T12:00:00`, { day: "numeric", month: "short" })} का पूरा मौसम`}
                en={`Full details for ${formatDate(`${day.date}T12:00:00`, { month: "short", day: "numeric" })}`}
                language={language}
              />
            </CardTitle>
            <CardDescription>
              {language === "hi" ? getWeatherHindiLabel(day.weatherCode) : day.weatherLabel} · {hours.length || 24} hour update
            </CardDescription>
          </div>
          <Badge variant={day.rainProbabilityMax > 65 ? "warning" : "success"}>
            {day.rainProbabilityMax > 65 ? (language === "hi" ? "बारिश संभव" : "Rain likely") : language === "hi" ? "काम संभव" : "Workable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label.en} className="rounded-lg border border-border bg-background/62 p-3">
              <metric.icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">{text(metric.label, language)}</p>
              <p className="text-lg font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">{language === "hi" ? "बादल कवरेज" : "Cloud cover"}</span>
            <span className="text-muted-foreground">{Math.round(avgCloud)}%</span>
          </div>
          <Progress value={avgCloud} />
        </div>
      </CardContent>
    </Card>
  );
}

function HourlyDayDetails({ hours }: { hours: HourlyWeather[] }) {
  const { language } = useAppState();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <DualText hi="24 घंटे की जानकारी" en="24-hour details" language={language} />
        </CardTitle>
        <CardDescription>
          {language === "hi" ? "हर घंटे बारिश, तापमान, हवा और बादल।" : "Hourly rain, temperature, wind, and clouds."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {hours.map((hour) => (
            <div key={hour.time} className="rounded-lg border border-border bg-background/62 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{formatDate(hour.time, { hour: "numeric", minute: "2-digit" })}</span>
                <span className="text-2xl" aria-hidden="true">
                  {getWeatherEmoji(hour.weatherCode, true)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {language === "hi" ? getWeatherHindiLabel(hour.weatherCode) : hour.weatherLabel}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span>🌡️ {Math.round(hour.temperature)}°C</span>
                <span>🌧️ {hour.rainProbability}%</span>
                <span>💨 {Math.round(hour.windSpeed)} km/h</span>
                <span>☁️ {hour.cloudCover}%</span>
                <span>💧 {hour.humidity}%</span>
                <span>👁️ {formatNumber(hour.visibilityKm, 1)} km</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FarmMapPage() {
  const { location, farmLocation, setFarmLocation, geolocation, language } = useAppState();
  const weather = useWeather(location);
  const center = farmLocation ?? location;
  const activeIcon = useMemo(() => markerIcon("#22c55e"), []);
  const farmIcon = useMemo(() => markerIcon("#f59e0b"), []);
  const [selectedDateState, setSelectedDate] = useState<string>();
  const selectedDate = selectedDateState ?? weather.data?.daily[0]?.date ?? "";
  const { day, hours } = weather.data ? forecastForDate(weather.data, selectedDate) : { day: undefined, hours: [] };

  if (!center) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <DualText hi="नक्शे के लिए लोकेशन चाहिए" en="Map needs a location" language={language} />
          </CardTitle>
          <CardDescription>
            {language === "hi"
              ? "अपनी लोकेशन detect करें या खेत का इलाका search करें।"
              : "Detect your location or search the farm area."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={geolocation.requestLocation}>
            <LocateFixed className="h-4 w-4" />
            {text(weatherUi.detect, language)}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {weather.data && selectedDate && (
        <DaySelector weather={weather.data} selectedDate={selectedDate} onSelect={setSelectedDate} />
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <DualText hi={weatherUi.mapTitle.hi} en={weatherUi.mapTitle.en} language={language} />
              </CardTitle>
              <CardDescription>{text(weatherUi.mapDesc, language)}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">
                <MapPin className="h-3 w-3" />
                {text(weatherUi.clickMap, language)}
              </Badge>
              <Badge variant="outline">
                <Cloud className="h-3 w-3" />
                {text(weatherUi.cloudTrack, language)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100">
            {text(weatherUi.cloudTrackDesc, language)}
          </Alert>
          <div className="overflow-hidden rounded-lg border border-border">
            <MapContainer
              center={[center.latitude, center.longitude]}
              zoom={12}
              scrollWheelZoom
              className="h-[66vh] min-h-[430px] w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FarmMarkerSetter
                onSet={(lat, lng) => {
                  const base = location ?? center;
                  setFarmLocation(cloneLocation(base, lat, lng));
                }}
              />
              {location && (
                <Marker position={[location.latitude, location.longitude]} icon={activeIcon}>
                  <Popup>
                    <strong>{language === "hi" ? "मौसम लोकेशन" : "Weather location"}</strong>
                    <br />
                    {location.name}
                  </Popup>
                </Marker>
              )}
              {farmLocation && (
                <Marker position={[farmLocation.latitude, farmLocation.longitude]} icon={farmIcon}>
                  <Popup>
                    <strong>{language === "hi" ? "खेत मार्कर" : "Farm marker"}</strong>
                    <br />
                    {farmLocation.latitude.toFixed(4)}, {farmLocation.longitude.toFixed(4)}
                  </Popup>
                </Marker>
              )}
              {weather.data && day && (
                <>
                  <Circle
                    center={[weather.data.location.latitude, weather.data.location.longitude]}
                    radius={2600}
                    pathOptions={{
                      color: day.rainProbabilityMax > 65 ? "#0ea5e9" : "#22c55e",
                      fillColor: day.rainProbabilityMax > 65 ? "#0ea5e9" : "#22c55e",
                      fillOpacity: 0.16,
                      weight: 2
                    }}
                  />
                  <Circle
                    center={[weather.data.location.latitude, weather.data.location.longitude]}
                    radius={5200}
                    pathOptions={{
                      color: day.windSpeedMax > 25 ? "#f59e0b" : "#14b8a6",
                      fillColor: day.windSpeedMax > 25 ? "#f59e0b" : "#14b8a6",
                      fillOpacity: 0.08,
                      weight: 1
                    }}
                  />
                  <CloudTrackOverlay weather={weather.data} day={day} hours={hours} />
                </>
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {weather.data && day ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <WeatherMapMetric icon={ThermometerSun} label={{ hi: "तापमान", en: "Temperature" }} value={`${Math.round(day.temperatureMax)}°C`} />
            <WeatherMapMetric icon={CloudRain} label={{ hi: "बारिश chance", en: "Rain chance" }} value={`${Math.round(day.rainProbabilityMax)}%`} />
            <WeatherMapMetric icon={Wind} label={{ hi: "हवा", en: "Wind speed" }} value={`${Math.round(day.windSpeedMax)} km/h`} />
            <WeatherMapMetric icon={Navigation} label={{ hi: "बादल दिशा", en: "Cloud direction" }} value={`${Math.round((averageWindDirection(hours, weather.data.current.windDirection) + 180) % 360)}°`} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
            <DayDetailPanel day={day} hours={hours} />
            <HourlyDayDetails hours={hours} />
          </div>
        </>
      ) : (
        <Alert>{language === "hi" ? "लाइव Open-Meteo डाटा आते ही map layer दिखेगी।" : "Weather layer will appear after live Open-Meteo data loads."}</Alert>
      )}
    </div>
  );
}

function WeatherMapMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ThermometerSun;
  label: { hi: string; en: string };
  value: string;
}) {
  const { language } = useAppState();
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{text(label, language)}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}
