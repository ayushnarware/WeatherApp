import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { readStorage, writeStorage } from "@/lib/storage";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchWeatherBundle, searchLocations } from "./openMeteo";
import type { FarmLocation, WeatherBundle } from "./types";

const WEATHER_CACHE_KEY = "smart-farmer:last-weather";

function locationMatches(a: FarmLocation | null, b: FarmLocation | undefined) {
  if (!a || !b) return false;
  return Math.abs(a.latitude - b.latitude) < 0.02 && Math.abs(a.longitude - b.longitude) < 0.02;
}

export function readCachedWeather() {
  return readStorage<WeatherBundle | null>(WEATHER_CACHE_KEY, null);
}

export function useWeather(location: FarmLocation | null) {
  const cached = readCachedWeather();
  const query = useQuery({
    queryKey: ["weather", location?.latitude.toFixed(4), location?.longitude.toFixed(4)],
    enabled: Boolean(location),
    queryFn: () => fetchWeatherBundle(location as FarmLocation),
    initialData: locationMatches(location, cached?.location) ? cached ?? undefined : undefined,
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 20,
    retry: 1
  });

  useEffect(() => {
    if (query.data) writeStorage(WEATHER_CACHE_KEY, query.data);
  }, [query.data]);

  return {
    ...query,
    isUsingCachedData: Boolean(query.isError && query.data)
  };
}

export function useLocationSearch(query: string) {
  const debounced = useDebounce(query, 350);
  return useQuery({
    queryKey: ["location-search", debounced],
    queryFn: () => searchLocations(debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 1000 * 60 * 60
  });
}
