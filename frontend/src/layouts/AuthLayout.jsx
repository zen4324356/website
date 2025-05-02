import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';

const AuthLayout = () => {
  const { isAdmin, isUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    } else if (isUser) {
      navigate('/user');
    }
  }, [isAdmin, isUser, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden auth-layout">
      {/* Video Background with improved transparency */}
      {settings?.video_url && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-30 z-10"></div>
          <video
            className="absolute min-w-full min-h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={settings.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      
      {/* Logo with improved positioning - shown everywhere */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-8 z-20">
        {settings?.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt={settings?.website_name || 'Logo'} 
            className="h-20 w-auto object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', e);
              e.target.src = '/default-logo.svg';
              e.target.onerror = null;
            }}
          />
        ) : (
          <h1 className="text-3xl font-bold text-white tracking-wider">
            {settings?.website_name || 'Admin Dashboard'}
          </h1>
        )}
      </div>
      
      {/* Content with improved transparency */}
      <div className="relative z-20 w-full max-w-md px-4 py-8">
        <Outlet />
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white z-20">
        <p>© {new Date().getFullYear()} {settings?.website_name || 'Admin Dashboard'}</p>
      </div>
    </div>
  );
};

export default AuthLayout; 