import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/ui/Card';
import {
  KeyIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const { data } = await adminApi.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle card navigation
  const navigateToTokens = () => navigate('/admin/tokens');
  const navigateToEmails = () => navigate('/admin/emails');

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-32 bg-dark-lighter rounded-lg shadow"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-dark-lighter rounded-lg shadow"></div>
          <div className="h-80 bg-dark-lighter rounded-lg shadow"></div>
        </div>
      </div>
    );
  }

  // Calculate stats from dashboard data
  const stats = dashboardData?.summary || {
    totalTokens: 0,
    activeTokens: 0,
    blockedTokens: 0,
    totalEmails: 0,
    recentLogins: 0
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Access Tokens" 
          value={stats.totalTokens}
          icon={KeyIcon}
          iconBgColor="bg-primary-500"
          onClick={navigateToTokens}
        />
        <StatCard 
          title="Active Tokens" 
          value={stats.activeTokens}
          icon={ShieldCheckIcon}
          iconBgColor="bg-green-500"
        />
        <StatCard 
          title="Blocked Tokens" 
          value={stats.blockedTokens}
          icon={ShieldCheckIcon}
          iconBgColor="bg-red-500"
        />
        <StatCard 
          title="Total Emails" 
          value={stats.totalEmails}
          icon={EnvelopeIcon}
          iconBgColor="bg-blue-500"
          onClick={navigateToEmails}
        />
      </div>
      
      {/* Recent activity and site settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent admin logs */}
        <Card title="Recent Admin Activity">
          <div className="space-y-4">
            {dashboardData?.recentLogs?.length > 0 ? (
              dashboardData.recentLogs.map((log, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 bg-dark-light rounded-full p-2">
                    <ClockIcon className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">
                      {log.admin_email} - {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>
        
        {/* Current site settings */}
        <Card title="Site Settings">
          <div className="space-y-4">
            {dashboardData?.siteSettings ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Website Name</h3>
                  <p className="mt-1 text-base text-white">{dashboardData.siteSettings.website_name || 'Not set'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Logo URL</h3>
                  <p className="mt-1 text-base text-white truncate">
                    {dashboardData.siteSettings.logo_url || 'Not set'}
                  </p>
                  {dashboardData.siteSettings.logo_url && (
                    <div className="mt-2">
                      <img 
                        src={dashboardData.siteSettings.logo_url} 
                        alt="Site Logo" 
                        className="h-10 w-auto"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100x40?text=Invalid+Logo';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Video URL</h3>
                  <p className="mt-1 text-base text-white truncate">
                    {dashboardData.siteSettings.video_url || 'Not set'}
                  </p>
                </div>
                
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="mt-2 w-full btn btn-primary"
                >
                  Manage Settings
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-center py-4">No settings available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 