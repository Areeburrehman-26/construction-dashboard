import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AlertsActionsPage } from "./pages/AlertsActionsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { InspectionDetailPage } from "./pages/InspectionDetailPage";
import { LiveMonitoringPage } from "./pages/LiveMonitoringPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SafetyTrendsPage } from "./pages/SafetyTrendsPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LiveMonitoringPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<InspectionDetailPage />} />
        <Route path="/trends" element={<SafetyTrendsPage />} />
        <Route path="/alerts" element={<AlertsActionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
