import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AssessmentsPage from "./pages/AssessmentsPage.jsx";
import HomePage from "./pages/HomePage.jsx";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
