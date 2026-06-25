import { useCallback, useState } from "react";

export type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [message, setMessage] = useState("Use your location or search for a village, city, or district.");

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      setMessage("Location is not supported by this browser. Search for your farm area instead.");
      return;
    }

    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("granted");
        setMessage("Live weather is using your detected location.");
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setStatus(denied ? "denied" : "error");
        setMessage(
          denied
            ? "Location permission was denied. Search any village, city, or district to continue."
            : "Location could not be detected. Search for your farm area to continue."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 60 * 10,
        timeout: 10000
      }
    );
  }, []);

  return { status, coords, message, requestLocation };
}
