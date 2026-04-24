import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { lazy, Suspense } from 'react';

// Lazy-loaded page components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));
const Compose = lazy(() => import('./pages/Compose'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const EmailFinder = lazy(() => import('./pages/EmailFinder'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Settings = lazy(() => import('./pages/Settings'));
const Billing = lazy(() => import('./pages/Billing'));
const Templates = lazy(() => import('./pages/Templates'));
const Landing = lazy(() => import('./pages/Landing'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Admin = lazy(() => import('./pages/Admin'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const SmartLists = lazy(() => import('./pages/SmartLists'));
const Links = lazy(() => import('./pages/Links'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const SeoTools = lazy(() => import('./pages/SeoTools'));
const TeamReports = lazy(() => import('./pages/TeamReports'));
const Sequences = lazy(() => import('./pages/Sequences'));
const Tools = lazy(() => import('./pages/Tools'));
const GoogleAuthSuccess = lazy(() => import('./pages/GoogleAuthSuccess'));

// Loading spinner for lazy-loaded routes
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-surface-400">Loading...</p>
      </div>
    </div>
  );
}

function RootRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/:id" element={<CampaignDetail />} />
                <Route path="/compose" element={<Compose />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/:id" element={<ContactDetail />} />
                <Route path="/sequences" element={<Sequences />} />

                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/finder" element={<EmailFinder />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/accounts" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'user']}><Accounts /></ProtectedRoute>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/billing" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'user']}><Billing /></ProtectedRoute>} />
                <Route path="/team-reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><TeamReports /></ProtectedRoute>} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/smart-lists" element={<SmartLists />} />
                <Route path="/links" element={<Links />} />
                <Route path="/team" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'user']}><TeamPage /></ProtectedRoute>} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/seo" element={<SeoTools />} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
