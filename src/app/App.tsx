import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/weather/WeatherDashboard";
import { CropCalendarPage } from "@/features/calendar/CropCalendarPage";
import { FarmMapPage } from "@/features/map/FarmMapPage";


export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <div id="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CropCalendarPage />} />
            <Route path="/map" element={<FarmMapPage />} />
          </Routes>
        </div>
      </AppShell>
    </BrowserRouter>
  );
}
