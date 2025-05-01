import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTokens, 
  addToken, 
  removeToken, 
  toggleTokenBlock, 
  updateAdminCredentials,
  getSiteSettings,
  updateSiteSettings,
  validatePasswordStrength,
  getGoogleAuthCredentials,
  addGoogleAuthCredentials,
  addGoogleAuthCredentialsManually,
  deleteGoogleAuthCredentials,
  authorizeGoogleAuth
} from '../utils/auth';
import { Key, Plus, Trash2, Lock, Unlock, LogOut, Save, ShieldAlert, Settings, Check, X, Eye, EyeOff, Sun, Monitor, Menu, BrainCog as BrandGoogle, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Token, SiteSettings, GoogleAuthCredentials, GoogleAuthConfig } from '../types';

const AdminPanel: React.FC = () => {
  const { logout } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [credentialError, setCredentialError] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'settings' | 'customization' | 'google-auth'>('tokens');
  const [tokenError, setTokenError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    name: 'Unknown Household Access',
    logoUrl: '',
    backgroundVideo: null,
    transparency: 80
  });
  const [passwordStrength, setPasswordStrength] = useState({
    requirements: {
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false,
    },
    isStrong: false
  });
  const [googleAuthCredentials, setGoogleAuthCredentials] = useState<GoogleAuthCredentials[]>([]);
  const [newGoogleAuthJson, setNewGoogleAuthJson] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [manualCredentials, setManualCredentials] = useState({
    clientId: '',
    clientSecret: '',
    projectId: ''
  });
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    refreshTokens();
    loadSiteSettings();
    loadGoogleAuthCredentials();
  }, []);

  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data === 'google-auth-success') {
        loadGoogleAuthCredentials();
        setSuccessMessage('Google authorization successful!');
      }
    };

    window.addEventListener('message', handleAuthSuccess);
    return () => window.removeEventListener('message', handleAuthSuccess);
  }, []);

  const loadSiteSettings = async () => {
    const settings = await getSiteSettings();
    setSiteSettings(settings);
  };

  const loadGoogleAuthCredentials = async () => {
    const credentials = await getGoogleAuthCredentials();
    setGoogleAuthCredentials(credentials);
  };

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(validatePasswordStrength(newPassword));
    } else {
      setPasswordStrength({
        requirements: {
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumber: false,
          hasSpecialChar: false,
        },
        isStrong: false
      });
    }
  }, [newPassword]);

  const refreshTokens = async () => {
    const currentTokens = await getTokens();
    setTokens(currentTokens);
  };

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    setSuccessMessage('');
    
    if (!newToken.trim()) {
      setTokenError('Token cannot be empty');
      return;
    }
    
    const success = await addToken(newToken.trim());
    if (success) {
      setSuccessMessage('Token added successfully');
      setNewToken('');
      await refreshTokens();
    } else {
      setTokenError('Token already exists');
    }
  };

  const handleRemoveToken = async (token: string) => {
    setTokenError('');
    setSuccessMessage('');
    
    const success = await removeToken(token);
    if (success) {
      setSuccessMessage('Token removed successfully');
      await refreshTokens();
    }
  };

  const handleToggleBlock = async (token: string, currentlyBlocked: boolean) => {
    setTokenError('');
    setSuccessMessage('');
    
    const success = await toggleTokenBlock(token, !currentlyBlocked);
    if (success) {
      setSuccessMessage(`Token ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully`);
      await refreshTokens();
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError('');
    setSuccessMessage('');

    if (!newPassword.trim()) {
      setCredentialError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setCredentialError('Passwords do not match');
      return;
    }

    if (!passwordStrength.isStrong) {
      setCredentialError('Password does not meet strength requirements');
      return;
    }
    
    const result = await updateAdminCredentials(newPassword);
    if (result.success) {
      setSuccessMessage('Admin password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setCredentialError(result.error || 'Failed to update password');
    }
  };

  const handleSiteSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    setSuccessMessage('');
    
    const success = await updateSiteSettings(siteSettings);
    if (success) {
      setSuccessMessage('Site settings updated successfully');
      document.title = siteSettings.name;
    } else {
      setTokenError('Failed to update site settings');
    }
  };

  const handleAddGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    setSuccessMessage('');

    try {
      const config: GoogleAuthConfig = JSON.parse(newGoogleAuthJson);
      const success = await addGoogleAuthCredentials(config);
      
      if (success) {
        setSuccessMessage('Google Auth credentials added successfully');
        setNewGoogleAuthJson('');
        await loadGoogleAuthCredentials();
      } else {
        setTokenError('Failed to add Google Auth credentials');
      }
    } catch (error) {
      setTokenError('Invalid JSON format or missing required fields');
    }
  };

  const handleAddGoogleAuthManually = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');
    setSuccessMessage('');

    try {
      const success = await addGoogleAuthCredentialsManually(manualCredentials);
      
      if (success) {
        setSuccessMessage('Google Auth credentials added successfully');
        setManualCredentials({
          clientId: '',
          clientSecret: '',
          projectId: ''
        });
        setShowManualEntry(false);
        await loadGoogleAuthCredentials();
      } else {
        setTokenError('Failed to add Google Auth credentials');
      }
    } catch (error) {
      setTokenError('Failed to add credentials. Please check your input and try again.');
    }
  };

  const handleDeleteGoogleAuth = async (id: string) => {
    setTokenError('');
    setSuccessMessage('');
    
    const success = await deleteGoogleAuthCredentials(id);
    if (success) {
      setSuccessMessage('Google Auth credentials deleted successfully');
      await loadGoogleAuthCredentials();
    } else {
      setTokenError('Failed to delete Google Auth credentials');
    }
  };

  const handleAuthorizeGoogleAuth = async (id: string, clientId: string) => {
    try {
      const authUrl = await authorizeGoogleAuth(id, clientId);
      window.location.href = authUrl; // Open in the same window instead of a popup
    } catch (error) {
      setTokenError('Failed to generate authorization URL');
    }
  };

  const renderPasswordRequirement = (met: boolean, label: string) => (
    <div className="flex items-center space-x-2 text-sm">
      {met ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      <span className={met ? 'text-green-700' : 'text-red-700'}>{label}</span>
    </div>
  );

  const handleTransparencyChange = (value: number) => {
    setSiteSettings(prev => ({ ...prev, transparency: value }));
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">{siteSettings.name}</h1>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
        showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-8">{siteSettings.name}</h2>
          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('tokens');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'tokens' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Key className="w-5 h-5" />
              <span>Token Management</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Settings</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('customization');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'customization' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Customization</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('google-auth');
                setShowSidebar(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'google-auth' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BrandGoogle className="w-5 h-5" />
              <span>Google Auth</span>
            </button>
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-6">
          {tokenError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg animate-fade-in">
              {tokenError}
            </div>
          )}
          
          {credentialError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg animate-fade-in">
              {credentialError}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg animate-fade-in">
              {successMessage}
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="bg-white rounded-lg shadow-sm animate-fade-in">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Token Management</h2>
                <form onSubmit={handleAddToken} className="mb-8">
                  <div className="flex mb-6">
                    <input
                      type="text"
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      placeholder="Enter new token"
                      className="flex-1 rounded-l-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    />
                    <button
                      type="submit"
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Token
                    </button>
                  </div>
                </form>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Token
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tokens.map((token) => (
                        <tr key={token.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {token.value}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              token.blocked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {token.blocked ? (
                                <><Lock className="w-3 h-3 mr-1" /> Blocked</>
                              ) : (
                                <><Unlock className="w-3 h-3 mr-1" /> Active</>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleToggleBlock(token.value, token.blocked)}
                              className={`inline-flex items-center px-3 py-1 rounded-md mr-2 ${
                                token.blocked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {token.blocked ? (
                                <><Unlock className="w-4 h-4 mr-1" /> Unblock</>
                              ) : (
                                <><Lock className="w-4 h-4 mr-1" /> Block</>
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveToken(token.value)}
                              className="inline-flex items-center p-1 text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm animate-fade-in">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Admin Settings</h2>
                <form onSubmit={handleUpdateCredentials} className="space-y-6 max-w-md">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pr-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 space-y-1">
                      {renderPasswordRequirement(passwordStrength.requirements.minLength, 'At least 8 characters')}
                      {renderPasswordRequirement(passwordStrength.requirements.hasUpperCase, 'Contains uppercase letter')}
                      {renderPasswordRequirement(passwordStrength.requirements.hasLowerCase, 'Contains lowercase letter')}
                      {renderPasswordRequirement(passwordStrength.requirements.hasNumber, 'Contains number')}
                      {renderPasswordRequirement(passwordStrength.requirements.hasSpecialChar, 'Contains special character')}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pr-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!passwordStrength.isStrong || !newPassword || newPassword !== confirmPassword}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div className="bg-white rounded-lg shadow-sm animate-fade-in">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Site Customization</h2>
                <form onSubmit={handleSiteSettingsUpdate} className="space-y-6">
                  <div>
                    <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                      Website Name
                    </label>
                    <input
                      id="siteName"
                      type="text"
                      value={siteSettings.name}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Enter website name"
                    />
                  </div>

                  <div>
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      id="logoUrl"
                      type="url"
                      value={siteSettings.logoUrl}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Enter logo URL"
                    />
                    {siteSettings.logoUrl && (
                      <div className="mt-2">
                        <img 
                          src={siteSettings.logoUrl} 
                          alt="Logo Preview" 
                          className="h-12 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="backgroundVideo" className="block text-sm font-medium text-gray-700 mb-1">
                      Background Video URL
                    </label>
                    <input
                      id="backgroundVideo"
                      type="url"
                      value={siteSettings.backgroundVideo || ''}
                      onChange={(e) => setSiteSettings(prev => ({ ...prev, backgroundVideo: e.target.value }))}
                      className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                      placeholder="Enter background video URL"
                    />
                    {siteSettings.backgroundVideo && (
                      <div className="mt-2">
                        <video 
                          src={siteSettings.backgroundVideo}
                          className="w-full h-40 object-cover rounded-lg"
                          controls
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Video Transparency
                    </label>
                    <div className="flex items-center space-x-4">
                      <Sun className="w-5 h-5 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={siteSettings.transparency}
                        onChange={(e) => handleTransparencyChange(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <Monitor className="w-5 h-5 text-gray-400" />
                      <span className="w-12 text-sm text-gray-600">{siteSettings.transparency}%</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'google-auth' && (
            <div className="bg-white rounded-lg shadow-sm animate-fade-in">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Google Auth Credentials</h2>
                  <button
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <HelpCircle className="w-5 h-5 mr-1" />
                    Setup Guide
                    {showSetupGuide ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </button>
                </div>

                {showSetupGuide && (
                  <div className="mb-8 bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">How to Set Up Gmail API Access</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">1. Create a Google Cloud Project</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                          <li>Go to the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center">Google Cloud Console <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                          <li>Click "Select a Project" → "New Project"</li>
                          <li>Enter a project name and click "Create"</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">2. Enable the Gmail API</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                          <li>In the Google Cloud Console, go to "APIs & Services" → "Library"</li>
                          <li>Search for "Gmail API" and select it</li>
                          <li>Click "Enable"</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">3. Configure OAuth Consent Screen</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                          <li>Go to "APIs & Services" → "OAuth consent screen"</li>
                          <li>Choose "External" user type</li>
                          <li>Fill in the required information:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>App name</li>
                              <li>User support email</li>
                              <li>Developer contact information</li>
                            </ul>
                          </li>
                          <li>Add the following scopes:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>gmail.readonly</li>
                              <li>gmail.send</li>
                              <li>gmail.modify</li>
                              <li>gmail.compose</li>
                              <li>gmail.insert</li>
                              <li>gmail.labels</li>
                              <li>gmail.metadata</li>
                              <li>gmail.settings.basic</li>
                              <li>gmail.settings.sharing</li>
                            </ul>
                          </li>
                          <li>Add test users if in testing mode</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">4. Create OAuth 2.0 Credentials</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                          <li>Go to "APIs & Services" → "Credentials"</li>
                          <li>Click "Create Credentials" → "OAuth client ID"</li>
                          <li>Choose "Web application" as the application type</li>
                          <li>Add the following Authorized redirect URI:
                            <div className="bg-gray-100  p-2 rounded mt-1 font-mono text-sm">
                              {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth-callback`}
                            </div>
                          </li>
                          <li>Click "Create"</li>
                          <li>Download the JSON file or copy the credentials</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">5. Add Credentials to the Application</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                          <li>Choose either:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>Paste the downloaded JSON in the "JSON Configuration" field below</li>
                              <li>Or use "Enter Manually" to input the credentials directly</li>
                            </ul>
                          </li>
                          <li>Click "Add Credentials"</li>
                          <li>Click "Authorize" to complete the setup</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Add New Credentials</h3>
                    <button
                      onClick={() => setShowManualEntry(!showManualEntry)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {showManualEntry ? 'Use JSON Configuration' : 'Enter Manually'}
                    </button>
                  </div>

                  {showManualEntry ? (
                    <form onSubmit={handleAddGoogleAuthManually} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={manualCredentials.clientId}
                          onChange={(e) => setManualCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                          className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          placeholder="Enter Client ID"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client Secret
                        </label>
                        <input
                          type="text"
                          value={manualCredentials.clientSecret}
                          onChange={(e) => setManualCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                          className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          placeholder="Enter Client Secret"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project ID
                        </label>
                        <input
                          type="text"
                          value={manualCredentials.projectId}
                          onChange={(e) => setManualCredentials(prev => ({ ...prev, projectId: e.target.value }))}
                          className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          placeholder="Enter Project ID"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Credentials
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleAddGoogleAuth} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          JSON Configuration
                        </label>
                        <textarea
                          value={newGoogleAuthJson}
                          onChange={(e) => setNewGoogleAuthJson(e.target.value)}
                          placeholder="Paste Google Auth JSON configuration here..."
                          className="w-full h-40 rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-mono text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Credentials
                      </button>
                    </form>
                  )}
                </div>

                <div className="space-y-4">
                  {googleAuthCredentials.map((cred) => (
                    <div key={cred.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{cred.project_id}</h3>
                          <p className="text-sm text-gray-500 mt-1">Client ID: {cred.client_id}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!cred.authorized && (
                            <button
                              onClick={() => handleAuthorizeGoogleAuth(cred.id, cred.client_id)}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            >
                              <Lock className="w-4 h-4 mr-1" />
                              Authorize
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteGoogleAuth(cred.id)}
                            className="inline-flex items-center p-1 text-red-600 hover:text-red-900 rounded-md"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cred.authorized
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cred.authorized ? 'Authorized' : 'Not Authorized'}
                        </span>
                      </div>
                      {cred.authorized && (
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Last token refresh: {new Date(cred.updated_at).toLocaleString()}</p>
                        </div>
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
  );
};

export default AdminPanel;