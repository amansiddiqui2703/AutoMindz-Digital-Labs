import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Compose from './pages/Compose';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import EmailFinder from './pages/EmailFinder';
import Analytics from './pages/Analytics';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import Templates from './pages/Templates';
import Landing from './pages/Landing';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import SmartLists from './pages/SmartLists';
import Links from './pages/Links';
import TeamPage from './pages/TeamPage';
import TasksPage from './pages/TasksPage';
import ActivityPage from './pages/ActivityPage';
import InboxPage from './pages/InboxPage';
import SeoTools from './pages/SeoTools';

function RootRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
              <Route path="/finder" element={<EmailFinder />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/smart-lists" element={<SmartLists />} />
              <Route path="/links" element={<Links />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/seo" element={<SeoTools />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
