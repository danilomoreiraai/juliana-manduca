import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, domAnimation, LazyMotion, MotionConfig, m } from 'motion/react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { RouteSkeleton } from './components/MotionPrimitives';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);
const AuthCallbackPage = lazy(() =>
  import('./pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const MfaPage = lazy(() =>
  import('./pages/MfaPage').then((module) => ({ default: module.MfaPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/PasswordPages').then((module) => ({ default: module.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/PasswordPages').then((module) => ({ default: module.ResetPasswordPage })),
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<RouteSkeleton />}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-a-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/mfa" element={<MfaPage />} />
            </Route>
            <Route element={<ProtectedRoute admin />}>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </m.div>
      </AnimatePresence>
    </Suspense>
  );
};

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <LazyMotion features={domAnimation} strict>
            <AppRoutes />
          </LazyMotion>
        </MotionConfig>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
