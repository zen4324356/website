import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has a valid admin token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const adminToken = localStorage.getItem('adminToken');
      const userTokenValue = localStorage.getItem('userToken');

      if (adminToken) {
        try {
          // Set the token in the axios instance
          api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
          
          // Verify admin token
          const { data } = await api.get('/auth/admin/status');
          setAdmin(data.admin);
        } catch (error) {
          console.error('Error verifying admin token:', error);
          // Clear invalid token
          localStorage.removeItem('adminToken');
          delete api.defaults.headers.common['Authorization'];
        }
      } else if (userTokenValue) {
        // Set user token
        setUserToken(userTokenValue);
        api.defaults.headers.common['Authorization'] = `Bearer ${userTokenValue}`;
      }

      setInitialized(true);
    };

    checkAuthStatus();
  }, []);

  // Admin login
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      
      // Save token to local storage
      localStorage.setItem('adminToken', data.token);
      
      // Set token in axios for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Set admin data in state
      setAdmin(data.admin);
      
      return data;
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.response?.data?.message || 'An error occurred during login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // User token login
  const tokenLogin = async (token) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.post('/auth/token/login', { token });
      
      // Save token to local storage
      localStorage.setItem('userToken', data.token);
      
      // Set token in axios for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Set user token in state
      setUserToken(data.token);
      
      return data;
    } catch (error) {
      console.error('Token login error:', error);
      setError(error.response?.data?.message || 'Invalid or inactive token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update admin credentials
  const updateAdminEmail = async (password, newEmail) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.put('/auth/admin/email', { password, newEmail });
      
      // Update token in localStorage
      localStorage.setItem('adminToken', data.token);
      
      // Update token in axios
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Update admin in state
      setAdmin(data.admin);
      
      return data;
    } catch (error) {
      console.error('Update admin email error:', error);
      setError(error.response?.data?.message || 'An error occurred while updating email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update admin password
  const updateAdminPassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.put('/auth/admin/password', { 
        currentPassword, 
        newPassword 
      });
      
      return data;
    } catch (error) {
      console.error('Update admin password error:', error);
      setError(error.response?.data?.message || 'An error occurred while updating password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function for both admin and user
  const logout = () => {
    // Clear admin data if exists
    if (admin) {
      setAdmin(null);
      localStorage.removeItem('adminToken');
    }
    
    // Clear user token if exists
    if (userToken) {
      setUserToken(null);
      localStorage.removeItem('userToken');
    }
    
    // Clear Authorization header
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        userToken,
        isAdmin: !!admin,
        isUser: !!userToken,
        isLoading,
        error,
        initialized,
        adminLogin,
        tokenLogin,
        updateAdminEmail,
        updateAdminPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 