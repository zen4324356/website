import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, CheckCircle } from 'lucide-react';
import { SiteSettings } from '../types';

interface UserDashboardProps {
  siteSettings: SiteSettings;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ siteSettings }) => {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center bg-blue-700/90 backdrop-blur-md p-4 text-white">
          <div className="flex items-center">
            {siteSettings.logoUrl && (
              <img 
                src={siteSettings.logoUrl} 
                alt={siteSettings.name}
                className="h-8 mr-3"
              />
            )}
            <h1 className="text-xl font-bold">User Dashboard - {siteSettings.name}</h1>
          </div>
          <button 
            onClick={logout}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span>Logout</span>
          </button>
        </div>
        
        <div className="p-8 text-center">
          <div className="flex items-center justify-center mb-6 text-green-600">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Granted</h2>
          <p className="text-gray-600 mb-6">
            You've successfully accessed {siteSettings.name} using token: 
            <span className="font-semibold text-gray-800 ml-1">
              {user?.token || ''}
            </span>
          </p>
          
          <div className="bg-gray-100/90 backdrop-blur-md p-6 rounded-lg max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Token Information</h3>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Access Level:</span>
                <span className="font-medium">Standard</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;