/**
 * Top-level router configuration. All pages are lazy-loaded behind Suspense
 * so the initial bundle only carries the auth + shell code.
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { RequireAuth } from '@/hooks/useAuth';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const LiveDetection = lazy(() =>
  import('@/pages/LiveDetection').then((m) => ({ default: m.LiveDetection })),
);
const History = lazy(() => import('@/pages/History').then((m) => ({ default: m.History })));
const Analytics = lazy(() =>
  import('@/pages/Analytics').then((m) => ({ default: m.Analytics })),
);
const Settings = lazy(() =>
  import('@/pages/Settings').then((m) => ({ default: m.Settings })),
);
const NotFound = lazy(() =>
  import('@/pages/NotFound').then((m) => ({ default: m.NotFound })),
);

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: ROUTES.login, element: <Login /> }],
  },
  {
    element: (
      <RequireAuth>
        <AppLayout>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </AppLayout>
      </RequireAuth>
    ),
    children: [
      { path: ROUTES.dashboard, element: <Dashboard /> },
      { path: ROUTES.live, element: <LiveDetection /> },
      { path: ROUTES.history, element: <History /> },
      { path: ROUTES.analytics, element: <Analytics /> },
      { path: ROUTES.settings, element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.dashboard} replace /> },
  { path: '/404', element: <NotFound /> },
]);