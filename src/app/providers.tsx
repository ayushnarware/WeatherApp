import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppStateProvider } from "./AppState";

type Theme = "light" | "dark";

function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>("smart-farmer:theme", "dark");
  const [theme, setTheme] = useState(storedTheme);

  useEffect(() => {
    setTheme(storedTheme);
  }, [storedTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("smart-farmer-theme", { detail: { theme, setTheme: setStoredTheme } }));
  }, [setStoredTheme, theme]);

  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
