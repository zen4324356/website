import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { ArrowRightOnRectangleIcon, HomeIcon } from '@heroicons/react/24/outline';

const UserLayout = () => {
  const { userToken, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/token-login');
  };

  const goToHome = () => {
    navigate('/user');
  };

  return (
    <div className="flex flex-col h-full bg-dark">
      {/* Header */}
      <header className="bg-dark-lighter shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo and Title */}
            <div className="flex items-center">
              {settings.logo_url && (
                <img
                  className="h-8 w-auto mr-2"
                  src={settings.logo_url}
                  alt="Logo"
                />
              )}
              <span className="text-white font-semibold">
                {settings.website_name || 'User Dashboard'}
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <button
                onClick={goToHome}
                className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                <HomeIcon className="h-5 w-5 mr-1" />
                Home
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-dark">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-lighter border-t border-dark-border py-4 px-4 text-center text-xs text-gray-400">
        <p>Access token: {userToken ? userToken.substring(0, 8) + '...' : 'None'}</p>
        <p className="mt-1">© {new Date().getFullYear()} {settings.website_name || 'Dashboard'}</p>
      </footer>
    </div>
  );
};

export default UserLayout; 