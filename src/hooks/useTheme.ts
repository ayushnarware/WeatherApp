import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStorage<Theme>("smart-farmer:theme", "dark"));

  useEffect(() => {
    const listener = ((event: CustomEvent<{ theme: Theme }>) => {
      setThemeState(event.detail.theme);
    }) as EventListener;
    window.addEventListener("smart-farmer-theme", listener);
    return () => window.removeEventListener("smart-farmer-theme", listener);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    writeStorage("smart-farmer:theme", nextTheme);
    setThemeState(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
  };

  return { theme, setTheme };
}
