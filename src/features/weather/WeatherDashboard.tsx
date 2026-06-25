import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Moon,
  Navigation,
  Sunrise,
  Sunset,
  ThermometerSun,
  Waves,
  Wind
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useMemo } from "react";
import { useAppState } from "@/app/AppState";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { buildFarmAdvisory, weeklyInsights } from "@/features/advisor/engine";
import type { Recommendation, RiskLevel } from "@/features/advisor/types";
import { generateCropCalendar, todaysTasks } from "@/features/calendar/cropCalendar";
import { DualText, riskHindi, text, weatherUi } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/utils";
import { useWeather } from "./hooks";
import type { DailyWeather, HourlyWeather, WeatherBundle } from "./types";
import { getWeatherEmoji, getWeatherHindiLabel } from "./weather-codes";

const riskVariant: Record<RiskLevel, "success" | "warning" | "danger" | "info"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger"
};

function sectionAnimation(index = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.05, duration: 0.35 }
  };
}

function NoLocationState() {
  const { language } = useAppState();
  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>
          <DualText hi={weatherUi.noLocationTitle.hi} en={weatherUi.noLocationTitle.en} language={language} />
        </CardTitle>
        <CardDescription>
          {text(weatherUi.noLocationDesc, language)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100">
          {text(weatherUi.noMock, language)}
        </Alert>
      </CardContent>
    </Card>
  );
}

function LoadingDashboard() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-56" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

