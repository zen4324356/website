import { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import {
  BuildingStorefrontIcon,
  PhotoIcon,
  FilmIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

const SiteSettings = () => {
  const { 
    settings, 
    getAllSettings, 
    updateWebsiteName, 
    updateLogoUrl, 
    updateVideoUrl,
    updateSupabaseConfig
  } = useSettings();
  
  const [websiteName, setWebsiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [supabaseConfig, setSupabaseConfig] = useState({
    project_url: '',
    anon_key: '',
    service_key: ''
  });
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const [isUpdatingSupabase, setIsUpdatingSupabase] = useState(false);

  // Load all settings
  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        setIsLoadingConfig(true);
        const data = await getAllSettings();
        
        // Update local state with settings
        if (data.siteSettings) {
          setWebsiteName(data.siteSettings.website_name || '');
          setLogoUrl(data.siteSettings.logo_url || '');
          setVideoUrl(data.siteSettings.video_url || '');
        }
        
        // Update Supabase config
        if (data.supabaseConfig) {
          setSupabaseConfig({
            project_url: data.supabaseConfig.project_url || '',
            anon_key: data.supabaseConfig.anon_key || '',
            service_key: data.supabaseConfig.service_key || ''
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchAllSettings();
  }, []);

  // Update website name
  const handleUpdateName = async (e) => {
    e.preventDefault();
    
    if (!websiteName.trim()) {
      toast.error('Website name cannot be empty');
      return;
    }
    
    try {
      setIsUpdatingName(true);
      await updateWebsiteName(websiteName.trim());
      toast.success('Website name updated successfully');
    } catch (error) {
      console.error('Error updating website name:', error);
      toast.error('Failed to update website name');
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Update logo URL
  const handleUpdateLogo = async (e) => {
    e.preventDefault();
    
    if (!logoUrl.trim()) {
      toast.error('Logo URL cannot be empty');
      return;
    }
    
    try {
      setIsUpdatingLogo(true);
      await updateLogoUrl(logoUrl.trim());
      toast.success('Logo URL updated successfully');
    } catch (error) {
      console.error('Error updating logo URL:', error);
      toast.error('Failed to update logo URL');
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  // Update video URL
  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      toast.error('Video URL cannot be empty');
      return;
    }
    
    try {
      setIsUpdatingVideo(true);
      await updateVideoUrl(videoUrl.trim());
      toast.success('Video URL updated successfully');
    } catch (error) {
      console.error('Error updating video URL:', error);
      toast.error('Failed to update video URL');
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  // Update Supabase config
  const handleUpdateSupabase = async (e) => {
    e.preventDefault();
    
    if (!supabaseConfig.project_url.trim() || !supabaseConfig.anon_key.trim()) {
      toast.error('Project URL and Anon Key are required');
      return;
    }
    
    try {
      setIsUpdatingSupabase(true);
      await updateSupabaseConfig({
        project_url: supabaseConfig.project_url.trim(),
        anon_key: supabaseConfig.anon_key.trim(),
        service_key: supabaseConfig.service_key.trim()
      });
      toast.success('Supabase configuration updated successfully');
    } catch (error) {
      console.error('Error updating Supabase config:', error);
      toast.error('Failed to update Supabase configuration');
    } finally {
      setIsUpdatingSupabase(false);
    }
  };

  // Loading state
  if (isLoadingConfig) {
    return (
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-white mb-6">Site Settings</h1>
        <div className="space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-48 bg-dark-lighter rounded-lg shadow"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Site Settings</h1>
      
      <div className="space-y-6">
        {/* Website Name */}
        <Card 
          title="Website Name" 
          icon={BuildingStorefrontIcon}
        >
          <form onSubmit={handleUpdateName}>
            <div className="mb-4">
              <label htmlFor="website-name" className="block text-sm font-medium text-gray-300 mb-1">
                Website Name
              </label>
              <input
                id="website-name"
                type="text"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="Enter website name"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                This name will appear in the header and title of all pages
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingName || !websiteName.trim()}
                className={`btn btn-primary ${
                  isUpdatingName || !websiteName.trim() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isUpdatingName ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          </form>
        </Card>
        
        {/* Logo URL */}
        <Card 
          title="Logo" 
          icon={PhotoIcon}
        >
          <form onSubmit={handleUpdateLogo}>
            <div className="mb-4">
              <label htmlFor="logo-url" className="block text-sm font-medium text-gray-300 mb-1">
                Logo URL
              </label>
              <input
                id="logo-url"
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Enter logo URL"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                URL to the logo image that will be displayed in the header
              </p>
            </div>
            
            {logoUrl && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-300 mb-1">Preview</p>
                <div className="bg-dark-light p-4 rounded-md flex items-center justify-center">
                  <img 
                    src={logoUrl} 
                    alt="Logo Preview" 
                    className="h-12 w-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150x50?text=Invalid+Logo';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingLogo || !logoUrl.trim()}
                className={`btn btn-primary ${
                  isUpdatingLogo || !logoUrl.trim() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isUpdatingLogo ? 'Updating...' : 'Update Logo'}
              </button>
            </div>
          </form>
        </Card>
        
        {/* Video URL */}
        <Card 
          title="Login Background Video" 
          icon={FilmIcon}
        >
          <form onSubmit={handleUpdateVideo}>
            <div className="mb-4">
              <label htmlFor="video-url" className="block text-sm font-medium text-gray-300 mb-1">
                Video URL
              </label>
              <input
                id="video-url"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter video URL"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                URL to the background video that will play on the login page
              </p>
            </div>
            
            {videoUrl && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-300 mb-1">Preview</p>
                <div className="bg-dark-light p-4 rounded-md">
                  <video
                    src={videoUrl}
                    className="h-32 w-full object-cover rounded"
                    controls
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingVideo || !videoUrl.trim()}
                className={`btn btn-primary ${
                  isUpdatingVideo || !videoUrl.trim() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isUpdatingVideo ? 'Updating...' : 'Update Video'}
              </button>
            </div>
          </form>
        </Card>
        
        {/* Supabase Config */}
        <Card 
          title="Supabase Configuration" 
          icon={ServerIcon}
        >
          <form onSubmit={handleUpdateSupabase}>
            <div className="mb-4">
              <label htmlFor="project-url" className="block text-sm font-medium text-gray-300 mb-1">
                Project URL
              </label>
              <input
                id="project-url"
                type="text"
                value={supabaseConfig.project_url}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, project_url: e.target.value})}
                placeholder="https://your-project.supabase.co"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="anon-key" className="block text-sm font-medium text-gray-300 mb-1">
                Anon/Public Key
              </label>
              <input
                id="anon-key"
                type="text"
                value={supabaseConfig.anon_key}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, anon_key: e.target.value})}
                placeholder="your-anon-key"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="service-key" className="block text-sm font-medium text-gray-300 mb-1">
                Service Key (Optional)
              </label>
              <input
                id="service-key"
                type="text"
                value={supabaseConfig.service_key}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, service_key: e.target.value})}
                placeholder="your-service-key"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                Service key provides elevated permissions (optional)
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  isUpdatingSupabase || 
                  !supabaseConfig.project_url.trim() || 
                  !supabaseConfig.anon_key.trim()
                }
                className={`btn btn-primary ${
                  isUpdatingSupabase || 
                  !supabaseConfig.project_url.trim() || 
                  !supabaseConfig.anon_key.trim()
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
              >
                {isUpdatingSupabase ? 'Updating...' : 'Update Supabase Config'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SiteSettings; 