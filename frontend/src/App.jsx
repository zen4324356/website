import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import AdminLogin from './pages/auth/AdminLogin';
import TokenLogin from './pages/auth/TokenLogin';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import TokenManagement from './pages/admin/TokenManagement';
import SiteSettings from './pages/admin/SiteSettings';
import GoogleOAuth from './pages/admin/GoogleOAuth';
import AdminProfile from './pages/admin/AdminProfile';
import EmailStats from './pages/admin/EmailStats';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import EmailViewer from './pages/user/EmailViewer';

// Error & Utility Pages
import NotFound from './pages/NotFound';

// Debug component to help diagnose rendering issues
const Debug = ({ message, data }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Debug: ${message}`, data);
  }
  return null;
};

function App() {
  // Added state to track render count for debugging
  const [renderCount, setRenderCount] = useState(0);
  const { isAdmin, isUser, initialized } = useAuth();
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const location = useLocation();

  // Increment render count on each render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`App component rendered ${renderCount + 1} times`);
  }, [renderCount]);

  // Debug logging
  console.log('App rendering, path:', location.pathname);
  console.log('Auth state:', { isAdmin, isUser, initialized });

  // Skip waiting for initialization to prevent blank screen issues
  // Always render the login page if not authenticated
  return (
    <>
      <Debug message="App render" data={{ location: location.pathname, isAdmin, isUser, initialized }} />
      
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/token-login" element={<TokenLogin />} />
        </Route>

        {/* Admin Routes - Protected */}
        <Route 
          path="/admin" 
          element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="tokens" element={<TokenManagement />} />
          <Route path="settings" element={<SiteSettings />} />
          <Route path="oauth" element={<GoogleOAuth />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="emails" element={<EmailStats />} />
        </Route>

        {/* User Routes - Protected */}
        <Route 
          path="/user" 
          element={isUser ? <UserLayout /> : <Navigate to="/token-login" />}
        >
          <Route index element={<UserDashboard />} />
          <Route path="email/:recipient" element={<EmailViewer />} />
        </Route>

        {/* Home Redirect - always go to login page initially */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App; 