function CurrentWeatherHero({ weather }: { weather: WeatherBundle }) {
  const current = weather.current;
  const { language } = useAppState();
  const locationLabel = [weather.location.name, weather.location.admin1, weather.location.country].filter(Boolean).join(", ");
  const weatherLabel = language === "hi" ? getWeatherHindiLabel(current.weatherCode) : current.weatherLabel;

  return (
    <motion.section {...sectionAnimation()} className="overflow-hidden rounded-lg border border-white/50 bg-card/82 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-card/70">
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.2fr_.8fr] lg:p-7">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                <Activity className="h-3 w-3" />
                {text(weatherUi.liveOpenMeteo, language)}
              </Badge>
              <Badge variant="outline">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </Badge>
            </div>
            <div className="mt-5 flex items-center gap-4 sm:items-end">
              <div className="text-6xl leading-none sm:text-7xl" aria-hidden="true">
                {getWeatherEmoji(current.weatherCode, current.isDay)}
              </div>
              <div className="text-6xl font-bold leading-none tracking-normal sm:text-7xl">{Math.round(current.temperature)}°C</div>
              <div className="pb-2">
                <p className="text-lg font-semibold sm:text-xl">{weatherLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {text(weatherUi.feelsLike, language)} {Math.round(current.apparentTemperature)}°C · {text(weatherUi.updated, language)}{" "}
                  {formatDate(weather.fetchedAt, { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <HeroSignal icon={CloudRain} label={`🌧️ ${text(weatherUi.rainChance, language)}`} value={`${formatNumber(current.rainProbability, 0)}%`} />
            <HeroSignal icon={Wind} label={`💨 ${text(weatherUi.wind, language)}`} value={`${formatNumber(current.windSpeed, 0)} km/h`} />
            <HeroSignal icon={Droplets} label={`💧 ${text(weatherUi.humidity, language)}`} value={`${formatNumber(current.humidity, 0)}%`} />
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-sm text-muted-foreground">{text(weatherUi.farmStatus, language)}</span>
            <Badge variant={current.rainProbability && current.rainProbability > 70 ? "warning" : "success"}>
              {current.rainProbability && current.rainProbability > 70 ? text(weatherUi.watchRain, language) : text(weatherUi.operational, language)}
            </Badge>
          </div>
          <SunMoonRow label={text(weatherUi.sunrise, language)} value={weather.daily[0]?.sunrise} icon={Sunrise} />
          <SunMoonRow label={text(weatherUi.sunset, language)} value={weather.daily[0]?.sunset} icon={Sunset} />
          <SunMoonRow label={text(weatherUi.moonPhase, language)} value={weather.daily[0]?.moonPhase.name} icon={Moon} />
          <div className="rounded-md bg-muted/60 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">☀️ {text(weatherUi.uv, language)}</span>
              <span className="font-semibold">{formatNumber(current.uvIndex, 1)}</span>
            </div>
            <Progress value={((current.uvIndex ?? 0) / 12) * 100} className="mt-2" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeroSignal({ icon: Icon, label, value }: { icon: typeof CloudRain; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/62 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function SunMoonRow({ label, value, icon: Icon }: { label: string; value?: string; icon: typeof Sunrise }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      <span className="text-sm font-semibold">
        {value && value.includes("T") ? formatDate(value, { hour: "numeric", minute: "2-digit" }) : value ?? "Unavailable"}
      </span>
    </div>
  );
}

function MetricGrid({ weather }: { weather: WeatherBundle }) {
  const current = weather.current;
  const { language } = useAppState();
  const metrics = [
    { label: `🌡️ ${text(weatherUi.pressure, language)}`, value: `${formatNumber(current.pressure, 0)} hPa`, icon: Gauge, tone: "text-sky-500" },
    { label: `👁️ ${text(weatherUi.visibility, language)}`, value: `${formatNumber(current.visibilityKm, 1)} km`, icon: Eye, tone: "text-cyan-500" },
    { label: `💨 ${text(weatherUi.windGust, language)}`, value: `${formatNumber(current.windGust, 0)} km/h`, icon: Navigation, tone: "text-amber-500" },
    { label: `☁️ ${text(weatherUi.cloudCover, language)}`, value: `${formatNumber(current.cloudCover, 0)}%`, icon: Waves, tone: "text-slate-500" },
    { label: `🌧️ ${text(weatherUi.rainToday, language)}`, value: `${formatNumber(weather.daily[0]?.rainSum, 1)} mm`, icon: CloudRain, tone: "text-blue-500" },
    { label: `🌙 ${text(weatherUi.moonLight, language)}`, value: `${formatNumber(weather.daily[0]?.moonPhase.illumination, 0)}%`, icon: Moon, tone: "text-violet-500" },
    {
      label: `🌬️ ${text(weatherUi.airQuality, language)}`,
      value: weather.airQuality?.usAqi ? `${weather.airQuality.usAqi} AQI` : "Unavailable",
      icon: Activity,
      tone: "text-emerald-500"
    },
    { label: language === "hi" ? "नीचे दबाव" : "Surface pressure", value: `${formatNumber(current.surfacePressure, 0)} hPa`, icon: Gauge, tone: "text-rose-500" }
  ];

  return (
    <motion.div {...sectionAnimation(1)} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-xl font-semibold">{metric.value}</p>
            </div>
            <metric.icon className={`h-6 w-6 ${metric.tone}`} />
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function RecommendationPanel({ recommendations }: { recommendations: Recommendation[] }) {
  const { language } = useAppState();
  return (
    <motion.div {...sectionAnimation(2)}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            <DualText hi={weatherUi.advisor.hi} en={weatherUi.advisor.en} language={language} />
          </CardTitle>
          <CardDescription>{text(weatherUi.advisorDesc, language)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.slice(0, 6).map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-background/62 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{language === "hi" ? item.titleHi : item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {language === "hi" ? item.reasonHi : item.reason}
                  </p>
                </div>
                <Badge variant={riskVariant[item.riskLevel]}>{language === "hi" ? riskHindi[item.riskLevel] : item.riskLevel}</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px] sm:items-center">
                <p className="text-sm font-medium">{language === "hi" ? item.actionHi : item.action}</p>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{text(weatherUi.confidence, language)}</span>
                    <span>{item.confidence}%</span>
                  </div>
                  <Progress value={item.confidence} />
                </div>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WeatherCharts({ hourly }: { hourly: HourlyWeather[] }) {
  const { language } = useAppState();
  const chartData = hourly.slice(0, 48).map((item) => ({
    time: formatDate(item.time, { hour: "numeric" }),
    temp: Number(item.temperature.toFixed(1)),
    rain: item.rainProbability,
    wind: Number(item.windSpeed.toFixed(1)),
    humidity: item.humidity
  }));

  return (
    <motion.div {...sectionAnimation(3)} className="grid gap-4 xl:grid-cols-3">
      <ChartCard title={text(weatherUi.rainTimeline, language)} description={text(weatherUi.next48, language)}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Bar dataKey="rain" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Rain %" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={text(weatherUi.tempTimeline, language)} description={language === "hi" ? "हर घंटे तापमान और नमी" : "Hourly temperature and humidity"}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Area dataKey="temp" type="monotone" stroke="#f97316" fill="#fed7aa" name="Temp C" />
            <Line dataKey="humidity" type="monotone" stroke="#22c55e" name="Humidity %" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={text(weatherUi.windTimeline, language)} description={text(weatherUi.sprayPlanning, language)}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Line dataKey="wind" type="monotone" stroke="#8b5cf6" strokeWidth={2} name="Wind km/h" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </motion.div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ForecastGrid({ daily }: { daily: DailyWeather[] }) {
  const { language } = useAppState();
  return (
    <motion.div {...sectionAnimation(4)}>
      <Card>
        <CardHeader>
          <CardTitle>
            <DualText hi={weatherUi.forecast16.hi} en={weatherUi.forecast16.en} language={language} />
          </CardTitle>
          <CardDescription>{text(weatherUi.forecastDesc, language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {daily.map((day) => (
              <article key={day.date} className="rounded-lg border border-border bg-background/62 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {formatDate(`${day.date}T12:00:00`, { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {language === "hi" ? getWeatherHindiLabel(day.weatherCode) : day.weatherLabel}
                    </p>
                  </div>
                  <Badge variant={day.rainProbabilityMax > 60 ? "warning" : "outline"}>{day.rainProbabilityMax}%</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <span className="rounded-md bg-muted/70 p-2">
                    <ThermometerSun className="mb-1 h-4 w-4 text-orange-500" />
                    {Math.round(day.temperatureMax)} / {Math.round(day.temperatureMin)}°C
                  </span>
                  <span className="rounded-md bg-muted/70 p-2">
                    <CloudRain className="mb-1 h-4 w-4 text-sky-500" />
                    {day.precipitationSum.toFixed(1)} mm
                  </span>
                  <span className="rounded-md bg-muted/70 p-2">
                    <Wind className="mb-1 h-4 w-4 text-violet-500" />
                    {Math.round(day.windSpeedMax)} km/h
                  </span>
                  <span className="rounded-md bg-muted/70 p-2">
                    <Moon className="mb-1 h-4 w-4 text-slate-500" />
                    {day.moonPhase.name}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsightsPanel({ weather }: { weather: WeatherBundle }) {
  const { language } = useAppState();
  const insights = weeklyInsights(weather);
  const cards = [
    { label: language === "hi" ? "इस हफ्ते बारिश" : "Rain this week", value: `${insights.totalRain.toFixed(1)} mm`, icon: CloudRain },
    { label: language === "hi" ? "गीले दिन" : "Wet days", value: `${insights.wetDays} / 7`, icon: Droplets },
    {
      label: language === "hi" ? "सबसे गर्म दिन" : "Hottest day",
      value: formatDate(`${insights.hottest.date}T12:00:00`, { weekday: "short" }),
      icon: ThermometerSun
    },
    {
      label: language === "hi" ? "छिड़काव समय" : "Spray window",
      value: insights.sprayWindow,
      icon: Wind
    }
  ];

  return (
    <motion.div {...sectionAnimation(5)} className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            <DualText hi={weatherUi.weekly.hi} en={weatherUi.weekly.en} language={language} />
          </CardTitle>
          <CardDescription>{language === "hi" ? "अगले 7 दिन की खेती planning." : "Planning signals from the next 7 days."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {cards.map((card) => (
            <div key={card.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/62 p-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <card.icon className="h-4 w-4 text-primary" />
                {card.label}
              </span>
              <span className="max-w-[55%] text-right text-sm font-semibold">{card.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <DualText hi={weatherUi.summary.hi} en={weatherUi.summary.en} language={language} />
          </CardTitle>
          <CardDescription>{language === "hi" ? "खेत के हिसाब से आसान सार।" : "Current farm-level interpretation."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
          {language === "hi" ? (
            <>
              <p>
                अभी मौसम {getWeatherHindiLabel(weather.current.weatherCode)} है, नमी {Math.round(weather.current.humidity)}% और हवा करीब{" "}
                {Math.round(weather.current.windSpeed)} km/h है।
              </p>
              <p>
                सिंचाई संकेत: <span className="font-semibold text-foreground">{insights.irrigationWindow}</span>. छिड़काव संकेत:{" "}
                <span className="font-semibold text-foreground">{insights.sprayWindow}</span>.
              </p>
            </>
          ) : (
            <>
              <p>
                The active forecast shows {weather.current.weatherLabel.toLowerCase()} with {Math.round(weather.current.humidity)}% humidity and wind near{" "}
                {Math.round(weather.current.windSpeed)} km/h.
              </p>
              <p>
                Irrigation outlook: <span className="font-semibold text-foreground">{insights.irrigationWindow}</span>. Spray outlook:{" "}
                <span className="font-semibold text-foreground">{insights.sprayWindow}</span>.
              </p>
            </>
          )}
          {weather.airQuality ? (
            <p>
              {language === "hi" ? "हवा गुणवत्ता" : "Air quality"} <span className="font-semibold text-foreground">{weather.airQuality.label}</span>
              {weather.airQuality.usAqi ? ` · US AQI ${weather.airQuality.usAqi}.` : "."}
            </p>
          ) : (
            <p>{language === "hi" ? "इस जगह AQI अभी उपलब्ध नहीं है।" : "Air quality is not available for this location right now."}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TasksPanel({ weather }: { weather: WeatherBundle }) {
  const { selectedCrop, sowingDate, language } = useAppState();
  const tasks = todaysTasks(generateCropCalendar(selectedCrop, sowingDate, weather));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <DualText hi={weatherUi.todayTasks.hi} en={weatherUi.todayTasks.en} language={language} />
        </CardTitle>
        <CardDescription>{text(weatherUi.todayTasksDesc, language)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            {text(weatherUi.noUrgent, language)}
          </Alert>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 rounded-lg border border-border bg-background/62 p-3">
              <CalendarCheck className="mt-1 h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{task.title}</p>
                  <Badge variant={task.status === "delayed" ? "warning" : "info"}>{task.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{task.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.weatherNote}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DashboardContent({ weather }: { weather: WeatherBundle }) {
  const { selectedCrop } = useAppState();
  const recommendations = useMemo(() => buildFarmAdvisory(weather, selectedCrop), [selectedCrop, weather]);

  return (
    <div className="grid gap-4">
      <CurrentWeatherHero weather={weather} />
      <MetricGrid weather={weather} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <RecommendationPanel recommendations={recommendations} />
        <TasksPanel weather={weather} />
      </div>
      <WeatherCharts hourly={weather.hourly} />
      <InsightsPanel weather={weather} />
      <ForecastGrid daily={weather.daily} />
    </div>
  );
}

export function DashboardPage() {
  const { location, language } = useAppState();
  const weather = useWeather(location);

  if (!location) return <NoLocationState />;
  if (weather.isLoading && !weather.data) return <LoadingDashboard />;
  if (weather.isError && !weather.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {text(weatherUi.couldNotLoad, language)}
          </CardTitle>
          <CardDescription>{weather.error instanceof Error ? weather.error.message : "Open-Meteo request failed."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>{text(weatherUi.checkInternet, language)}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {weather.isUsingCachedData && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          {text(weatherUi.cached, language)}
        </Alert>
      )}
      {weather.data && <DashboardContent weather={weather.data} />}
    </div>
  );
}
