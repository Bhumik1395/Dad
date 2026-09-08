import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import DashboardShell from "./components/layout/DashboardShell";
import FocusMode from "./pages/FocusMode";
import QuarterlyAnalysis from "./pages/QuarterlyAnalysis";
import EmployeeAnalysis from "./pages/EmployeeAnalysis";
import EngineerUtilization from "./pages/EngineerUtilization";
import UploadPage from "./pages/UploadPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<Navigate to="focus" replace />} />
          <Route path="focus" element={<FocusMode />} />
          <Route path="quarterly" element={<QuarterlyAnalysis />} />
          <Route path="employees" element={<EmployeeAnalysis />} />
          <Route path="utilization" element={<EngineerUtilization />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}