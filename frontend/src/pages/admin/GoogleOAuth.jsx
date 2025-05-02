import { useState, useEffect } from 'react';
import { oauthApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import {
  CloudIcon,
  KeyIcon,
  TrashIcon,
  ArrowPathIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const GoogleOAuth = () => {
  const [credentials, setCredentials] = useState(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [hasRefreshToken, setHasRefreshToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: ''
  });
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [useJsonInput, setUseJsonInput] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [showAuthUrl, setShowAuthUrl] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [processingCode, setProcessingCode] = useState(false);

  // Sample JSON format
  const sampleJson = {
    web: {
      client_id: "YOUR_CLIENT_ID.apps.googleusercontent.com",
      project_id: "your-project-id",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_secret: "YOUR_CLIENT_SECRET",
      redirect_uris: ["YOUR_REDIRECT_URI"]
    }
  };

  // Fetch credentials on mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  // Process JSON input when it changes
  useEffect(() => {
    if (jsonInput) {
      validateJsonInput(jsonInput);
    } else {
      setJsonError('');
    }
  }, [jsonInput]);

  // Validate JSON input and populate form
  const validateJsonInput = (input) => {
    try {
      const parsedJson = JSON.parse(input);
      
      if (!parsedJson.web) {
        setJsonError('JSON structure must include a "web" object.');
        return;
      }
      
      const { web } = parsedJson;
      
      if (!web.client_id || !web.client_secret || !web.redirect_uris || !web.redirect_uris.length) {
        setJsonError('JSON must include client_id, client_secret, and redirect_uris fields.');
        return;
      }
      
      // Valid JSON, populate form data
      setFormData({
        client_id: web.client_id,
        client_secret: web.client_secret,
        redirect_uri: web.redirect_uris[0]
      });
      
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON format. Please check your input.');
    }
  };

  // Fetch OAuth credentials
  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const { data } = await oauthApi.getCredentials();
      setHasCredentials(data.hasCredentials);
      setHasRefreshToken(data.credentials?.has_refresh_token || false);
      
      if (data.hasCredentials && data.credentials) {
        setCredentials(data.credentials);
        setFormData({
          client_id: data.credentials.client_id || '',
          client_secret: '',
          redirect_uri: data.credentials.redirect_uri || ''
        });
      }
    } catch (error) {
      console.error('Error fetching OAuth credentials:', error);
      toast.error('Failed to load OAuth credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Save credentials
  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.client_secret || !formData.redirect_uri) {
      toast.error('All fields are required');
      return;
    }
    
    try {
      setIsSaving(true);
      const { data } = await oauthApi.saveCredentials(formData);
      
      setCredentials(data.credentials);
      setHasCredentials(true);
      setHasRefreshToken(data.credentials.has_refresh_token);
      
      // Reset form and input states
      setFormData({
        ...formData,
        client_secret: ''
      });
      setJsonInput('');
      setUseJsonInput(false);
      
      toast.success('OAuth credentials saved successfully');
    } catch (error) {
      console.error('Error saving OAuth credentials:', error);
      toast.error('Failed to save OAuth credentials');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete credentials
  const handleDeleteCredentials = async () => {
    if (!confirm('Are you sure you want to delete OAuth credentials? This will disconnect Gmail API.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await oauthApi.deleteCredentials();
      
      setCredentials(null);
      setHasCredentials(false);
      setHasRefreshToken(false);
      setFormData({
        client_id: '',
        client_secret: '',
        redirect_uri: ''
      });
      setJsonInput('');
      
      toast.success('OAuth credentials deleted successfully');
    } catch (error) {
      console.error('Error deleting OAuth credentials:', error);
      toast.error('Failed to delete OAuth credentials');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle between form and JSON input
  const toggleInputMode = () => {
    if (useJsonInput) {
      setUseJsonInput(false);
    } else {
      // If switching to JSON, create sample JSON with current values if available
      if (formData.client_id || formData.client_secret || formData.redirect_uri) {
        const currentJson = JSON.stringify({
          web: {
            client_id: formData.client_id || sampleJson.web.client_id,
            client_secret: formData.client_secret || 'YOUR_CLIENT_SECRET',
            redirect_uris: [formData.redirect_uri || 'YOUR_REDIRECT_URI'],
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
          }
        }, null, 2);
        setJsonInput(currentJson);
      } else {
        setJsonInput(JSON.stringify(sampleJson, null, 2));
      }
      setUseJsonInput(true);
    }
  };

  // Generate OAuth URL
  const handleGenerateAuthUrl = async () => {
    try {
      const { data } = await oauthApi.generateOAuthUrl();
      setAuthUrl(data.authUrl);
      setShowAuthUrl(true);
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      toast.error('Failed to generate OAuth URL');
    }
  };

  // Process auth code
  const handleProcessAuthCode = async (e) => {
    e.preventDefault();
    
    if (!authCode.trim()) {
      toast.error('Please enter the authorization code');
      return;
    }
    
    try {
      setProcessingCode(true);
      await oauthApi.handleCallback(authCode.trim());
      
      setHasRefreshToken(true);
      setAuthCode('');
      setShowAuthUrl(false);
      
      toast.success('OAuth flow completed successfully');
    } catch (error) {
      console.error('Error processing auth code:', error);
      toast.error('Failed to process authorization code');
    } finally {
      setProcessingCode(false);
    }
  };

  // Refresh token
  const handleRefreshToken = async () => {
    try {
      setIsRefreshing(true);
      await oauthApi.refreshToken();
      toast.success('OAuth token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing OAuth token:', error);
      toast.error('Failed to refresh OAuth token');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-white mb-6">Google OAuth</h1>
        <div className="h-96 bg-dark-lighter rounded-lg shadow"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Google OAuth</h1>
      
      {/* OAuth Credentials Form */}
      <Card
        title="OAuth Credentials"
        icon={CloudIcon}
        className="mb-6"
      >
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleInputMode}
            className="flex items-center text-sm text-primary-400 hover:text-primary-300"
          >
            {useJsonInput ? (
              <>
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                Switch to Form Input
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                Switch to JSON Input
              </>
            )}
          </button>
        </div>
        
        <form onSubmit={handleSaveCredentials}>
          {useJsonInput ? (
            <div className="mb-4">
              <label htmlFor="json-input" className="block text-sm font-medium text-gray-300 mb-1">
                Google OAuth Credentials JSON
              </label>
              <textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your Google OAuth credentials JSON here"
                rows={12}
                className={`w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white font-mono text-sm ${
                  jsonError ? 'border-red-500' : ''
                }`}
              />
              {jsonError ? (
                <p className="mt-1 text-xs text-red-500">{jsonError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Paste the JSON credentials file you downloaded from the Google Cloud Console
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="client-id" className="block text-sm font-medium text-gray-300 mb-1">
                  Client ID
                </label>
                <input
                  id="client-id"
                  type="text"
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  placeholder="Google OAuth Client ID"
                  className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="client-secret" className="block text-sm font-medium text-gray-300 mb-1">
                  Client Secret
                </label>
                <input
                  id="client-secret"
                  type="password"
                  value={formData.client_secret}
                  onChange={(e) => setFormData({...formData, client_secret: e.target.value})}
                  placeholder={hasCredentials ? "••••••••" : "Google OAuth Client Secret"}
                  className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
                />
                {hasCredentials && (
                  <p className="mt-1 text-xs text-gray-400">
                    Leave blank to keep the existing secret
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="redirect-uri" className="block text-sm font-medium text-gray-300 mb-1">
                  Redirect URI
                </label>
                <input
                  id="redirect-uri"
                  type="text"
                  value={formData.redirect_uri}
                  onChange={(e) => setFormData({...formData, redirect_uri: e.target.value})}
                  placeholder="https://your-domain.com/oauth/callback"
                  className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white"
                />
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <div>
              {hasCredentials && (
                <button
                  type="button"
                  onClick={handleDeleteCredentials}
                  disabled={isDeleting}
                  className={`btn flex items-center bg-red-600 hover:bg-red-700 text-white ${
                    isDeleting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete Credentials'}
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSaving || (useJsonInput && jsonError)}
              className={`btn btn-primary ${
                isSaving || (useJsonInput && jsonError) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </Card>
      
      {/* OAuth Connection Status */}
      {hasCredentials && (
        <Card
          title="OAuth Connection Status"
          icon={LinkIcon}
          className="mb-6"
        >
          <div className="mb-4">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Status:</span>{' '}
              {hasRefreshToken ? (
                <span className="text-green-500">Connected</span>
              ) : (
                <span className="text-yellow-500">Not Connected</span>
              )}
            </p>
            
            {credentials && (
              <>
                <p className="text-sm text-gray-300 mt-2">
                  <span className="font-medium">Client ID:</span>{' '}
                  <span className="text-gray-400 font-mono text-xs break-all">{credentials.client_id}</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  <span className="font-medium">Redirect URI:</span>{' '}
                  <span className="text-gray-400 font-mono text-xs break-all">{credentials.redirect_uri}</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  <span className="font-medium">Last Updated:</span>{' '}
                  <span className="text-gray-400">
                    {new Date(credentials.last_updated).toLocaleString()}
                  </span>
                </p>
              </>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleGenerateAuthUrl}
              disabled={!hasCredentials}
              className="btn btn-primary flex items-center"
            >
              <KeyIcon className="h-4 w-4 mr-1" />
              {hasRefreshToken ? 'Reconnect' : 'Connect to Gmail'}
            </button>
            
            {hasRefreshToken && (
              <button
                onClick={handleRefreshToken}
                disabled={isRefreshing}
                className={`btn flex items-center bg-green-600 hover:bg-green-700 text-white ${
                  isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
              </button>
            )}
          </div>
        </Card>
      )}
      
      {/* Authentication Process */}
      {showAuthUrl && (
        <Card
          title="Complete Authentication"
          className="mb-6"
        >
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">
              1. Click the link below to authorize access to your Gmail account:
            </p>
            <div className="bg-dark-light p-3 rounded-md">
              <a 
                href={authUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 break-all"
              >
                {authUrl}
              </a>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">
              2. After authorization, copy the code from the redirect URL and paste it below:
            </p>
            <form onSubmit={handleProcessAuthCode}>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste authorization code here"
                className="w-full rounded-md bg-dark-light border-dark-border shadow-sm text-white mb-2"
              />
              
              <button
                type="submit"
                disabled={processingCode || !authCode.trim()}
                className={`btn btn-primary w-full ${
                  processingCode || !authCode.trim() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {processingCode ? 'Processing...' : 'Submit Code'}
              </button>
            </form>
          </div>
        </Card>
      )}
      
      {/* Help & Instructions */}
      <Card
        title="OAuth Setup Instructions"
        collapsible={true}
      >
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            To connect to Gmail API, you need to create OAuth 2.0 credentials in the Google Cloud Console:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary-400">Google Cloud Console</a></li>
            <li>Create a new project or select an existing one</li>
            <li>Enable the Gmail API for your project</li>
            <li>Go to "Credentials" and create an OAuth 2.0 Client ID</li>
            <li>Add the redirect URI (e.g., http://localhost:5000/api/oauth/callback)</li>
            <li>Copy the Client ID and Client Secret to the form above</li>
            <li>Save the credentials and click "Connect to Gmail"</li>
            <li>Follow the authorization flow to grant access to your Gmail account</li>
          </ol>
          
          <p>
            <strong>Note:</strong> The email sync process will use these credentials to poll the Gmail API
            for new messages.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default GoogleOAuth; 