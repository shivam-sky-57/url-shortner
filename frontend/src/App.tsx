import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analytics/:shortCode" element={<AnalyticsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
