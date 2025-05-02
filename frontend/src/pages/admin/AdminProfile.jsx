import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { 
  UserIcon, 
  KeyIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AdminProfile = () => {
  const { admin, updateAdminPassword } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  
  // Update Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load admin data on mount
  useEffect(() => {
    fetchAdminData();
    fetchAdminLogs();
  }, []);

  // Fetch admin account data
  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const { data } = await adminApi.getAdminAccount();
      setAdminData(data.admin);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin account data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch admin logs
  const fetchAdminLogs = async () => {
    try {
      setLogsLoading(true);
      const { data } = await adminApi.getAdminLogs(1, 5);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      toast.error('Failed to load admin logs');
    } finally {
      setLogsLoading(false);
    }
  };

  // Handle password form change
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update admin password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      await updateAdminPassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Profile</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-dark-lighter rounded-lg shadow"></div>
          <div className="h-64 bg-dark-lighter rounded-lg shadow"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <Card
          title="Account Information"
          icon={UserIcon}
          className="mb-6 lg:mb-0"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-400">Admin Email</p>
              <p className="mt-1 text-lg text-white">{adminData?.email}</p>
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed for security reasons</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-400">Account ID</p>
              <p className="mt-1 text-sm text-gray-300 font-mono">{adminData?.id}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-400">Last Updated</p>
              <p className="mt-1 text-sm text-gray-300">
                {formatDate(adminData?.last_updated)}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Recent Activity */}
        <Card
          title="Recent Activity"
          icon={ClockIcon}
          className="mb-6"
        >
          {logsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-10 bg-dark-light rounded"></div>
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 bg-dark-light rounded-full p-2">
                    <ClockIcon className="h-4 w-4 text-primary-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No recent activity</p>
          )}
        </Card>
        
        {/* Update Password */}
        <Card
          title="Update Password"
          icon={KeyIcon}
          className="col-span-1 lg:col-span-2"
        >
          <form onSubmit={handleUpdatePassword}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
                  placeholder="Enter new password"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Min 6 characters
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={
                  isUpdatingPassword || 
                  !passwordForm.currentPassword || 
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword
                }
                className={`btn btn-primary ${
                  isUpdatingPassword || 
                  !passwordForm.currentPassword || 
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile; 