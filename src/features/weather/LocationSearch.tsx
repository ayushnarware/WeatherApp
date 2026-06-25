import { useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/app/AppState";
import { text, weatherUi } from "@/lib/i18n";
import { useLocationSearch } from "./hooks";
import type { FarmLocation } from "./types";

function locationLabel(location: FarmLocation | null) {
  if (!location) return "No location selected";
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

export function LocationSearch() {
  const { location, setLocation, setFarmLocation, geolocation, language } = useAppState();
  const [query, setQuery] = useState("");
  const results = useLocationSearch(query);
  const showResults = query.trim().length >= 2;

  const chooseLocation = (nextLocation: FarmLocation) => {
    setLocation(nextLocation);
    setFarmLocation(nextLocation);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text(weatherUi.search, language)}
            className="h-9 pl-9 text-xs sm:h-10 sm:text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 sm:h-10"
          onClick={geolocation.requestLocation}
          disabled={geolocation.status === "requesting"}
        >
          <LocateFixed className="h-4 w-4" />
          {text(weatherUi.detect, language)}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={location?.source === "gps" ? "success" : "info"}>
          <MapPin className="h-3 w-3" />
          {locationLabel(location)}
        </Badge>
        <span>{geolocation.message}</span>
      </div>
      {showResults && (
        <div className="absolute left-0 right-0 top-[4.8rem] z-40 overflow-hidden rounded-lg border border-border bg-background/95 shadow-glass backdrop-blur-xl">
          {results.isLoading && (
            <div className="p-3 text-sm text-muted-foreground">
              {language === "hi" ? "लाइव Open-Meteo जगह खोज रहा है..." : "Searching live Open-Meteo geocoding..."}
            </div>
          )}
          {!results.isLoading && results.data?.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">
              {language === "hi" ? "जगह नहीं मिली। पास का जिला खोजें।" : "No matching place found. Try a nearby district."}
            </div>
          )}
          {results.data?.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left text-sm transition last:border-b-0 hover:bg-accent"
              onClick={() => chooseLocation(item)}
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[item.admin1, item.country].filter(Boolean).join(", ")}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
