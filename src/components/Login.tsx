import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, KeyIcon, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SiteSettings } from '../types';

interface LoginProps {
  siteSettings: SiteSettings;
}

const Login: React.FC<LoginProps> = ({ siteSettings }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [userToken, setUserToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login('admin', { email: adminEmail, password: adminPassword });
      if (!success) {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login('user', { token: userToken });
      if (!result) {
        setError('Invalid token. Please check your access token and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white/90 backdrop-blur-md rounded-lg shadow-lg">
      <div className="text-center mb-6">
        {siteSettings.logoUrl ? (
          <img 
            src={siteSettings.logoUrl} 
            alt={siteSettings.name}
            className="h-16 mx-auto mb-4"
          />
        ) : null}
        <h2 className="text-2xl font-bold text-gray-800">
          {siteSettings.name}
        </h2>
      </div>
      
      {/* Login Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`w-1/2 py-2 text-center transition-colors duration-300 ${
            activeTab === 'user'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('user')}
        >
          <div className="flex items-center justify-center">
            <KeyIcon className="w-4 h-4 mr-2" />
            <span>User Access</span>
          </div>
        </button>
        <button
          className={`w-1/2 py-2 text-center transition-colors duration-300 ${
            activeTab === 'admin'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('admin')}
        >
          <div className="flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 mr-2" />
            <span>Admin</span>
          </div>
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Admin Login Form */}
      {activeTab === 'admin' && (
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Admin Email"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Admin Password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }`}
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      )}
      
      {/* User Login Form */}
      {activeTab === 'user' && (
        <form onSubmit={handleUserLogin} className="space-y-4">
          <div>
            <label htmlFor="userToken" className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="userToken"
                type="text"
                value={userToken}
                onChange={(e) => setUserToken(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Enter your access token"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition duration-200 ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }`}
          >
            {loading ? 'Verifying...' : 'Access System'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;