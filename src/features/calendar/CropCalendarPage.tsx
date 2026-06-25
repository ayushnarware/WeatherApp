import { useMemo } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CloudRain,
  FlaskConical,
  Leaf,
  Scissors,
  ShowerHead,
  Sprout,
  TimerReset
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppState } from "@/app/AppState";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cropProfiles } from "@/features/advisor/cropProfiles";
import { daysBetween, formatDate } from "@/lib/utils";
import { useWeather } from "@/features/weather/hooks";
import { generateCropCalendar, type CalendarTask, type TaskStatus, upcomingTasks } from "./cropCalendar";

const taskIcon = {
  Sowing: Sprout,
  Irrigation: ShowerHead,
  Fertilizer: FlaskConical,
  Spraying: Leaf,
  Harvest: Scissors
};

const statusVariant: Record<TaskStatus, "success" | "warning" | "info" | "outline"> = {
  completed: "success",
  due: "warning",
  upcoming: "info",
  delayed: "warning"
};

function statusLabel(status: TaskStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function TaskRow({ task }: { task: CalendarTask }) {
  const Icon = taskIcon[task.type];
  return (
    <article className="rounded-lg border border-border bg-background/62 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{task.title}</h3>
              <Badge variant={statusVariant[task.status]}>{statusLabel(task.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Day {task.day} - {formatDate(`${task.date}T12:00:00`, { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <p className="mt-2 text-sm leading-6">{task.action}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{task.weatherNote}</p>
          </div>
        </div>
        <Badge variant={task.riskLevel === "high" ? "danger" : task.riskLevel === "medium" ? "warning" : "success"}>
          {task.riskLevel} risk
        </Badge>
      </div>
    </article>
  );
}

function CalendarSummary({ tasks }: { tasks: CalendarTask[] }) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const due = tasks.filter((task) => task.status === "due").length;
  const delayed = tasks.filter((task) => task.status === "delayed").length;
  const progress = tasks.length ? (completed / tasks.length) * 100 : 0;

  const cards = [
    { label: "Completed", value: completed, icon: CheckCircle2 },
    { label: "Due now", value: due, icon: TimerReset },
    { label: "Weather delayed", value: delayed, icon: CloudRain },
    { label: "Total tasks", value: tasks.length, icon: CalendarDays }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            </div>
            <card.icon className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Crop cycle progress</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export function CropCalendarPage() {
  const { selectedCrop, sowingDate, location } = useAppState();
  const weather = useWeather(location);
  const profile = cropProfiles[selectedCrop];
  const tasks = useMemo(
    () => generateCropCalendar(selectedCrop, sowingDate, weather.data ?? null),
    [selectedCrop, sowingDate, weather.data]
  );
  const visibleTasks = upcomingTasks(tasks, 14);
  const dueAndDelayed = tasks.filter((task) => task.status === "due" || task.status === "delayed");
  const cropAge = daysBetween(new Date(`${sowingDate}T00:00:00`), new Date());

  return (
    <div className="grid gap-4">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-white/50 bg-card/82 p-5 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-card/70"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <Badge variant="success">
              <Sprout className="h-3 w-3" />
              {profile.season} crop
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-normal">{selectedCrop} Crop Calendar</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Automatically generated from the sowing date, crop profile, and current Open-Meteo forecast. Sowing window:
              {" "}{profile.sowingWindow}. Expected crop duration: {profile.harvestDays} days.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/62 p-4">
            <p className="text-sm text-muted-foreground">Crop age</p>
            <p className="mt-1 text-3xl font-semibold">{Math.max(0, cropAge)} days</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Sown on {formatDate(`${sowingDate}T12:00:00`, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </motion.section>

      <CalendarSummary tasks={tasks} />

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Weather-Based Recommendations</CardTitle>
            <CardDescription>Calendar decisions adjust when rain or wind makes work risky.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueAndDelayed.length === 0 ? (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
                No immediate task is due or delayed. Keep following field scouting routines.
              </Alert>
            ) : (
              dueAndDelayed.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Irrigation, fertilizer, spraying, and harvest timeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critical Growth Stages</CardTitle>
          <CardDescription>Crop-specific moments that need extra weather attention.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {profile.criticalStages.map((stage) => (
            <div key={stage.label} className="rounded-lg border border-border bg-background/62 p-4">
              <p className="text-sm font-semibold">{stage.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">Around day {stage.day} after sowing</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Watch rain, wind, and humidity before irrigation, fertilizer, or spray decisions.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
