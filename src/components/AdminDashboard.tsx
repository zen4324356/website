import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { GoogleAuthConfig, User } from "@/types";
import { LogIn, Plus, User as UserIcon, Trash, X, Edit, ExternalLink, AlertCircle, Mail, Check, Lock, Unlock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const { 
    accessTokens, 
    googleConfigs, 
    addAccessToken, 
    deleteAccessToken, 
    blockAccessToken,
    addGoogleConfig,
    updateGoogleConfig,
    deleteGoogleConfig,
    updateAdminCredentials,
    emailLimit,
    updateEmailLimit,
    defaultSearchEmail,
    updateDefaultSearchEmail,
    autoRefreshInterval,
    autoRefreshEnabled,
    updateAutoRefreshInterval,
    toggleAutoRefresh,
    serverStorageStats,
    clearServerStorage,
    getServerStorageStats
  } = useData();
  const navigate = useNavigate();

  const [newToken, setNewToken] = useState("");
  const [newConfig, setNewConfig] = useState<{ 
    clientId: string; 
    clientSecret: string;
    projectId: string;
    authUri: string;
    tokenUri: string;
    authProviderCertUrl: string;
  }>({
    clientId: "",
    clientSecret: "",
    projectId: "",
    authUri: "https://accounts.google.com/o/oauth2/auth",
    tokenUri: "https://oauth2.googleapis.com/token",
    authProviderCertUrl: "https://www.googleapis.com/oauth2/v1/certs"
  });
  const [jsonInput, setJsonInput] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [emailLimitValue, setEmailLimitValue] = useState(emailLimit || 1);
  const [newDefaultEmail, setNewDefaultEmail] = useState(defaultSearchEmail);

  const [activeTab, setActiveTab] = useState("tokens");
  const [error, setError] = useState("");
  const [editingConfig, setEditingConfig] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) {
      navigate("/admin-login");
    }
  }, [admin, navigate]);

  useEffect(() => {
    // Ensure the limit is never less than 1
    setEmailLimitValue(emailLimit || 1);
  }, [emailLimit]);

  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) {
      setError("Token cannot be empty");
      return;
    }
    
    addAccessToken(newToken);
    setNewToken("");
    setError("");
  };

  const handleAddConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfig.clientId || !newConfig.clientSecret) {
      setError("Client ID and Secret are required");
      return;
    }
    
    addGoogleConfig(newConfig);
    setNewConfig({
      clientId: "",
      clientSecret: "",
      projectId: "",
      authUri: "https://accounts.google.com/o/oauth2/auth",
      tokenUri: "https://oauth2.googleapis.com/token",
      authProviderCertUrl: "https://www.googleapis.com/oauth2/v1/certs"
    });
    setError("");
  };

  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed && parsed.web) {
        setNewConfig({
          clientId: parsed.web.client_id || "",
          clientSecret: parsed.web.client_secret || "",
          projectId: parsed.web.project_id || "",
          authUri: parsed.web.auth_uri || "https://accounts.google.com/o/oauth2/auth",
          tokenUri: parsed.web.token_uri || "https://oauth2.googleapis.com/token",
          authProviderCertUrl: parsed.web.auth_provider_x509_cert_url || "https://www.googleapis.com/oauth2/v1/certs"
        });
        setError("");
      } else {
        setError("Invalid JSON format. Must contain a 'web' object with credentials.");
      }
    } catch (err) {
      setError("Failed to parse JSON. Please check the format.");
      console.error(err);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setError("Username and password are required");
      return;
    }
    
    try {
      await updateAdminCredentials(newUsername, newPassword);
      
      toast({
        title: "Admin Credentials Updated",
        description: "Your admin username and password have been updated. Please log in again with your new credentials.",
        duration: 5000,
      });
      
      setTimeout(() => {
        logout();
        navigate("/admin-login");
      }, 2000);
      
      setNewUsername("");
      setNewPassword("");
      setError("");
    } catch (err: any) {
      console.error("Update credentials error:", err);
      setError("Failed to update credentials: " + (err.message || "Please try again."));
    }
  };

  const handleUpdateEmailLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(emailLimitValue) || emailLimitValue < 1) {
      setError("Email limit must be a positive number");
      setEmailLimitValue(1); // Reset to 1 if invalid
      return;
    }
    
    // Ensure value is at least 1
    const limitToUse = Math.max(1, emailLimitValue);
    updateEmailLimit(limitToUse);
    
    toast({
      title: "Email Limit Updated",
      description: `Email search results will now be limited to ${limitToUse} most recent emails per user.`,
    });
  };

  const handleAuthorizeGoogle = async (configId: string) => {
    setIsAuthorizing(true);
    setError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-google-auth-url', {
        body: { configId }
      });
      
      if (error) throw new Error(error.message);
      
      if (data.error) throw new Error(data.error);
      
      if (data.authUrl) {
        toast({
          title: "Google Authorization",
          description: "You will be asked to grant permission to access your Gmail. For development purposes, you may see 'unverified app' warnings. These are normal in development.",
        });
        
        window.open(data.authUrl, "_blank");
        
        toast({
          title: "Google Authorization Started",
          description: "Please complete the authorization in the new window. If you see an unverified app warning, click 'Advanced' and 'Go to (app name)' to proceed.",
        });
      }
    } catch (err: any) {
      console.error("Authorization error:", err);
      setError(err.message || "Failed to start Google authorization");
      toast({
        title: "Authorization Error",
        description: err.message || "Failed to start Google authorization",
        variant: "destructive"
      });
    } finally {
      setIsAuthorizing(false);
    }
  };

  const showVerificationInstructions = () => {
    toast({
      title: "Google Verification",
      description: "See the verification instructions panel for details on setting up Google Cloud Console correctly.",
      duration: 5000,
    });
    setActiveTab("verification");
  };

  return (
    <div className="min-h-screen bg-netflix-black text-netflix-white">
      <header className="bg-netflix-gray py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-netflix-red">Admin Dashboard</h1>
        <button 
          onClick={logout}
          className="flex items-center text-netflix-white hover:text-netflix-red transition-colors"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Logout
        </button>
      </header>

      <nav className="bg-netflix-darkgray border-b border-netflix-gray">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "tokens" 
                  ? "text-netflix-red border-b-2 border-netflix-red" 
                  : "text-netflix-white hover:text-netflix-red"
              }`}
              onClick={() => setActiveTab("tokens")}
            >
              Access Tokens
            </button>
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "google" 
                  ? "text-netflix-red border-b-2 border-netflix-red" 
                  : "text-netflix-white hover:text-netflix-red"
              }`}
              onClick={() => setActiveTab("google")}
            >
              Google OAuth
            </button>
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "settings" 
                  ? "text-netflix-red border-b-2 border-netflix-red" 
                  : "text-netflix-white hover:text-netflix-red"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Admin Settings
            </button>
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "email" 
                  ? "text-netflix-red border-b-2 border-netflix-red" 
                  : "text-netflix-white hover:text-netflix-red"
              }`}
              onClick={() => setActiveTab("email")}
            >
              Email Settings
            </button>
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "verification" 
                  ? "text-netflix-red border-b-2 border-netflix-red" 
                  : "text-netflix-white hover:text-netflix-red"
              }`}
              onClick={() => setActiveTab("verification")}
            >
              Google Setup Help
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-netflix-red bg-opacity-30 text-netflix-white p-3 rounded mb-4 max-w-4xl mx-auto netflix-fade-in">
            {error}
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="max-w-4xl mx-auto netflix-fade-in">
            <h2 className="text-xl font-semibold mb-6">Manage Access Tokens</h2>
            
            <div className="bg-netflix-darkgray p-6 rounded-lg mb-8 netflix-scale-in">
              <h3 className="text-lg font-medium mb-4">Create New Token</h3>
              <form onSubmit={handleAddToken} className="flex gap-2">
                <input
                  type="text"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="Enter new access token"
                  className="netflix-input flex-1"
                />
                <button 
                  type="submit" 
                  className="netflix-button flex items-center"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Token
                </button>
              </form>
            </div>
            
            <div className="bg-netflix-gray rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-netflix-lightgray">
                    <th className="py-3 px-4 text-left">Token</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessTokens.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 px-4 text-center text-gray-400">
                        No access tokens created yet
                      </td>
                    </tr>
                  ) : (
                    accessTokens.map((token, index) => (
                      <tr 
                        key={token.id} 
                        className="border-t border-netflix-darkgray netflix-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono">{token.accessToken}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            token.isBlocked 
                              ? "bg-red-900 text-red-200" 
                              : "bg-green-900 text-green-200"
                          }`}>
                            {token.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => blockAccessToken(token.id, !token.isBlocked)}
                              className={`p-2 rounded hover:bg-netflix-lightgray transition-colors flex items-center ${
                                token.isBlocked ? "text-green-500" : "text-red-500"
                              }`}
                              title={token.isBlocked ? "Unblock" : "Block"}
                            >
                              {token.isBlocked ? (
                                <>
                                  <Unlock className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Unblock</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Block</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => deleteAccessToken(token.id)}
                              className="p-2 rounded text-red-500 hover:bg-netflix-lightgray transition-colors flex items-center"
                              title="Delete"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              <span className="text-xs">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "google" && (
          <div className="max-w-4xl mx-auto netflix-fade-in">
            <h2 className="text-xl font-semibold mb-4">Google OAuth Configuration</h2>
            
            <div className="bg-netflix-red bg-opacity-20 p-4 rounded-md mb-6 flex items-start">
              <AlertCircle className="text-netflix-red h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">
                  Important: This application requests Gmail access permissions
                </p>
                <ul className="list-disc pl-5 text-sm mt-2">
                  <li>We request the <code className="bg-black px-1 py-0.5 rounded">gmail.readonly</code> scope to search and display emails</li>
                  <li>When authorizing, you'll need to click "Advanced" and then "Go to (unsafe)" since this is a development app</li>
                  <li>For production use, complete Google's verification process</li>
                  <li className="mt-1">
                    <button 
                      onClick={showVerificationInstructions}
                      className="text-netflix-red underline hover:text-white"
                    >
                      View detailed setup instructions
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-netflix-darkgray p-6 rounded-lg mb-8 netflix-scale-in">
              <h3 className="text-lg font-medium mb-4">Add New Configuration</h3>
              
              <div className="mb-6">
                <label className="block text-netflix-white mb-2">
                  Paste JSON Configuration
                </label>
                <div className="flex gap-2 mb-4">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{"web":{"client_id":"...","project_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_secret":"..."}}'
                    className="netflix-input flex-1"
                    rows={4}
                  />
                  <button 
                    type="button" 
                    onClick={handleParseJson}
                    className="netflix-button self-start"
                  >
                    Parse
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddConfig}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-netflix-white mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={newConfig.clientId}
                      onChange={(e) => setNewConfig({...newConfig, clientId: e.target.value})}
                      placeholder="Google Client ID"
                      className="netflix-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-netflix-white mb-2">
                      Client Secret
                    </label>
                    <input
                      type="text"
                      value={newConfig.clientSecret}
                      onChange={(e) => setNewConfig({...newConfig, clientSecret: e.target.value})}
                      placeholder="Google Client Secret"
                      className="netflix-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-netflix-white mb-2">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={newConfig.projectId}
                      onChange={(e) => setNewConfig({...newConfig, projectId: e.target.value})}
                      placeholder="Google Project ID"
                      className="netflix-input w-full"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="netflix-button w-full"
                >
                  Add Configuration
                </button>
              </form>
            </div>
            
            <div className="space-y-4">
              {googleConfigs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No Google OAuth configurations added yet
                </div>
              ) : (
                googleConfigs.map((config, index) => (
                  <div 
                    key={config.id}
                    className="bg-netflix-gray p-4 rounded-lg netflix-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-netflix-white">
                          {config.projectId || "Google OAuth Config"}
                          {config.isActive && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-900 text-green-200">Active</span>}
                        </h4>
                        <div className="text-sm text-gray-400 mt-1">
                          {config.isActive ? 
                            (config.access_token ? "Authorized" : "Not Authorized") : 
                            "Inactive"}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {config.isActive && !config.access_token && (
                          <button
                            onClick={() => handleAuthorizeGoogle(config.id)}
                            disabled={isAuthorizing}
                            className="p-2 rounded text-green-500 hover:bg-netflix-lightgray transition-colors flex items-center"
                            title="Authorize with Google"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="text-xs">Authorize</span>
                          </button>
                        )}
                        <button
                          onClick={() => updateGoogleConfig(config.id, { isActive: !config.isActive })}
                          className={`p-2 rounded hover:bg-netflix-lightgray transition-colors ${
                            config.isActive ? "text-red-500" : "text-green-500"
                          }`}
                          title={config.isActive ? "Deactivate" : "Activate"}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteGoogleConfig(config.id)}
                          className="p-2 rounded text-red-500 hover:bg-netflix-lightgray transition-colors"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-24">Client ID:</span>
                        <span className="font-mono text-gray-200 truncate flex-1">{config.clientId}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-24">Client Secret:</span>
                        <span className="font-mono text-gray-200 truncate flex-1">
                          {config.clientSecret.substring(0, 8)}...
                        </span>
                      </div>
                      {config.projectId && (
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-24">Project ID:</span>
                          <span className="font-mono text-gray-200 truncate flex-1">{config.projectId}</span>
                        </div>
                      )}
                      {config.access_token && (
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-24">Status:</span>
                          <span className="font-mono text-green-400 truncate flex-1">Authorized ✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto netflix-fade-in">
            <h2 className="text-xl font-semibold mb-6">Admin Account Settings</h2>
            
            <div className="bg-netflix-darkgray p-6 rounded-lg netflix-scale-in">
              <h3 className="text-lg font-medium mb-4">Update Admin Credentials</h3>
              
              <form onSubmit={handleUpdateCredentials} className="space-y-4">
                <div>
                  <label className="block text-netflix-white mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="New admin username"
                    className="netflix-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-netflix-white mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New admin password"
                    className="netflix-input w-full"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="netflix-button w-full"
                >
                  Update Credentials
                </button>
                
                <div className="text-center text-sm text-gray-400 mt-4">
                  <div>Current admin: <span className="font-semibold">{admin?.username}</span></div>
                  <div className="mt-1 text-netflix-red">You will be logged out after updating credentials</div>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <div className="max-w-4xl mx-auto netflix-fade-in">
            <h2 className="text-xl font-semibold mb-6">Email Settings</h2>
            
            <div className="bg-netflix-darkgray p-6 rounded-lg netflix-scale-in space-y-8">
              <div className="border-t border-netflix-gray pt-6">
                <h3 className="text-lg font-medium mb-4">Email Display Limit</h3>
                <p className="text-gray-400 mb-4">
                  Set the maximum number of emails that will be displayed when users search for emails.
                  This helps manage performance and keeps the UI clean.
                </p>
                
                <form onSubmit={handleUpdateEmailLimit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-netflix-red" />
                    <label className="text-netflix-white">
                      Maximum emails to display:
                    </label>
                    <input
                      type="number"
                      value={emailLimitValue}
                      onChange={(e) => setEmailLimitValue(parseInt(e.target.value) || 1)}
                      min="1"
                      max="100"
                      className="netflix-input w-24"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="netflix-button"
                  >
                    Update Email Limit
                  </button>
                  
                  <div className="text-sm text-gray-400 mt-4">
                    Current limit: {emailLimit} emails
                  </div>
                </form>
              </div>
              
              <div className="border-t border-netflix-gray pt-6">
                <h3 className="text-lg font-medium mb-4">Auto-Refresh Settings</h3>
                <p className="text-gray-400 mb-4">
                  Configure how frequently the system automatically checks for new emails. 
                  Auto-refresh keeps the email data current without manual refreshing.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="form-control flex items-center">
                      <input
                        type="checkbox"
                        checked={autoRefreshEnabled}
                        onChange={(e) => toggleAutoRefresh(e.target.checked)}
                        id="auto-refresh-toggle"
                        className="h-4 w-4 accent-netflix-red cursor-pointer"
                      />
                      <label htmlFor="auto-refresh-toggle" className="ml-2 text-netflix-white cursor-pointer">
                        Enable Auto-Refresh
                      </label>
                    </div>
                  </div>
                  
                  <div className={autoRefreshEnabled ? "" : "opacity-50"}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-netflix-white mb-2">
                          Refresh Interval (seconds):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="10"
                            max="300"
                            step="10"
                            disabled={!autoRefreshEnabled}
                            value={Math.round(autoRefreshInterval / 1000)}
                            onChange={(e) => updateAutoRefreshInterval(parseInt(e.target.value) * 1000)}
                            className="w-full h-2 bg-netflix-darkgray rounded-lg appearance-none cursor-pointer accent-netflix-red"
                          />
                          <span className="text-netflix-white min-w-[50px] text-center">
                            {Math.round(autoRefreshInterval / 1000)}s
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        disabled={!autoRefreshEnabled}
                        onClick={() => updateAutoRefreshInterval(60000)} // Reset to 60 seconds
                        className="netflix-button text-sm h-8 px-3"
                      >
                        Reset
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-400 mt-4">
                      {autoRefreshEnabled 
                        ? `Emails will automatically refresh every ${Math.round(autoRefreshInterval / 1000)} seconds` 
                        : "Auto-refresh is currently disabled"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-netflix-gray pt-6">
                <h3 className="text-lg font-medium mb-4">Default Search Email</h3>
                <p className="text-gray-400 mb-4">
                  Set the default email address that will be used to fetch emails when users perform searches.
                  Users will only see filtered results based on their search terms.
                </p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateDefaultSearchEmail(newDefaultEmail);
                }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-netflix-red" />
                    <label className="text-netflix-white">
                      Default search email:
                    </label>
                    <input
                      type="email"
                      value={newDefaultEmail}
                      onChange={(e) => setNewDefaultEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="netflix-input flex-1"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="netflix-button"
                  >
                    Update Default Email
                  </button>
                  
                  <div className="text-sm text-gray-400 mt-4">
                    Current default: {defaultSearchEmail}
                  </div>
                </form>
              </div>

              <div className="border-t border-netflix-gray pt-6">
                <h3 className="text-lg font-medium mb-4">Server Storage Settings</h3>
                <p className="text-gray-400 mb-4">
                  Manage emails stored on the server. The system automatically saves new emails every 3 seconds.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-netflix-black/50 p-4 rounded-lg">
                          <p className="text-sm text-gray-400">Total Stored Emails</p>
                          <p className="text-xl font-semibold text-netflix-white">
                            {serverStorageStats.totalEmails}
                          </p>
                        </div>
                        <div className="bg-netflix-black/50 p-4 rounded-lg">
                          <p className="text-sm text-gray-400">Storage Size</p>
                          <p className="text-xl font-semibold text-netflix-white">
                            {serverStorageStats.storageSize}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-400">Last Updated</p>
                        <p className="text-netflix-white">
                          {serverStorageStats.lastUpdated 
                            ? new Date(serverStorageStats.lastUpdated).toLocaleString() 
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={clearServerStorage}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash className="h-4 w-4" />
                      Clear Server Storage
                    </Button>
                    <Button
                      onClick={getServerStorageStats}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Stats
                    </Button>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p className="mb-2">Server Storage Information:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Emails are automatically saved every 3 seconds</li>
                      <li>Emails from the same domain are automatically replaced</li>
                      <li>Storage is organized by date and domain</li>
                      <li>Clearing storage will remove all saved emails</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="max-w-4xl mx-auto netflix-fade-in">
            <h2 className="text-xl font-semibold mb-6">Google OAuth Setup Guide</h2>
            
            <div className="bg-netflix-darkgray p-6 rounded-lg space-y-6">
              <div>
                <h3 className="text-lg font-medium text-netflix-red mb-3">1. Create/Configure Google Cloud Project</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a></li>
                  <li>Create a new project or select an existing one</li>
                  <li>Go to "APIs & Services" {">"} "OAuth consent screen"</li>
                  <li>Choose "External" user type and click "Create"</li>
                  <li>Fill in the required app information (App name, User support email, Developer contact)</li>
                  <li>Add scopes: <code className="bg-black px-1 rounded">userinfo.email</code>, <code className="bg-black px-1 rounded">userinfo.profile</code>, and <code className="bg-black px-1 rounded">https://www.googleapis.com/auth/gmail.readonly</code></li>
                  <li>Add test users (your Google email) if in testing</li>
                  <li>Review and publish consent screen</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-netflix-red mb-3">2. Create OAuth Credentials</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>Go to "APIs & Services" {">"} "Credentials"</li>
                  <li>Click "Create Credentials" {">"} "OAuth client ID"</li>
                  <li>Choose "Web application" as the application type</li>
                  <li>Add a name for your client</li>
                  <li>Under "Authorized JavaScript origins", add: <code className="bg-black px-1 rounded text-xs sm:text-sm">https://vmztmhwrsyomkohkglcv.supabase.co</code></li>
                  <li className="font-bold text-netflix-white">Under "Authorized redirect URIs", add exactly: <code className="bg-black px-1 rounded break-all text-xs sm:text-sm">https://vmztmhwrsyomkohkglcv.supabase.co/functions/v1/google-auth-callback</code></li>
                  <li>Click "Create" to get your Client ID and Client Secret</li>
                </ol>
                <div className="p-3 bg-netflix-red bg-opacity-20 rounded-md mt-3 text-sm">
                  <p className="font-bold">❗ Important: The "Authorized redirect URI" must exactly match what we're using in our code!</p>
                  <p className="mt-1">If there's a mismatch, even a single character, you'll get the "redirect_uri_mismatch" error.</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-netflix-red mb-3">3. Handling Unverified App Warnings</h3>
                <p className="mb-3">Since your app is in development and not verified by Google, you'll see a warning screen during authorization. To proceed:</p>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>When you see the "App isn't verified" screen, click "Advanced"</li>
                  <li>Click "Go to [your app name] (unsafe)"</li>
                  <li>Since you're requesting sensitive scopes (Gmail access), you may need to add your email as a test user in the OAuth consent screen</li>
                  <li>Complete the normal authorization flow</li>
                </ol>
                <p className="mt-3 text-sm text-gray-400">Note: For production, you'd need to complete Google's verification process.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-netflix-red mb-3">4. Enable Gmail API</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>In the Google Cloud Console, go to "APIs & Services" {">"} "Library"</li>
                  <li>Search for "Gmail API" and select it</li>
                  <li>Click "Enable" to activate the Gmail API for your project</li>
                  <li>Without this step, you'll get "insufficient authentication scopes" errors even with proper authorization</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
