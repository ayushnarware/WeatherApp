import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { toIsoDate } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { makeGpsLocation } from "@/features/weather/openMeteo";
import type { FarmLocation } from "@/features/weather/types";
import type { CropName } from "@/features/advisor/types";

export type Language = "hi" | "en";

interface AppStateValue {
  location: FarmLocation | null;
  farmLocation: FarmLocation | null;
  selectedCrop: CropName;
  sowingDate: string;
  language: Language;
  geolocation: ReturnType<typeof useGeolocation>;
  setLocation: (location: FarmLocation) => void;
  setFarmLocation: (location: FarmLocation) => void;
  setSelectedCrop: (crop: CropName) => void;
  setSowingDate: (date: string) => void;
  setLanguage: (language: Language) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const geolocation = useGeolocation();
  const [location, setLocation] = useLocalStorage<FarmLocation | null>("smart-farmer:active-location", null);
  const [farmLocation, setFarmLocation] = useLocalStorage<FarmLocation | null>("smart-farmer:farm-location", null);
  const [selectedCrop, setSelectedCrop] = useLocalStorage<CropName>("smart-farmer:crop", "Rice");
  const [sowingDate, setSowingDate] = useLocalStorage("smart-farmer:sowing-date", toIsoDate(new Date()));
  const [language, setLanguage] = useLocalStorage<Language>("smart-farmer:language", "hi");

  useEffect(() => {
    if (!location && geolocation.status === "idle") {
      geolocation.requestLocation();
    }
  }, [geolocation, location]);

  useEffect(() => {
    if (!geolocation.coords || location) return;
    const gpsLocation = makeGpsLocation(geolocation.coords.latitude, geolocation.coords.longitude);
    setLocation(gpsLocation);
    if (!farmLocation) setFarmLocation(gpsLocation);
  }, [farmLocation, geolocation.coords, location, setFarmLocation, setLocation]);

  const value = useMemo<AppStateValue>(
    () => ({
      location,
      farmLocation,
      selectedCrop,
      sowingDate,
      language,
      geolocation,
      setLocation,
      setFarmLocation,
      setSelectedCrop,
      setSowingDate,
      setLanguage
    }),
    [
      farmLocation,
      geolocation,
      language,
      location,
      selectedCrop,
      setFarmLocation,
      setLanguage,
      setLocation,
      setSelectedCrop,
      setSowingDate,
      sowingDate
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
