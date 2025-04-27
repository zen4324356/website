import React, { createContext, useContext, useState, useEffect } from "react";
import { DataContextType, User, GoogleAuthConfig, Email, Admin, AccessToken, GoogleConfig, AdminCredentials } from "@/types";
import { v4 as uuidv4 } from "@/utils/uuid";
import { supabase } from "@/integrations/supabase/client";

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataContextType {
  accessTokens: AccessToken[];
  googleConfigs: GoogleConfig[];
  emails: Email[];
  emailLimit: number;
  fetchEmails: (searchQuery?: string) => Promise<Email[]>;
  addAccessToken: (token: AccessToken) => void;
  deleteAccessToken: (id: string) => void;
  blockAccessToken: (id: string) => void;
  addGoogleConfig: (config: GoogleConfig) => void;
  updateGoogleConfig: (config: GoogleConfig) => void;
  deleteGoogleConfig: (id: string) => void;
  toggleEmailVisibility: (id: string) => void;
  updateAdminCredentials: (credentials: AdminCredentials) => void;
  updateEmailLimit: (limit: number) => void;
  defaultSearchEmail: string;
  updateDefaultSearchEmail: (email: string) => void;
  autoRefreshInterval: number;
  autoRefreshEnabled: boolean;
  updateAutoRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: () => void;
  clearEmailsFromLocalStorage: () => void;
  saveEmailsToLocalStorage: (emails: Email[]) => void;
  loadEmailsFromLocalStorage: () => Email[];
  clearServerStorage: () => void;
  serverStorageStats: {
    totalEmails: number;
    lastUpdated: string;
    storageSize: string;
  };
  getServerStorageStats: () => Promise<void>;
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
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Add server storage statistics state
  const [serverStorageStats, setServerStorageStats] = useState<{
    totalEmails: number;
    lastUpdated: string;
    storageSize: string;
  }>({
    totalEmails: 0,
    lastUpdated: '',
    storageSize: '0 MB'
  });

  // Add new state for auto-fetch timer
  const [autoFetchTimer, setAutoFetchTimer] = useState<NodeJS.Timeout | null>(null);

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

  // Auto-fetch emails and store in database
  useEffect(() => {
    const autoFetchEmails = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('search-emails', {
          body: { 
            searchEmail: defaultSearchEmail,
            includeRead: true,
            includeUnread: true,
            includeForwarded: true,
            includeDomainForwarded: true,
            includeImportant: true,
            includeGrouped: true,
            includeUngrouped: true,
            minutesBack: 30,
            fetchUnread: true
          }
        });

        if (error) {
          console.error('Auto-fetch error:', error);
          return;
        }

        if (data.emails && Array.isArray(data.emails)) {
          const formattedEmails: Email[] = data.emails.map((email: any) => ({
            id: email.id,
            from: email.from || "Unknown Sender",
            to: email.to || "Unknown Recipient",
            subject: email.subject || "No Subject",
            body: email.body || "No content available",
            date: email.date || new Date().toISOString(),
            isRead: email.isRead || false,
            isHidden: false,
            matchedIn: email.matchedIn || "unknown",
            extractedRecipients: email.extractedRecipients || [],
            rawMatch: email.rawMatch || null,
            isForwardedEmail: email.isForwardedEmail || false,
            isCluster: email.isCluster || false,
            isDomainForwarded: email.isDomainForwarded || false,
            isImportant: email.isImportant || false,
            isGrouped: email.isGrouped || false
          }));

          // Save to server storage with domain-based replacement
          await saveEmailsToServer(formattedEmails);
          
          // Update server storage stats
          await getServerStorageStats();
        }
      } catch (error) {
        console.error('Auto-fetch error:', error);
      }
    };

    // Clear existing timer if any
    if (autoFetchTimer) {
      clearInterval(autoFetchTimer);
    }

    // Set up new timer if auto-refresh is enabled
    if (autoRefreshEnabled && defaultSearchEmail) {
      // Initial fetch
      autoFetchEmails();
      
      // Set up interval
      const timer = setInterval(autoFetchEmails, autoRefreshInterval);
      setAutoFetchTimer(timer);
    }

    // Cleanup function
    return () => {
      if (autoFetchTimer) {
        clearInterval(autoFetchTimer);
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval, defaultSearchEmail]);

  // Update auto-refresh interval (in milliseconds)
  const updateAutoRefreshInterval = async (interval: number) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          auto_refresh_interval: interval
        });

      if (error) throw error;

      setAutoRefreshInterval(interval);
    } catch (error) {
      console.error('Error updating auto-refresh interval:', error);
    }
  };

  // Toggle auto-refresh on/off
  const toggleAutoRefresh = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          auto_refresh_enabled: enabled
        });

      if (error) throw error;

    setAutoRefreshEnabled(enabled);
    } catch (error) {
      console.error('Error toggling auto-refresh:', error);
    }
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
  const updateEmailLimit = async (limit: number) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          email_limit: limit
        });

      if (error) throw error;

      setEmailLimit(limit);
    } catch (error) {
      console.error('Error updating email limit:', error);
    }
  };

  // Load default search email from local storage
  const loadDefaultSearchEmail = () => {
    const stored = localStorage.getItem("defaultSearchEmail");
    if (stored) {
      setDefaultSearchEmail(stored);
    }
  };

  // Update default search email
  const updateDefaultSearchEmail = async (email: string) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          default_search_email: email
        });

      if (error) throw error;

    setDefaultSearchEmail(email);
    } catch (error) {
      console.error('Error updating default search email:', error);
    }
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

  const fetchEmails = async (searchQuery?: string) => {
    try {
      if (searchQuery) {
        // If searchQuery is provided, use searchEmails function
        return await searchEmails(searchQuery);
      }
      
      // Original functionality for fetching all emails
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
        return emailList;
      }
      return [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      return [];
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
      }
      
      // Refresh the tokens list to ensure we have the latest data
      await fetchAccessTokens();
      
    } catch (error: any) {
      console.error('Error adding access token:', error);
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
    } catch (error: any) {
      console.error('Error deleting access token:', error);
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
      
      // Refresh the tokens list to ensure we have the latest data
      await fetchAccessTokens();
      
    } catch (error: any) {
      console.error('Error blocking access token:', error);
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
      
    } catch (error: any) {
      console.error('Error adding Google config:', error);
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
      
    } catch (error: any) {
      console.error('Error updating Google config:', error);
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
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
    } catch (error: any) {
      console.error('Error deleting Google config:', error);
    }
  };

  // Get server storage statistics
  const getServerStorageStats = async () => {
    try {
      const { data, error } = await supabase
        .from('server_storage_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error getting server storage stats:', error);
        return;
      }

      setServerStorageStats({
        totalEmails: data.total_emails,
        storageSize: data.storage_size,
        lastUpdated: data.last_updated
      });
    } catch (error) {
      console.error('Error getting server storage stats:', error);
    }
  };

  // Function to clean up old emails from database
  const cleanupOldEmails = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('server_emails')
        .delete()
        .lt('updated_at', oneHourAgo);

      if (error) {
        console.error('Error cleaning up old emails:', error);
        return;
      }

      // Update server storage stats after cleanup
      await getServerStorageStats();
    } catch (error) {
      console.error('Error in cleanupOldEmails:', error);
    }
  };

  // Set up cleanup interval
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupOldEmails, 60 * 60 * 1000); // Run every hour
    
    // Initial cleanup
    cleanupOldEmails();

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Modified searchEmails function to check all sources with clear tags
  const searchEmails = async (searchQuery: string): Promise<Email[]> => {
    try {
      // 1. First check Supabase database with exact match
      const { data: dbData, error: dbError } = await supabase
        .from('server_emails')
        .select('email_data, updated_at')
        .eq(`email_data->>'to'`, searchQuery)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (dbError) {
        console.error('Error fetching from database:', dbError);
      }

      const serverMatches = (dbData || []).map(item => ({
        ...item.email_data,
        source: 'server_database',
        sourceTag: 'Server DB - Cached',
        lastUpdated: item.updated_at
      }));

      // 2. Then check local storage with exact match
      const localEmails = loadEmailsFromLocalStorage();
      const localMatches = localEmails
        .filter(email => email.to === searchQuery)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 1)
        .map(email => ({
          ...email,
          source: 'local_storage',
          sourceTag: 'Local Storage - Offline',
          lastUpdated: new Date().toISOString()
        }));

      // 3. Finally check Gmail API with exact match
      const { data, error } = await supabase.functions.invoke('search-emails', {
        body: { 
          searchEmail: defaultSearchEmail,
          searchQuery: searchQuery,
          includeRead: true,
          includeUnread: true,
          includeForwarded: true,
          includeDomainForwarded: true,
          includeImportant: true,
          includeGrouped: true,
          includeUngrouped: true,
          minutesBack: 30,
          fetchUnread: true,
          exactMatch: true,
          matchType: 'exact',
          searchIn: ['to']
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      let apiEmails: Email[] = [];
      if (data.emails && Array.isArray(data.emails)) {
        apiEmails = data.emails
          .filter((email: any) => email.to === searchQuery)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 1)
          .map((email: any) => ({
            id: email.id,
            from: email.from || "Unknown Sender",
            to: email.to || "Unknown Recipient",
            subject: email.subject || "No Subject",
            body: email.body || "No content available",
            date: email.date || new Date().toISOString(),
            isRead: email.isRead || false,
            isHidden: false,
            matchedIn: email.matchedIn || "unknown",
            extractedRecipients: email.extractedRecipients || [],
            rawMatch: email.rawMatch || null,
            isForwardedEmail: email.isForwardedEmail || false,
            isCluster: email.isCluster || false,
            isDomainForwarded: email.isDomainForwarded || false,
            isImportant: email.isImportant || false,
            isGrouped: email.isGrouped || false,
            source: 'gmail_api',
            sourceTag: 'Gmail API - Live',
            lastUpdated: new Date().toISOString()
          }));

        // Save new matches to server
        if (apiEmails.length > 0) {
          const { error: saveError } = await supabase
            .from('server_emails')
            .upsert(
              apiEmails.map(email => ({
                id: email.id,
                email_data: email
              })),
              { onConflict: 'id' }
            );

          if (saveError) {
            console.error('Error saving emails to server:', saveError);
          }
        }
      }

      // Combine results and get the most recent one
      const allEmails = [...serverMatches, ...localMatches, ...apiEmails];
      const latestEmail = allEmails
        .sort((a, b) => {
          // First sort by source priority
          const sourcePriority = {
            'gmail_api': 3,
            'server_database': 2,
            'local_storage': 1
          };
          const sourceDiff = sourcePriority[b.source] - sourcePriority[a.source];
          if (sourceDiff !== 0) return sourceDiff;
          
          // Then sort by date
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 1);

      // Save new emails to local storage
      if (apiEmails.length > 0) {
        saveEmailsToLocalStorage(apiEmails);
      }

      return latestEmail;
    } catch (error: any) {
      console.error('Error searching emails:', error);
      return [];
    }
  };

  // Function to load emails from server
  const loadEmailsFromServer = async (): Promise<Email[]> => {
    try {
      const { data, error } = await supabase
        .from('server_emails')
        .select('email_data, updated_at')
        .gt('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Only get emails from last hour

      if (error) {
        console.error('Error loading emails from server:', error);
        return [];
      }

      return data.map(item => ({
        ...item.email_data,
        source: 'server_database',
        sourceTag: 'Server Database',
        lastUpdated: item.updated_at
      }));
    } catch (error) {
      console.error('Error in loadEmailsFromServer:', error);
      return [];
    }
  };

  // Function to save emails to server with domain-based replacement
  const saveEmailsToServer = async (emails: Email[]) => {
    try {
      // Group emails by domain
      const emailsByDomain = emails.reduce((acc, email) => {
        const domain = email.to.split('@')[1];
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(email);
        return acc;
      }, {} as Record<string, Email[]>);

      // Save each domain's emails
      for (const [domain, domainEmails] of Object.entries(emailsByDomain)) {
        const { error } = await supabase
          .from('server_emails')
          .upsert(
            domainEmails.map(email => ({
              id: email.id,
              domain,
              email_data: email
            })),
            { onConflict: 'id' }
          );

        if (error) {
          console.error('Error saving emails to server:', error);
        }
      }

      // Update server storage stats
      await updateServerStorageStats();
    } catch (error) {
      console.error('Error in saveEmailsToServer:', error);
    }
  };

  // Function to update server storage stats
  const updateServerStorageStats = async () => {
    try {
      // Get total emails count
      const { count, error: countError } = await supabase
        .from('server_emails')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting server emails:', countError);
        return;
      }

      // Calculate storage size
      const { data: emails, error: dataError } = await supabase
        .from('server_emails')
        .select('email_data');

      if (dataError) {
        console.error('Error getting server emails:', dataError);
        return;
      }

      const totalSize = emails.reduce((acc, email) => {
        return acc + JSON.stringify(email.email_data).length;
      }, 0);

      const storageSize = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

      // Update stats
      const { error: updateError } = await supabase
        .from('server_storage_stats')
        .upsert({
          total_emails: count || 0,
          storage_size: storageSize,
          last_updated: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error updating server storage stats:', updateError);
        return;
      }

      // Update local state
      setServerStorageStats({
        totalEmails: count || 0,
        storageSize,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating server storage stats:', error);
    }
  };

  // Function to clear server storage
  const clearServerStorage = async () => {
    try {
      const { error } = await supabase
        .from('server_emails')
        .delete()
        .neq('id', ''); // Delete all records

      if (error) throw error;

      // Update stats
      await updateServerStorageStats();

    } catch (error) {
      console.error('Error clearing server storage:', error);
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
    }
  };

  // Update admin credentials
  const updateAdminCredentials = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Validate input
        if (!username.trim() || !password.trim()) {
          reject(new Error("Username and password cannot be empty"));
          return;
        }
        
        console.log("Updating admin credentials to:", { username });
        
        // Update admin credentials in localStorage
        const updatedAdmin: Admin = { username, password };
        localStorage.setItem("adminCredentials", JSON.stringify(updatedAdmin));
        
        resolve();
      } catch (error: any) {
        console.error("Error updating admin credentials:", error);
        reject(error);
      }
    });
  };

  const saveEmailsToLocalStorage = (emails: Email[]) => {
        try {
      const emailIndex = localStorage.getItem('emailIndex');
      const existingEmails = emailIndex ? JSON.parse(emailIndex) : [];
      
      // Create a map of existing emails by domain/recipient
      const existingEmailsMap = new Map();
      existingEmails.forEach(id => {
        const email = localStorage.getItem(`email_${id}`);
        if (email) {
          const parsedEmail = JSON.parse(email);
          const key = `${parsedEmail.from.split('@')[1]}_${parsedEmail.to}`;
          existingEmailsMap.set(key, id);
        }
      });

      // Process new emails
      const newEmails = emails.filter(email => {
        const key = `${email.from.split('@')[1]}_${email.to}`;
        const existingId = existingEmailsMap.get(key);
        
        if (existingId) {
          // Replace existing email with new one
          localStorage.removeItem(`email_${existingId}`);
          const index = existingEmails.indexOf(existingId);
          if (index > -1) {
            existingEmails.splice(index, 1);
          }
          return true; // Include in new emails to store
        }
        
        // Only include if it's a completely new email
        return !existingEmails.includes(email.id);
      });

      if (newEmails.length > 0) {
        const updatedIndex = [...existingEmails, ...newEmails.map(email => email.id)];
        localStorage.setItem('emailIndex', JSON.stringify(updatedIndex));
        
        newEmails.forEach(email => {
          localStorage.setItem(`email_${email.id}`, JSON.stringify(email));
        });

        // Update stored email count
        const storedCount = updatedIndex.length;
        localStorage.setItem('storedEmailCount', storedCount.toString());
        
        // Store last update timestamp
        localStorage.setItem('emailsLastUpdated', new Date().toISOString());
      }
        } catch (error) {
      console.error('Error saving emails:', error);
        }
      };

  const loadEmailsFromLocalStorage = (): Email[] => {
    try {
      const emailIndex = localStorage.getItem('emailIndex');
      if (!emailIndex) return [];
      
      const emailIds = JSON.parse(emailIndex);
      const loadedEmails: Email[] = [];
      
      emailIds.forEach((id: string) => {
        const email = localStorage.getItem(`email_${id}`);
        if (email) {
          try {
            const parsedEmail = JSON.parse(email);
            if (parsedEmail && parsedEmail.id) {
              loadedEmails.push(parsedEmail);
            }
          } catch (e) {
            console.error(`Error parsing email ${id}:`, e);
          }
        }
      });

      // Sort by date, newest first
      return loadedEmails.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error loading emails:', error);
      return [];
        }
      };

  // Clear emails from localStorage only when explicitly requested
  const clearEmailsFromLocalStorage = () => {
    try {
      const emailKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('email_') || 
        key === 'emailIndex' || 
        key === 'storedEmailCount' ||
        key === 'emailsLastUpdated'
      );
      
      emailKeys.forEach(key => localStorage.removeItem(key));
      setEmails([]);
    } catch (error) {
      console.error('Error clearing emails:', error);
    }
  };

  // Add auto-update functionality
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      if (autoRefreshEnabled && defaultSearchEmail) {
        try {
          const { data, error } = await supabase.functions.invoke('search-emails', {
            body: { 
              searchEmail: defaultSearchEmail,
              includeRead: true,
              includeUnread: true,
              includeForwarded: true,
              includeDomainForwarded: true,
              includeImportant: true,
              includeGrouped: true,
              includeUngrouped: true,
              minutesBack: 1, // Only get last minute of emails
              fetchUnread: true
            }
          });

          if (error) throw error;
          if (data.error) throw new Error(data.error);

          if (data.emails && Array.isArray(data.emails)) {
            const newEmails = data.emails.map((email: any) => ({
              id: email.id,
              from: email.from || "Unknown Sender",
              to: email.to || "Unknown Recipient",
              subject: email.subject || "No Subject",
              body: email.body || "No content available",
              date: email.date || new Date().toISOString(),
              isRead: email.isRead || false,
              isHidden: false,
              matchedIn: email.matchedIn || "unknown",
              extractedRecipients: email.extractedRecipients || [],
              rawMatch: email.rawMatch || null,
              isForwardedEmail: email.isForwardedEmail || false,
              isCluster: email.isCluster || false,
              isDomainForwarded: email.isDomainForwarded || false,
              isImportant: email.isImportant || false,
              isGrouped: email.isGrouped || false,
              source: 'gmail_api',
              sourceTag: 'Gmail API - Live',
              lastUpdated: new Date().toISOString()
            }));

            // Save new emails to server and local storage
            if (newEmails.length > 0) {
              await saveEmailsToServer(newEmails);
              saveEmailsToLocalStorage(newEmails);
            }
          }
        } catch (error) {
          console.error('Auto-update error:', error);
        }
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(updateInterval);
  }, [autoRefreshEnabled, defaultSearchEmail]);

  return (
    <DataContext.Provider value={{
      accessTokens,
      googleConfigs,
      emails,
      emailLimit,
      fetchEmails,
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
      clearEmailsFromLocalStorage,
      saveEmailsToLocalStorage,
      loadEmailsFromLocalStorage,
      clearServerStorage,
      serverStorageStats,
      getServerStorageStats
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
