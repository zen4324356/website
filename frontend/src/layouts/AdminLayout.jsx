import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  KeyIcon,
  CogIcon,
  UserIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  CloudIcon,
  EllipsisVerticalIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { admin, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Access Tokens', href: '/admin/tokens', icon: KeyIcon },
    { name: 'Site Settings', href: '/admin/settings', icon: CogIcon },
    { name: 'Google OAuth', href: '/admin/oauth', icon: CloudIcon },
    { name: 'Email Stats', href: '/admin/emails', icon: EnvelopeIcon },
    { name: 'Admin Profile', href: '/admin/profile', icon: UserIcon },
  ];

  // Menu items for the 3-dot dropdown
  const dropdownOptions = [
    { name: 'Edit Profile', href: '/admin/profile', icon: UserIcon },
    { name: 'Site Settings', href: '/admin/settings', icon: CogIcon },
    { name: 'Access Tokens', href: '/admin/tokens', icon: KeyIcon },
    { name: 'Google OAuth', href: '/admin/oauth', icon: CloudIcon },
    { name: 'Visit Website', href: '/', icon: LinkIcon, external: true },
    { name: 'Logout', onClick: handleLogout, icon: ArrowRightOnRectangleIcon },
  ];

  return (
    <div className="h-full bg-dark">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 bg-black bg-opacity-75 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-lighter transform transition-transform lg:translate-x-0 lg:relative lg:z-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-dark-border">
          <div className="flex items-center">
            {settings.logo_url && (
              <img
                className="h-8 w-auto mr-2"
                src={settings.logo_url}
                alt="Logo"
              />
            )}
            <span className="text-white font-semibold">
              {settings.website_name || 'Admin Dashboard'}
            </span>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-4 px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-gray-300 hover:bg-dark-light hover:text-white'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-dark-light hover:text-white"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen lg:pl-64">
        {/* Top header */}
        <header className="bg-dark-lighter shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              type="button"
              className="text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center">
              <span className="text-white mr-4">Welcome, {admin?.email}</span>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-dark-light hover:bg-dark-border text-white transition-colors"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
                
                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-dark-lighter border border-dark-border z-50 overflow-hidden">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-dark-border">
                        <p className="text-xs font-medium text-primary-400">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{admin?.email}</p>
                      </div>
                      
                      <div className="py-1">
                        {dropdownOptions.map((option, index) => (
                          <div key={index} className="w-full">
                            {option.onClick ? (
                              <button
                                onClick={() => {
                                  setDropdownOpen(false);
                                  option.onClick();
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-dark-light hover:text-white"
                              >
                                <option.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{option.name}</span>
                              </button>
                            ) : (
                              <a
                                href={option.href}
                                target={option.external ? "_blank" : ""}
                                rel={option.external ? "noopener noreferrer" : ""}
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-light hover:text-white"
                              >
                                <option.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{option.name}</span>
                                {option.external && (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 ml-auto">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                )}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-dark p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 