import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Define our types
export interface AccessToken {
  id: string;
  token: string;
  blocked: boolean;
  created_at: string;
}

export interface GoogleAuthConfig {
  id: string;
  clientId: string;
  clientSecret: string;
  projectId?: string;
  authUri?: string;
  tokenUri?: string;
  authProviderCertUrl?: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  active: boolean;
}

export interface DataContextType {
  // Access tokens
  accessTokens: AccessToken[];
  addAccessToken: (token: string) => Promise<boolean>;
  deleteAccessToken: (id: string) => Promise<boolean>;
  blockAccessToken: (id: string, blocked: boolean) => Promise<boolean>;
  
  // Google Auth
  googleConfigs: GoogleAuthConfig[];
  addGoogleConfig: (config: Partial<GoogleAuthConfig>) => Promise<boolean>;
  updateGoogleConfig: (id: string, updates: Partial<GoogleAuthConfig>) => Promise<boolean>;
  deleteGoogleConfig: (id: string) => Promise<boolean>;
  authorizeGoogleConfig: (configId: string) => Promise<string>;
  
  // Admin settings
  updateAdminCredentials: (username: string, password: string) => Promise<boolean>;
  
  // Loading state
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessTokens, setAccessTokens] = useState<AccessToken[]>([]);
  const [googleConfigs, setGoogleConfigs] = useState<GoogleAuthConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load access tokens on mount
  useEffect(() => {
    fetchAccessTokens();
    fetchGoogleConfigs();
  }, []);

  // Fetch access tokens from Supabase
  const fetchAccessTokens = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-access-tokens');
      
      if (error) {
        console.error("Error fetching access tokens:", error);
        toast({
          title: "Error",
          description: "Failed to fetch access tokens",
          variant: "destructive"
        });
        return;
      }
      
      if (data && data.data) {
        setAccessTokens(data.data);
      }
    } catch (err) {
      console.error("Error fetching access tokens:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Google configs from Supabase
  const fetchGoogleConfigs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-google-configs');
      
      if (error) {
        console.error("Error fetching Google configs:", error);
        toast({
          title: "Error",
          description: "Failed to fetch Google configurations",
          variant: "destructive"
        });
        return;
      }
      
      if (data && data.data) {
        setGoogleConfigs(data.data);
      }
    } catch (err) {
      console.error("Error fetching Google configs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new access token
  const addAccessToken = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('add-access-token', {
        body: { token }
      });
      
      if (error) {
        console.error("Error adding access token:", error);
        toast({
          title: "Error",
          description: "Failed to add access token",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Access token added successfully",
      });
      
      // Refresh the token list
      await fetchAccessTokens();
      return true;
    } catch (err) {
      console.error("Error adding access token:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an access token
  const deleteAccessToken = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('delete-access-token', {
        body: { id }
      });
      
      if (error) {
        console.error("Error deleting access token:", error);
        toast({
          title: "Error",
          description: "Failed to delete access token",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Access token deleted successfully",
      });
      
      // Update local state
      setAccessTokens(prev => prev.filter(token => token.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting access token:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Block/unblock an access token
  const blockAccessToken = async (id: string, blocked: boolean): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('update-access-token', {
        body: { id, updates: { blocked } }
      });
      
      if (error) {
        console.error("Error updating access token:", error);
        toast({
          title: "Error",
          description: "Failed to update access token",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: `Access token ${blocked ? 'blocked' : 'unblocked'} successfully`,
      });
      
      // Update local state
      setAccessTokens(prev => 
        prev.map(token => token.id === id ? { ...token, blocked } : token)
      );
      return true;
    } catch (err) {
      console.error("Error updating access token:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new Google OAuth configuration
  const addGoogleConfig = async (config: Partial<GoogleAuthConfig>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('add-google-config', {
        body: { 
          client_id: config.clientId,
          client_secret: config.clientSecret,
          description: config.projectId || "Google OAuth Config",
          active: config.active || false
        }
      });
      
      if (error) {
        console.error("Error adding Google config:", error);
        toast({
          title: "Error",
          description: "Failed to add Google configuration",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Google configuration added successfully",
      });
      
      // Refresh the config list
      await fetchGoogleConfigs();
      return true;
    } catch (err) {
      console.error("Error adding Google config:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a Google OAuth configuration
  const updateGoogleConfig = async (id: string, updates: Partial<GoogleAuthConfig>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('update-google-config', {
        body: { 
          id,
          updates: {
            client_id: updates.clientId,
            client_secret: updates.clientSecret,
            description: updates.projectId,
            active: updates.active
          }
        }
      });
      
      if (error) {
        console.error("Error updating Google config:", error);
        toast({
          title: "Error",
          description: "Failed to update Google configuration",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Google configuration updated successfully",
      });
      
      // Refresh the config list
      await fetchGoogleConfigs();
      return true;
    } catch (err) {
      console.error("Error updating Google config:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a Google OAuth configuration
  const deleteGoogleConfig = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('delete-google-config', {
        body: { id }
      });
      
      if (error) {
        console.error("Error deleting Google config:", error);
        toast({
          title: "Error",
          description: "Failed to delete Google configuration",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Google configuration deleted successfully",
      });
      
      // Update local state
      setGoogleConfigs(prev => prev.filter(config => config.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting Google config:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate authorization URL for Google OAuth
  const authorizeGoogleConfig = async (configId: string): Promise<string> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-google-auth-url', {
        body: { configId }
      });
      
      if (error) {
        console.error("Error generating auth URL:", error);
        toast({
          title: "Error",
          description: "Failed to generate authorization URL",
          variant: "destructive"
        });
        return "";
      }
      
      if (!data || !data.authUrl) {
        toast({
          title: "Error",
          description: "No authorization URL returned",
          variant: "destructive"
        });
        return "";
      }
      
      return data.authUrl;
    } catch (err) {
      console.error("Error generating auth URL:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return "";
    } finally {
      setIsLoading(false);
    }
  };

  // Update admin credentials
  const updateAdminCredentials = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('update-admin-credentials', {
        body: { username, password }
      });
      
      if (error) {
        console.error("Error updating admin credentials:", error);
        toast({
          title: "Error",
          description: "Failed to update admin credentials",
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Admin credentials updated successfully",
      });
      
      return true;
    } catch (err) {
      console.error("Error updating admin credentials:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        // Access tokens
        accessTokens,
        addAccessToken,
        deleteAccessToken,
        blockAccessToken,
        
        // Google Auth
        googleConfigs,
        addGoogleConfig,
        updateGoogleConfig,
        deleteGoogleConfig,
        authorizeGoogleConfig,
        
        // Admin settings
        updateAdminCredentials,
        
        // Loading state
        isLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
