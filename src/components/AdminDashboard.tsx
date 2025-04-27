import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { GoogleAuthConfig } from "@/context/DataContext";
import { LogIn, Plus, User, Trash, X, Edit, ExternalLink, AlertCircle, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
    authorizeGoogleConfig,
    isLoading
  } = useData();
  const navigate = useNavigate();

  const [newToken, setNewToken] = useState("");
  const [newConfig, setNewConfig] = useState<{ 
    clientId: string; 
    clientSecret: string;
    projectId: string;
  }>({
    clientId: "",
    clientSecret: "",
    projectId: ""
  });
  const [jsonInput, setJsonInput] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [activeTab, setActiveTab] = useState("tokens");
  const [error, setError] = useState("");
  const [editingConfig, setEditingConfig] = useState<string | null>(null);

  // Redirect to login if not authenticated as admin
  useEffect(() => {
    if (!admin) {
      navigate("/admin-login");
    }
  }, [admin, navigate]);

  // Handle adding new access token
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

  // Handle adding new Google OAuth config
  const handleAddConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfig.clientId || !newConfig.clientSecret) {
      setError("Client ID and Secret are required");
      return;
    }
    
    addGoogleConfig({
      clientId: newConfig.clientId,
      clientSecret: newConfig.clientSecret,
      projectId: newConfig.projectId,
      active: true
    });
    
    setNewConfig({
      clientId: "",
      clientSecret: "",
      projectId: ""
    });
    setError("");
  };

  // Parse JSON credentials from Google Cloud Console
  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed && parsed.web) {
        setNewConfig({
          clientId: parsed.web.client_id || "",
          clientSecret: parsed.web.client_secret || "",
          projectId: parsed.web.project_id || ""
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

  // Handle updating admin credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setError("Username and password are required");
      return;
    }
    
    try {
      const success = await updateAdminCredentials(newUsername, newPassword);
      
      if (success) {
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
      }
    } catch (err: any) {
      console.error("Update credentials error:", err);
      setError("Failed to update credentials: " + (err.message || "Please try again."));
    }
  };

  // Handle Google OAuth authorization
  const handleAuthorizeGoogle = async (configId: string) => {
    try {
      setIsAuthorizing(true);
      const authUrl = await authorizeGoogleConfig(configId);
      
      if (authUrl) {
        // Open the auth URL in a new window
        window.open(authUrl, "_blank", "width=800,height=600");
        
        toast({
          title: "Authorization Started",
          description: "Please complete the Google authentication in the new window.",
        });
      }
    } catch (err) {
      console.error("Google auth error:", err);
      toast({
        title: "Authorization Error",
        description: "Failed to start Google authorization",
        variant: "destructive"
      });
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gray-100 py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Admin Dashboard</h1>
        <button 
          onClick={logout}
          className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Logout
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "tokens" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("tokens")}
            >
              Access Tokens
            </button>
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "google" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("google")}
            >
              Google OAuth
            </button>
            <button
              className={`py-4 px-4 text-sm font-medium transition-colors ${
                activeTab === "settings" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Admin Settings
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Access Tokens Tab */}
        {activeTab === "tokens" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Access Token Management</h2>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
              <h3 className="text-lg font-medium mb-4">Add New Access Token</h3>
              
              <form onSubmit={handleAddToken} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Access Token
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      placeholder="Enter access token"
                      className="flex-1 p-2 border border-gray-300 rounded-l-md"
                    />
                    <button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
                      disabled={isLoading}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
              </form>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Existing Access Tokens</h3>
              
              {accessTokens.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-gray-500">No access tokens found</div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accessTokens.map((token) => (
                        <tr key={token.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono text-sm text-gray-900 truncate max-w-xs">
                              {token.token}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {token.blocked ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Blocked
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(token.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => blockAccessToken(token.id, !token.blocked)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={isLoading}
                            >
                              {token.blocked ? (
                                <Unlock className="h-5 w-5" />
                              ) : (
                                <Lock className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteAccessToken(token.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isLoading}
                            >
                              <Trash className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google OAuth Tab */}
        {activeTab === "google" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Google OAuth Configuration</h2>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
              <h3 className="text-lg font-medium mb-4">Add New Google OAuth Configuration</h3>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-md font-medium mb-2">Parse from Google JSON</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Paste the JSON from Google Cloud Console's OAuth 2.0 Client IDs to automatically fill the form.
                </p>
                
                <div className="space-y-4">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='Paste your Google credentials JSON here. Example: {"web":{"client_id":"...","client_secret":"...","project_id":"..."}}'
                    className="w-full p-2 border border-gray-300 rounded-md text-sm font-mono h-32"
                  />
                  
                  <button 
                    onClick={handleParseJson}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
                    disabled={!jsonInput}
                  >
                    Parse JSON
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAddConfig}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={newConfig.clientId}
                      onChange={(e) => setNewConfig({...newConfig, clientId: e.target.value})}
                      placeholder="Google Client ID"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Client Secret
                    </label>
                    <input
                      type="text"
                      value={newConfig.clientSecret}
                      onChange={(e) => setNewConfig({...newConfig, clientSecret: e.target.value})}
                      placeholder="Google Client Secret"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={newConfig.projectId}
                      onChange={(e) => setNewConfig({...newConfig, projectId: e.target.value})}
                      placeholder="Google Project ID"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full"
                  disabled={isLoading}
                >
                  Add Configuration
                </button>
                
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </form>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Existing Google OAuth Configurations</h3>
              
              {googleConfigs.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-gray-500">No Google OAuth configurations found</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {googleConfigs.map((config) => (
                    <div 
                      key={config.id} 
                      className="bg-white p-6 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-medium">{config.projectId || "Google OAuth Config"}</h4>
                          {config.active && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleAuthorizeGoogle(config.id)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={isAuthorizing || isLoading}
                          >
                            <ExternalLink className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteGoogleConfig(config.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isLoading}
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-24">Client ID:</span>
                          <span className="font-mono text-gray-700 truncate flex-1">{config.clientId}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-24">Client Secret:</span>
                          <span className="font-mono text-gray-700 truncate flex-1">
                            {config.clientSecret.substring(0, 8)}...
                          </span>
                        </div>
                        {config.projectId && (
                          <div className="flex gap-2">
                            <span className="text-gray-500 w-24">Project ID:</span>
                            <span className="font-mono text-gray-700 truncate flex-1">{config.projectId}</span>
                          </div>
                        )}
                        {config.access_token && (
                          <div className="flex gap-2">
                            <span className="text-gray-500 w-24">Status:</span>
                            <span className="font-mono text-green-600 truncate flex-1">Authorized ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Admin Account Settings</h2>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Update Admin Credentials</h3>
              
              <form onSubmit={handleUpdateCredentials} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="New admin username"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New admin password"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full"
                  disabled={isLoading}
                >
                  Update Credentials
                </button>
                
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <div>Current admin: <span className="font-semibold">{admin?.username}</span></div>
                  <div className="mt-1 text-red-600">You will be logged out after updating credentials</div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
