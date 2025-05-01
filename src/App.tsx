import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import UserDashboard from './components/UserDashboard';
import { getSiteSettings } from './utils/auth';
import { SiteSettings } from './types';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    name: 'Unknown Household Access',
    logoUrl: '',
    backgroundVideo: null,
    transparency: 50
  });
  
  useEffect(() => {
    loadSiteSettings();
  }, []);

  const loadSiteSettings = async () => {
    const settings = await getSiteSettings();
    setSiteSettings(settings);
    document.title = settings.name;
  };

  return (
    <div className="relative min-h-screen">
      {siteSettings.backgroundVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover"
          style={{ opacity: siteSettings.transparency / 100 }}
        >
          <source src={siteSettings.backgroundVideo} type="video/mp4" />
        </video>
      )}
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm flex items-center justify-center p-4">
        {!isAuthenticated ? (
          <Login siteSettings={siteSettings} />
        ) : (
          user?.type === 'admin' ? <AdminPanel /> : <UserDashboard siteSettings={siteSettings} />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;