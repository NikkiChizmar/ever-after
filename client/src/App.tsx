import { Navigate, Route, Routes } from 'react-router-dom';

import { RequireAuth } from '@/features/auth/components/RequireAuth';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import { HomeRedirect } from '@/features/weddings/components/HomeRedirect';
import DashboardPage from '@/features/weddings/pages/DashboardPage';
import WelcomePage from '@/features/weddings/pages/WelcomePage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated — RequireAuth renders the AppShell around each page */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/w/:weddingId" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
