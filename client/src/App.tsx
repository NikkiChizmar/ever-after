import { Navigate, Route, Routes } from 'react-router-dom';

import { Background } from '@/components/layout/Background';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import BudgetCenterPage from '@/features/budget/pages/BudgetCenterPage';
import AwaitingTasksPage from '@/features/tasks/pages/AwaitingTasksPage';
import VendorsPage from '@/features/vendors/pages/VendorsPage';
import { HomeRedirect } from '@/features/weddings/components/HomeRedirect';
import DashboardPage from '@/features/weddings/pages/DashboardPage';
import WelcomePage from '@/features/weddings/pages/WelcomePage';
import { DEMO_MODE } from '@/lib/demo';

export default function App() {
  return (
    <>
      <DemoBanner />

      {/* One instance for the whole app — every route (public or behind
       * RequireAuth) renders on top of it, so no page has to remember to
       * include it. */}
      <Background />

      <Routes>
        {/* Public — except in the demo build, where there's no real login
         * at all (every visitor is silently the same fixed viewer account;
         * see server/src/middleware/auth.ts), so these routes would just
         * be confusing dead ends rather than a way in. */}
        <Route path="/login" element={DEMO_MODE ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={DEMO_MODE ? <Navigate to="/" replace /> : <RegisterPage />} />

        {/* Authenticated — RequireAuth renders the AppShell around each page */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/w/:weddingId" element={<DashboardPage />} />
          <Route path="/w/:weddingId/budget" element={<BudgetCenterPage />} />
          <Route path="/w/:weddingId/vendors" element={<VendorsPage />} />
          <Route path="/w/:weddingId/tasks" element={<AwaitingTasksPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
