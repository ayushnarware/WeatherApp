import { NavLink } from "react-router-dom";
import { CalendarDays, CloudSun, Languages, Leaf, Map, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppState } from "@/app/AppState";
import { cropNames } from "@/features/advisor/cropProfiles";
import type { CropName } from "@/features/advisor/types";
import { LocationSearch } from "@/features/weather/LocationSearch";
import { cropHindi, DualText, text, weatherUi } from "@/lib/i18n";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/", label: weatherUi.dashboard, icon: CloudSun },
  { href: "/calendar", label: weatherUi.calendar, icon: CalendarDays },
  { href: "/map", label: weatherUi.map, icon: Map }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { selectedCrop, setSelectedCrop, sowingDate, setSowingDate, language, setLanguage } = useAppState();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(34,197,94,.12),rgba(14,165,233,.10)_35%,rgba(245,158,11,.10)_70%,rgba(244,63,94,.08))] dark:bg-[linear-gradient(135deg,rgba(34,197,94,.11),rgba(14,165,233,.08)_35%,rgba(245,158,11,.08)_70%,rgba(244,63,94,.07))]" />
      <aside className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/92 px-2 py-2 shadow-lg backdrop-blur-xl lg:left-0 lg:top-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-t-0 lg:px-4 lg:py-5">
        <div className="hidden items-center gap-3 px-2 lg:flex">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">{text(weatherUi.appShort, language)}</p>
            <p className="text-xs text-muted-foreground">{language === "hi" ? weatherUi.appShort.en : weatherUi.appShort.hi}</p>
          </div>
        </div>
        <nav className="grid grid-cols-3 gap-2 lg:mt-8 lg:flex lg:flex-col" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                [
                  "flex min-h-14 items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition lg:min-h-0 lg:justify-start lg:gap-2 lg:px-3 lg:text-sm",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                ].join(" ")
              }
            >
              <item.icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
              <DualText hi={item.label.hi} en={item.label.en} language={language} className="items-center text-center lg:items-start lg:text-left" />
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden rounded-lg border border-border bg-card/70 p-3 lg:block">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Leaf className="h-4 w-4 text-emerald-500" />
            {text(weatherUi.browserOnly, language)}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {text(weatherUi.browserOnlyBody, language)}
          </p>
        </div>
      </aside>

      <main className="pb-24 lg:ml-72 lg:pb-0">
        <header className="sticky top-0 z-40 border-b border-border bg-background/88 px-3 py-3 backdrop-blur-xl sm:px-4 lg:px-8 lg:py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground sm:text-xs"
              >
                <Sprout className="h-4 w-4 text-emerald-500" />
                {text(weatherUi.liveFarm, language)}
              </motion.div>
                <h1 className="mt-1 text-xl font-bold tracking-normal sm:text-3xl">
                  <DualText hi={weatherUi.appName.hi} en={weatherUi.appName.en} language={language} subClassName="hidden sm:block" />
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 xl:hidden">
                <LanguageSwitch language={language} setLanguage={setLanguage} />
                <ThemeToggle />
              </div>
            </div>
            <div className="flex flex-col gap-2 xl:min-w-[720px]">
              <div className="flex flex-col gap-2 md:flex-row">
                <LocationSearch />
                <div className="hidden gap-2 xl:flex">
                  <LanguageSwitch language={language} setLanguage={setLanguage} />
                  <ThemeToggle />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="min-w-0">
                  <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{text(weatherUi.crop, language)}</span>
                  <Select value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value as CropName)} className="h-9 text-xs sm:text-sm">
                    {cropNames.map((crop) => (
                      <option key={crop} value={crop}>
                        {language === "hi" ? `${cropHindi[crop]} / ${crop}` : `${crop} / ${cropHindi[crop]}`}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="min-w-0">
                  <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">{text(weatherUi.sowingDate, language)}</span>
                  <Input type="date" value={sowingDate} onChange={(event) => setSowingDate(event.target.value)} className="h-9 text-xs sm:text-sm" />
                </label>
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 py-6 lg:px-8">{children}</div>
      </main>
      <Button asChild className="sr-only">
        <a href="#main-content">Skip to content</a>
      </Button>
    </div>
  );
}

function LanguageSwitch({
  language,
  setLanguage
}: {
  language: "hi" | "en";
  setLanguage: (language: "hi" | "en") => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-10 px-3"
      onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
      title="Hindi / English"
    >
      <Languages className="h-4 w-4" />
      {language === "hi" ? "हिं" : "EN"}
    </Button>
  );
}
