import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    website_name: 'Admin Dashboard',
    logo_url: null,
    video_url: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings/public');
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load site settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Update website name
  const updateWebsiteName = async (websiteName) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.put('/settings/name', {
        website_name: websiteName
      });
      
      setSettings(prev => ({
        ...prev,
        website_name: websiteName
      }));
      
      return data;
    } catch (error) {
      console.error('Update website name error:', error);
      setError(error.response?.data?.message || 'Failed to update website name');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update logo URL
  const updateLogoUrl = async (logoUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.put('/settings/logo', {
        logo_url: logoUrl
      });
      
      setSettings(prev => ({
        ...prev,
        logo_url: logoUrl
      }));
      
      return data;
    } catch (error) {
      console.error('Update logo URL error:', error);
      setError(error.response?.data?.message || 'Failed to update logo URL');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update video URL
  const updateVideoUrl = async (videoUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.put('/settings/video', {
        video_url: videoUrl
      });
      
      setSettings(prev => ({
        ...prev,
        video_url: videoUrl
      }));
      
      return data;
    } catch (error) {
      console.error('Update video URL error:', error);
      setError(error.response?.data?.message || 'Failed to update video URL');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all admin settings
  const getAllSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.get('/settings');
      return data;
    } catch (error) {
      console.error('Get all settings error:', error);
      setError(error.response?.data?.message || 'Failed to get settings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Supabase config
  const updateSupabaseConfig = async (config) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await api.put('/settings/supabase', config);
      return data;
    } catch (error) {
      console.error('Update Supabase config error:', error);
      setError(error.response?.data?.message || 'Failed to update Supabase configuration');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateWebsiteName,
        updateLogoUrl,
        updateVideoUrl,
        getAllSettings,
        updateSupabaseConfig
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}; 