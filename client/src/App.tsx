import { Navigate, Route, Routes } from 'react-router-dom';

import { Background } from '@/components/layout/Background';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import BudgetCenterPage from '@/features/budget/pages/BudgetCenterPage';
import { HomeRedirect } from '@/features/weddings/components/HomeRedirect';
import DashboardPage from '@/features/weddings/pages/DashboardPage';
import WelcomePage from '@/features/weddings/pages/WelcomePage';

export default function App() {
  return (
    <>
      {/* One instance for the whole app — every route (public or behind
       * RequireAuth) renders on top of it, so no page has to remember to
       * include it. */}
      <Background />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated — RequireAuth renders the AppShell around each page */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/w/:weddingId" element={<DashboardPage />} />
          <Route path="/w/:weddingId/budget" element={<BudgetCenterPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
