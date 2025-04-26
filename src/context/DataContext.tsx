import React, { createContext, useContext, useState, useEffect } from "react";
import { DataContextType, User, GoogleAuthConfig, Email, Admin } from "@/types";
import { v4 as uuidv4 } from "@/utils/uuid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const DataContext = createContext<DataContextType | undefined>(undefined);

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

  // Sync settings
  const [syncInterval, setSyncInterval] = useState<number>(300000); // 5 minutes default
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true);
  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout | null>(null);

  // Daily email tracking
  const [dailyEmailCount, setDailyEmailCount] = useState<number>(0);
  const [lastClearTime, setLastClearTime] = useState<Date | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    fetchAccessTokens();
    fetchGoogleConfigs();
    fetchEmails();
    loadEmailLimit();
    loadDefaultSearchEmail();
    loadAutoRefreshSettings();
    loadSyncSettings();
    loadDailyStats();
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

  // Load sync settings from localStorage
  const loadSyncSettings = () => {
    try {
      const savedInterval = localStorage.getItem("syncInterval");
      if (savedInterval) {
        const interval = parseInt(savedInterval, 10);
        if (!isNaN(interval) && interval >= 60000) { // Minimum 1 minute
          setSyncInterval(interval);
        }
      }
      
      const savedEnabled = localStorage.getItem("syncEnabled");
      if (savedEnabled !== null) {
        setSyncEnabled(savedEnabled === "true");
      }
    } catch (err) {
      console.error("Error loading sync settings:", err);
    }
  };

  // Update sync interval
  const updateSyncInterval = (interval: number) => {
    // Ensure interval is at least 5 seconds
    const validInterval = Math.max(5000, interval);
    setSyncInterval(validInterval);
    localStorage.setItem("syncInterval", validInterval.toString());
    
    // Restart sync timer with new interval
    if (syncTimer) {
      clearInterval(syncTimer);
    }
    if (syncEnabled) {
      const timer = setInterval(syncEmails, validInterval);
      setSyncTimer(timer);
    }
    
    toast({
      title: "Sync Interval Updated",
      description: `Emails will sync every ${Math.round(validInterval / 1000)} seconds.`,
    });
  };

  // Toggle sync on/off
  const toggleSync = (enabled: boolean) => {
    setSyncEnabled(enabled);
    localStorage.setItem("syncEnabled", enabled.toString());
    
    if (syncTimer) {
      clearInterval(syncTimer);
    }
    
    if (enabled) {
      const timer = setInterval(syncEmails, syncInterval);
      setSyncTimer(timer);
    }
    
    toast({
      title: enabled ? "Auto-Sync Enabled" : "Auto-Sync Disabled",
      description: enabled 
        ? `Emails will automatically sync every ${Math.round(syncInterval / 60000)} minutes.` 
        : "Automatic email syncing is now disabled.",
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

  // Load daily stats and check for auto-clear
  const loadDailyStats = () => {
    try {
      const stats = localStorage.getItem('emailStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        const today = new Date().toDateString();
        
        // Check if it's a new day
        if (parsedStats.date !== today) {
          // Clear old emails
          clearEmailsFromLocalStorage();
          // Reset stats for new day
          const newStats = {
            date: today,
            totalEmails: 0,
            lastSyncTime: null,
            lastClearTime: new Date().toISOString()
          };
          localStorage.setItem('emailStats', JSON.stringify(newStats));
          setDailyEmailCount(0);
          setLastClearTime(new Date());
        } else {
          setDailyEmailCount(parsedStats.totalEmails);
          setLastClearTime(parsedStats.lastClearTime ? new Date(parsedStats.lastClearTime) : null);
        }
      }
    } catch (err) {
      console.error("Error loading daily stats:", err);
    }
  };

  // Save emails to local storage with replacement logic
  const saveEmailsToLocalStorage = (emails: Email[]) => {
    try {
      // Get existing emails
      const existingEmails = loadEmailsFromLocalStorage();
      
      // Create a map of emails by recipient
      const emailMap = new Map<string, Email>();
      
      // First add existing emails to the map
      existingEmails.forEach(email => {
        const key = email.to.toLowerCase();
        emailMap.set(key, email);
      });
      
      // Then add/update with new emails
      emails.forEach(email => {
        const key = email.to.toLowerCase();
        emailMap.set(key, email);
      });
      
      // Convert map back to array
      const updatedEmails = Array.from(emailMap.values());
      
      // Save to localStorage
      localStorage.setItem('emails', JSON.stringify(updatedEmails));
      
      // Update daily count
      const today = new Date().toDateString();
      const stats = localStorage.getItem('emailStats');
      let newStats = {
        date: today,
        totalEmails: updatedEmails.length,
        lastSyncTime: new Date().toISOString(),
        lastClearTime: lastClearTime?.toISOString() || null
      };

      if (stats) {
        const parsedStats = JSON.parse(stats);
        if (parsedStats.date === today) {
          newStats.totalEmails = updatedEmails.length;
        }
      }

      localStorage.setItem('emailStats', JSON.stringify(newStats));
      setDailyEmailCount(newStats.totalEmails);
      
      // Update state
      setEmails(updatedEmails);
      
      toast({
        title: "Emails Updated",
        description: `Stored ${updatedEmails.length} emails in browser.`,
      });
    } catch (error) {
      console.error('Error saving emails:', error);
      toast({
        title: "Error",
        description: "Failed to save emails to browser storage.",
        variant: "destructive"
      });
    }
  };

  // Load emails from local storage
  const loadEmailsFromLocalStorage = (): Email[] => {
    try {
      const stored = localStorage.getItem('emails');
      if (!stored) return [];
      
      const emails = JSON.parse(stored);
      return emails.sort((a: Email, b: Email) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error loading emails:', error);
      return [];
    }
  };

  // Enhanced search function
  const searchEmails = async (searchQuery: string): Promise<Email[]> => {
    try {
      // First search in new emails
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

      if (error) throw error;

      let results: Email[] = [];

      // Format new emails
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

        // Save new emails to local storage (this will replace old ones)
        saveEmailsToLocalStorage(formattedEmails);
        
        // Add new emails to results
        results = [...results, ...formattedEmails];
      }

      // Then search in local storage
      const storedEmails = loadEmailsFromLocalStorage();
      const matchingStoredEmails = storedEmails.filter(email => 
        email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Combine results, removing duplicates
      const allResults = [...results, ...matchingStoredEmails];
      const uniqueResults = Array.from(new Map(allResults.map(email => [email.id, email])).values());

      // Sort by date (newest first)
      return uniqueResults.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error: any) {
      console.error('Error searching emails:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search emails",
        variant: "destructive"
      });
      return [];
    }
  };

  // Auto-fetch functionality
  useEffect(() => {
    if (autoRefreshEnabled && defaultSearchEmail) {
      const fetchEmails = async () => {
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

          if (error) throw error;

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

            // Update today's statistics
            const today = new Date().toDateString();
            const stats = localStorage.getItem('emailStats');
            let newStats = {
              date: today,
              totalEmails: formattedEmails.length,
              lastFetchTime: new Date().toISOString()
            };

            if (stats) {
              const parsedStats = JSON.parse(stats);
              if (parsedStats.date === today) {
                newStats.totalEmails = parsedStats.totalEmails + formattedEmails.length;
              }
            }

            localStorage.setItem('emailStats', JSON.stringify(newStats));

            // Save emails to localStorage
            saveEmailsToLocalStorage(formattedEmails);
            setEmails(prev => [...prev, ...formattedEmails]);
          }
        } catch (error) {
          console.error('Auto-fetch error:', error);
        }
      };

      // Clear existing timer
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
      }

      // Set new timer
      const timer = setInterval(fetchEmails, autoRefreshInterval);
      setAutoRefreshTimer(timer);

      // Initial fetch
      fetchEmails();

      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    }
  }, [autoRefreshEnabled, autoRefreshInterval, defaultSearchEmail]);

  // Sync emails with Gmail
  const syncEmails = async () => {
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

      if (error) throw error;

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

        // Save to browser storage
        saveEmailsToLocalStorage(formattedEmails);
        
        // Update state
        setEmails(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEmails = formattedEmails.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEmails];
        });

        // Update today's statistics
        const today = new Date().toDateString();
        const stats = localStorage.getItem('emailStats');
        let newStats = {
          date: today,
          totalEmails: formattedEmails.length,
          lastSyncTime: new Date().toISOString()
        };

        if (stats) {
          const parsedStats = JSON.parse(stats);
          if (parsedStats.date === today) {
            newStats.totalEmails = parsedStats.totalEmails + formattedEmails.length;
          }
        }

        localStorage.setItem('emailStats', JSON.stringify(newStats));
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  // Start sync on mount if enabled
  useEffect(() => {
    if (syncEnabled) {
      const timer = setInterval(syncEmails, syncInterval);
      setSyncTimer(timer);
      // Initial sync
      syncEmails();
    }

    return () => {
      if (syncTimer) {
        clearInterval(syncTimer);
      }
    };
  }, [syncEnabled, syncInterval]);

  // Clear emails from local storage
  const clearEmailsFromLocalStorage = () => {
    try {
      localStorage.removeItem('emails');
      setEmails([]);
      
      const today = new Date().toDateString();
      const newStats = {
        date: today,
        totalEmails: 0,
        lastSyncTime: null,
        lastClearTime: new Date().toISOString()
      };
      
      localStorage.setItem('emailStats', JSON.stringify(newStats));
      setDailyEmailCount(0);
      setLastClearTime(new Date());
      
      toast({
        title: "Storage Cleared",
        description: "All stored emails have been cleared.",
      });
    } catch (error) {
      console.error('Error clearing emails:', error);
      toast({
        title: "Error",
        description: "Failed to clear stored emails.",
        variant: "destructive"
      });
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
      syncInterval,
      syncEnabled,
      updateSyncInterval,
      toggleSync,
      clearEmailsFromLocalStorage,
      saveEmailsToLocalStorage,
      loadEmailsFromLocalStorage,
      dailyEmailCount,
      lastClearTime
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
