import React, { createContext, useContext, useState, useEffect } from "react";
import { DataContextType, User, GoogleAuthConfig, Email, Admin } from "@/types";
import { v4 as uuidv4 } from "@/utils/uuid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const DataContext = createContext<DataContextType | undefined>(undefined);

interface SearchConfig {
  maxResults: number;  // Configurable via admin panel
  includeOldEmails: boolean;
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Access Tokens
  const [accessTokens, setAccessTokens] = useState<User[]>([]);
  
  // Google Auth Configs
  const [googleConfigs, setGoogleConfigs] = useState<GoogleAuthConfig[]>([]);
  
  // Emails
  const [emails, setEmails] = useState<Email[]>([]);

  // Email limit setting - explicitly set to 1 as default
  const [emailLimit, setEmailLimit] = useState<number>(1);

  // Default search email
  const [defaultSearchEmail, setDefaultSearchEmail] = useState<string>("info@account.netflix.com");

  // Auto-refresh settings
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(60000); // 1 minute default
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Search config
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    maxResults: 10,  // Default value, can be changed from admin panel
    includeOldEmails: true
  });

  // Load data from Supabase on mount
  useEffect(() => {
    fetchAccessTokens();
    fetchGoogleConfigs();
    fetchEmails();
    loadEmailLimit();
    loadDefaultSearchEmail();
    loadAutoRefreshSettings();
  }, []);

  // Load auto-refresh settings from local storage
  const loadAutoRefreshSettings = () => {
    try {
      const savedInterval = localStorage.getItem("autoRefreshInterval");
      if (savedInterval) {
        const interval = parseInt(savedInterval, 10);
        if (!isNaN(interval) && interval >= 10000) { // Minimum 10 seconds
          setAutoRefreshInterval(interval);
        }
      }
      
      const savedEnabled = localStorage.getItem("autoRefreshEnabled");
      if (savedEnabled !== null) {
        setAutoRefreshEnabled(savedEnabled === "true");
      }
    } catch (err) {
      console.error("Error loading auto-refresh settings:", err);
    }
  };

  // Update auto-refresh interval (in milliseconds)
  const updateAutoRefreshInterval = (interval: number) => {
    // Ensure interval is at least 10 seconds
    const validInterval = Math.max(10000, interval);
    setAutoRefreshInterval(validInterval);
    localStorage.setItem("autoRefreshInterval", validInterval.toString());
    
    toast({
      title: "Auto-Refresh Interval Updated",
      description: `Emails will refresh every ${Math.round(validInterval / 1000)} seconds.`,
    });
  };

  // Toggle auto-refresh on/off
  const toggleAutoRefresh = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    localStorage.setItem("autoRefreshEnabled", enabled.toString());
    
    toast({
      title: enabled ? "Auto-Refresh Enabled" : "Auto-Refresh Disabled",
      description: enabled 
        ? `Emails will automatically refresh every ${Math.round(autoRefreshInterval / 1000)} seconds.` 
        : "Automatic email refreshing is now disabled.",
    });
  };

  // Load email limit from local storage with enhanced validation
  const loadEmailLimit = () => {
    try {
      const storedLimit = localStorage.getItem("emailLimit");
      
      // If no limit is stored or value is invalid, always default to 1
      if (!storedLimit) {
        console.log("No email limit in localStorage, setting default of 1");
        setEmailLimit(1);
        localStorage.setItem("emailLimit", "1");
        return;
      }
      
      // Parse and validate the limit
      const parsedLimit = parseInt(storedLimit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        console.error("Invalid email limit in localStorage:", storedLimit);
        setEmailLimit(1); 
        localStorage.setItem("emailLimit", "1");
      } else {
        console.log("Email limit loaded from localStorage:", parsedLimit);
        setEmailLimit(parsedLimit);
      }
    } catch (err) {
      console.error("Error parsing email limit:", err);
      // Always default to 1 if there's any error
      setEmailLimit(1);
      localStorage.setItem("emailLimit", "1");
    }
  };

  // Update email limit with strict validation
  const updateEmailLimit = (limit: number) => {
    // Ensure limit is a valid number and at least 1
    const validLimit = (!isNaN(limit) && limit >= 1) ? limit : 1;
    
    console.log("Updating email limit to:", validLimit);
    setEmailLimit(validLimit);
    localStorage.setItem("emailLimit", validLimit.toString());
    
    toast({
      title: "Email Limit Updated",
      description: `Users will now see up to ${validLimit} emails in search results.`,
    });
  };

  // Load default search email from local storage
  const loadDefaultSearchEmail = () => {
    const stored = localStorage.getItem("defaultSearchEmail");
    if (stored) {
      setDefaultSearchEmail(stored);
    }
  };

  // Update default search email
  const updateDefaultSearchEmail = async (email: string): Promise<void> => {
    setDefaultSearchEmail(email);
    localStorage.setItem("defaultSearchEmail", email);
    toast({
      title: "Default Search Email Updated",
      description: `Search will now fetch emails from ${email}`,
    });
  };

  // Fetch data using Edge Functions
  const fetchAccessTokens = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-access-tokens');
      
      if (error) throw error;
      
      if (data && data.success && data.data) {
        const tokens: User[] = data.data.map((token: any) => ({
          id: token.id,
          accessToken: token.token,
          isBlocked: token.blocked || false
        }));
        setAccessTokens(tokens);
      }
    } catch (error) {
      console.error('Error fetching access tokens:', error);
    }
  };

  const fetchGoogleConfigs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-configs');
      
      if (error) throw error;
      
      if (data && data.success && data.data) {
        const configs: GoogleAuthConfig[] = data.data.map((config: any) => ({
          id: config.id,
          clientId: config.client_id,
          clientSecret: config.client_secret,
          projectId: config.description,
          authUri: "https://accounts.google.com/o/oauth2/auth",
          tokenUri: "https://oauth2.googleapis.com/token",
          authProviderCertUrl: "https://www.googleapis.com/oauth2/v1/certs",
          isActive: config.active || false,
          access_token: config.access_token || null
        }));
        setGoogleConfigs(configs);
      }
    } catch (error) {
      console.error('Error fetching Google configs:', error);
    }
  };

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const emailList: Email[] = data.map(email => ({
          id: email.id,
          from: email.from_address,
          to: email.to_address,
          subject: email.subject,
          body: email.snippet,
          date: email.date,
          isRead: email.read || false,
          isHidden: email.hidden || false
        }));
        setEmails(emailList);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  // Access Token operations
  const addAccessToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('add-access-token', {
        body: {
          token: token,
          description: `Token created on ${new Date().toLocaleDateString()}`,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);
      
      if (data.success && data.data) {
        const formattedToken: User = {
          id: data.data.id,
          accessToken: data.data.token,
          isBlocked: data.data.blocked || false
        };
        
        setAccessTokens(prev => [...prev, formattedToken]);
        toast({
          title: "Success",
          description: "Access token added successfully",
        });
      }
      
      // Refresh the tokens list to ensure we have the latest data
      await fetchAccessTokens();
      
    } catch (error: any) {
      console.error('Error adding access token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add access token",
        variant: "destructive"
      });
    }
  };

  const deleteAccessToken = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-access-token', {
        body: { id }
      });
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);
      
      setAccessTokens(prev => prev.filter(token => token.id !== id));
      toast({
        title: "Success",
        description: "Access token deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting access token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete access token",
        variant: "destructive"
      });
    }
  };

  const blockAccessToken = async (id: string, blocked: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-access-token', {
        body: { id, blocked }
      });
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);
      
      setAccessTokens(prev => 
        prev.map(token => 
          token.id === id ? { ...token, isBlocked: blocked } : token
        )
      );
      toast({
        title: "Success",
        description: `Access token ${blocked ? 'blocked' : 'unblocked'} successfully`,
      });
      
      // Refresh the tokens list to ensure we have the latest data
      await fetchAccessTokens();
      
    } catch (error: any) {
      console.error('Error blocking access token:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${blocked ? 'block' : 'unblock'} access token`,
        variant: "destructive"
      });
    }
  };

  // Google Config operations
  const addGoogleConfig = async (config: Omit<GoogleAuthConfig, "id" | "isActive">) => {
    try {
      const { error: apiError, data } = await supabase.functions.invoke('add-google-config', {
        body: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          description: config.projectId,
          active: true
        }
      });
      
      if (apiError) throw apiError;
      
      if (data && data.error) throw new Error(data.error);
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
      toast({
        title: "Success",
        description: "Google authentication configuration added successfully",
      });
    } catch (error: any) {
      console.error('Error adding Google config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add Google authentication configuration",
        variant: "destructive"
      });
    }
  };

  const updateGoogleConfig = async (id: string, config: Partial<GoogleAuthConfig>) => {
    try {
      const updates: any = {};
      
      if (config.clientId !== undefined) updates.client_id = config.clientId;
      if (config.clientSecret !== undefined) updates.client_secret = config.clientSecret;
      if (config.projectId !== undefined) updates.description = config.projectId;
      if (config.isActive !== undefined) updates.active = config.isActive;
      
      const { error: apiError, data } = await supabase.functions.invoke('update-google-config', {
        body: {
          id: id,
          updates: updates
        }
      });
      
      if (apiError) throw apiError;
      
      if (data && data.error) throw new Error(data.error);
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
      toast({
        title: "Success",
        description: "Google authentication configuration updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating Google config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update Google authentication configuration",
        variant: "destructive"
      });
    }
  };

  const deleteGoogleConfig = async (id: string) => {
    try {
      const { error: apiError, data } = await supabase.functions.invoke('delete-google-config', {
        body: {
          id: id
        }
      });
      
      if (apiError) throw apiError;
      
      if (data && data.error) throw new Error(data.error);
      
      setGoogleConfigs(prev => prev.filter(config => config.id !== id));
      toast({
        title: "Success",
        description: "Google authentication configuration deleted successfully",
      });
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
    } catch (error: any) {
      console.error('Error deleting Google config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete Google authentication configuration",
        variant: "destructive"
      });
    }
  };

  // Email operations
  const searchEmails = async (searchQuery: string): Promise<Email[]> => {
    try {
      setIsLoading(true);
      
      // Search both new and old emails
      const { data, error } = await supabase.functions.invoke('search-emails', {
        body: { 
          searchEmail: defaultSearchEmail,
          query: searchQuery,
          maxResults: searchConfig.maxResults,
          includeOldEmails: searchConfig.includeOldEmails
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.emails && Array.isArray(data.emails)) {
        // Group emails by sender
        const emailsBySender = data.emails.reduce((acc: { [key: string]: Email[] }, email: any) => {
          const sender = email.from.toLowerCase();
          if (!acc[sender]) {
            acc[sender] = [];
          }
          acc[sender].push({
            id: email.id,
            from: email.from,
            to: email.to,
            subject: email.subject,
            body: email.snippet || email.body,  // Use snippet for list view
            date: email.date,
            isRead: email.isRead,
            isHidden: false,
            threadId: email.threadId,
            hasFullContent: false  // Flag to indicate if full content is downloaded
          });
          return acc;
        }, {});

        // Get latest email from each sender
        const latestEmails = Object.values(emailsBySender).map(emails => {
          // Sort by date descending and take the first one
          return emails.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
        });

        // Sort final results by date
        const sortedEmails = latestEmails.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Limit results based on admin config
        return sortedEmails.slice(0, searchConfig.maxResults);
      }

      return [];
    } catch (error: any) {
      console.error('Error searching emails:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search emails",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmailVisibility = async (id: string) => {
    try {
      // Find the email in both the emails state and update it
      setEmails(prev => {
        const updatedEmails = prev.map(email => {
          if (email.id === id) {
            // Toggle the isHidden property
            return { ...email, isHidden: !email.isHidden };
          }
          return email;
        });
        return updatedEmails;
      });
      
      // Find the current email to get its current hidden state
      const email = emails.find(e => e.id === id);
      const newHiddenState = email ? !email.isHidden : true; // Default to true if not found
      
      // Update in the database asynchronously
      await supabase
        .from('emails')
        .update({ hidden: newHiddenState })
        .eq('id', id);
        
    } catch (error: any) {
      console.error('Error toggling email visibility:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email visibility",
        variant: "destructive"
      });
    }
  };

  // Update admin credentials
  const updateAdminCredentials = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Validate input
        if (!username.trim() || !password.trim()) {
          toast({
            title: "Error",
            description: "Username and password cannot be empty",
            variant: "destructive"
          });
          reject(new Error("Username and password cannot be empty"));
          return;
        }
        
        console.log("Updating admin credentials to:", { username });
        
        // Update admin credentials in localStorage
        const updatedAdmin: Admin = { username, password };
        localStorage.setItem("adminCredentials", JSON.stringify(updatedAdmin));
        
        toast({
          title: "Success",
          description: "Admin credentials updated successfully. Please log in with your new credentials.",
        });
        
        resolve();
      } catch (error: any) {
        console.error("Error updating admin credentials:", error);
        reject(error);
      }
    });
  };

  // Helper function to format email content without sanitize-html
  const formatEmailContent = (content: string, contentType: string): string => {
    if (contentType.includes('text/html')) {
      // First preserve all "Get Code" buttons and important links
      let sanitized = content
        // Preserve Get Code buttons with specific styling
        .replace(
          /<a\s+[^>]*?class=["']button["'][^>]*>.*?Get\s+Code.*?<\/a>/gi,
          (match) => `<div class="get-code-button">${match}</div>`
        )
        // Preserve other important buttons
        .replace(
          /<button[^>]*>(.*?Get\s+Code.*?)<\/button>/gi,
          '<button class="get-code-button" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 10px 0; cursor: pointer; border: none; text-decoration: none;">$1</button>'
        )
        // Ensure Get Code links are visible
        .replace(
          /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?(?:get|code).*?)\1/gi,
          '<a href=$1$2$1 class="get-code-link" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 5px 0; text-decoration: none;"'
        );

      // Basic security sanitization
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
        .replace(/ on\w+="[^"]*"/g, '')
        .replace(/ on\w+='[^']*'/g, '')
        .replace(/javascript:[^\s"']+/gi, '');

      // Add styles for buttons and links
      const styledContent = `
        <style>
          .email-content {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #FFFFFF;
            max-width: 100%;
            overflow-wrap: break-word;
          }
          
          .get-code-button a,
          .get-code-link {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: #e50914;
            color: white !important;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            margin: 10px 0;
            text-decoration: none;
            text-align: center;
            min-width: 120px;
          }
          
          .get-code-button a:hover,
          .get-code-link:hover {
            background-color: #f40612;
          }
          
          .email-content a:not(.get-code-link) {
            color: #0071eb;
            text-decoration: underline;
          }
          
          .email-content img {
            max-width: 100%;
            height: auto;
          }
          
          .email-content button {
            cursor: pointer;
            border: none;
            display: inline-block;
            visibility: visible !important;
            opacity: 1 !important;
          }
        </style>
        <div class="email-content">
          ${sanitized}
        </div>
      `;

      return styledContent;
    } else {
      // For plain text emails, convert "Get Code" text to buttons
      const textWithButtons = content
        .replace(
          /Get\s+Code/gi,
          '<button class="get-code-button" style="display: inline-block !important; visibility: visible !important; opacity: 1 !important; background-color: #e50914; color: white; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 10px 0; cursor: pointer; border: none; text-decoration: none;">Get Code</button>'
        );

      return `
        <style>
          .email-content {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #FFFFFF;
            white-space: pre-wrap;
            max-width: 100%;
            overflow-wrap: break-word;
          }
          
          .get-code-button {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: #e50914;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            margin: 10px 0;
            cursor: pointer;
            border: none;
            text-decoration: none;
          }
          
          .get-code-button:hover {
            background-color: #f40612;
          }
        </style>
        <div class="email-content">
          ${textWithButtons
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}
        </div>
      `;
    }
  };

  // Function to get full email content
  const getFullEmailContent = async (emailId: string): Promise<Email | null> => {
    try {
      // First check if we have it in localStorage
      const cachedEmail = localStorage.getItem(`email_${emailId}`);
      if (cachedEmail) {
        return JSON.parse(cachedEmail);
      }

      // If not in cache, fetch from API
      const { data, error } = await supabase.functions.invoke('get-email-content', {
        body: { 
          emailId,
          format: 'full'
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.email) {
        // Format the email content
        const formattedEmail = {
          ...data.email,
          hasFullContent: true,
          formattedBody: formatEmailContent(data.email.body, data.email.contentType)
        };

        // Save to localStorage
        localStorage.setItem(`email_${emailId}`, JSON.stringify(formattedEmail));

        return formattedEmail;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting full email:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      accessTokens,
      googleConfigs,
      emails,
      emailLimit,
      fetchEmails: searchEmails,
      addAccessToken,
      deleteAccessToken,
      blockAccessToken,
      addGoogleConfig,
      updateGoogleConfig,
      deleteGoogleConfig,
      toggleEmailVisibility,
      updateAdminCredentials,
      updateEmailLimit,
      defaultSearchEmail,
      updateDefaultSearchEmail,
      autoRefreshInterval,
      autoRefreshEnabled,
      updateAutoRefreshInterval,
      toggleAutoRefresh,
      getFullEmailContent,
      searchConfig,
      setSearchConfig
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
