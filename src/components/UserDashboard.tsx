import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Email } from "@/types";
import { useNavigate } from "react-router-dom";
import { Search, Eye, EyeOff, LogIn, Filter, Database, RefreshCw, Mail, Calendar, AlertTriangle, CheckCircle, User, Clock, Download, CheckSquare, Square, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import EmailDetailSidebar from "./EmailDetailSidebar";
import "./userDashboardAnimations.css"; // Import CSS for animations
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { 
    emails, 
    toggleEmailVisibility, 
    emailLimit, 
    defaultSearchEmail, 
    autoRefreshInterval,
    autoRefreshEnabled,
    toggleAutoRefresh
  } = useData();
  const navigate = useNavigate();

  const [searchEmail, setSearchEmail] = useState("");
  const [filterToEmail, setFilterToEmail] = useState("");
  const [originalSearchResults, setOriginalSearchResults] = useState<Email[]>([]);
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<{
    toResults: number;
    fromResults: number;
    uniqueResults: number;
  } | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storedEmailCount, setStoredEmailCount] = useState(0);
  const [fetchProgress, setFetchProgress] = useState({ status: '', total: 0, current: 0 });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const emailsPerPage = 25;

  useEffect(() => {
    if (!user) {
      navigate("/user-login");
    }
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    
    if (user && mounted) {
      toast({
        title: "Welcome to Unknown Household Access",
        description: "You have successfully logged in to your dashboard.",
        className: "fixed top-4 left-4 z-50"
      });

      // Initial search when component mounts
      handleSearch(new Event('init') as any);
    }
    
    return () => { mounted = false; };
  }, []);

  // Set up auto-refresh functionality
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (autoRefreshEnabled) {
      intervalId = window.setInterval(() => {
        if (!isLoading) {
          console.log("Auto-refreshing emails...");
          handleSearch(new Event('autorefresh') as any);
        }
      }, autoRefreshInterval);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval, isLoading]);

  // Function to save emails to localStorage
  const saveEmailsToLocalStorage = (emails: Email[]) => {
    try {
      // Save emails in chunks to avoid localStorage size limitations
      const CHUNK_SIZE = 100; // Increased from 50 to 100
      let totalStored = 0;
      
      // First get index to append to it if it exists
      const existingEmailIndex = localStorage.getItem('emailIndex');
      let existingEmails: string[] = [];
      if (existingEmailIndex) {
        try {
          existingEmails = JSON.parse(existingEmailIndex);
          console.log(`Found ${existingEmails.length} existing emails in localStorage`);
        } catch (e) {
          console.error("Error parsing existing email index:", e);
          // If error parsing, reset the index to avoid further issues
          localStorage.removeItem('emailIndex');
          existingEmails = [];
        }
      }
      
      // Create a master index including both existing and new emails
      // First filter out duplicates - only add new emails that aren't already stored
      const newEmailIds = emails.map(email => email.id);
      const uniqueNewEmailIds = newEmailIds.filter(id => !existingEmails.includes(id));
      
      // Combine existing and new email IDs
      const allEmailIds = [...existingEmails, ...uniqueNewEmailIds];
      
      // Update the master index
      localStorage.setItem('emailIndex', JSON.stringify(allEmailIds));
      console.log(`Updated email index with ${uniqueNewEmailIds.length} new emails, total ${allEmailIds.length}`);
      
      // Store each new email individually with its ID as the key
      emails.forEach((email) => {
        // Skip if already stored
        if (existingEmails.includes(email.id)) {
          return;
        }
        
        const emailKey = `email_${email.id}`;
        
        // Create a simplified version to save space
        const storageEmail = {
          id: email.id,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body.substring(0, 15000), // Store larger portion of body (15KB)
          date: email.date,
          isRead: email.isRead,
          isHidden: email.isHidden,
          matchedIn: email.matchedIn,
          extractedRecipients: email.extractedRecipients || [],
          rawMatch: email.rawMatch,
          isForwardedEmail: email.isForwardedEmail || false,
          isCluster: email.isCluster || false
        };
        
        try {
          localStorage.setItem(emailKey, JSON.stringify(storageEmail));
          totalStored++;
        } catch (error) {
          console.error(`Error storing email ${email.id} in localStorage:`, error);
          
          // If we hit storage limits, try storing a more compact version
          try {
            const compactEmail = {
              id: email.id,
              from: email.from,
              to: email.to,
              subject: email.subject,
              body: email.body.substring(0, 5000), // Store smaller portion
              date: email.date,
              extractedRecipients: email.extractedRecipients || [],
              isForwardedEmail: email.isForwardedEmail || false, 
              isCluster: email.isCluster || false,
              matchedIn: email.matchedIn
            };
            localStorage.setItem(emailKey, JSON.stringify(compactEmail));
            totalStored++;
          } catch (compactError) {
            console.error(`Error storing compact version of email ${email.id}:`, compactError);
          }
        }
      });
      
      // Add new emails to existing count
      const newTotalStored = existingEmails.length + totalStored;
      setStoredEmailCount(newTotalStored);
      console.log(`Stored ${totalStored} new emails in local storage, total: ${newTotalStored}`);
      
      // Store timestamp of last update
      localStorage.setItem('emailsLastUpdated', new Date().toISOString());
      
      return newTotalStored;
    } catch (error) {
      console.error('Error saving emails to localStorage:', error);
      return 0;
    }
  };
  
  // Function to clear all emails from localStorage
  const clearEmailsFromLocalStorage = () => {
    try {
      // Get the index of all stored emails
      const emailIndex = localStorage.getItem('emailIndex');
      if (emailIndex) {
        const emailIds = JSON.parse(emailIndex);
        
        // Remove each email individually
        emailIds.forEach(id => {
          localStorage.removeItem(`email_${id}`);
        });
        
        // Remove the index and timestamp
        localStorage.removeItem('emailIndex');
        localStorage.removeItem('emailsLastUpdated');
        
        setStoredEmailCount(0);
        setOriginalSearchResults([]);
        setSearchResults([]);
        
        console.log(`Cleared ${emailIds.length} emails from local storage`);
        
        toast({
          title: "Storage Cleared",
          description: `Successfully cleared ${emailIds.length} stored emails from local storage.`,
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing emails from localStorage:', error);
      return false;
    }
  };
  
  // Function to load emails from localStorage  
  const loadEmailsFromLocalStorage = () => {
    try {
      const emailIndex = localStorage.getItem('emailIndex');
      if (!emailIndex) return [];
      
      const emailIds = JSON.parse(emailIndex);
      const loadedEmails: Email[] = [];
      const failedEmails: string[] = [];
      
      emailIds.forEach(id => {
        const emailKey = `email_${id}`;
        const storedEmail = localStorage.getItem(emailKey);
        
        if (storedEmail) {
          try {
            const parsedEmail = JSON.parse(storedEmail);
            // Make sure all required fields exist to prevent errors when displaying
            if (parsedEmail && parsedEmail.id && parsedEmail.subject) {
              // Ensure all Email interface properties are defined with fallbacks
              const completeEmail: Email = {
                id: parsedEmail.id,
                from: parsedEmail.from || "Unknown Sender",
                to: parsedEmail.to || "Unknown Recipient",
                subject: parsedEmail.subject || "No Subject",
                body: parsedEmail.body || "No content available",
                date: parsedEmail.date || new Date().toISOString(),
                isRead: parsedEmail.isRead || false,
                isHidden: parsedEmail.isHidden || false,
                matchedIn: parsedEmail.matchedIn || "unknown",
                extractedRecipients: parsedEmail.extractedRecipients || [],
                rawMatch: parsedEmail.rawMatch || null,
                isForwardedEmail: parsedEmail.isForwardedEmail || false,
                isCluster: parsedEmail.isCluster || false
              };
              loadedEmails.push(completeEmail);
            } else {
              failedEmails.push(id);
              // Remove corrupt email data
              localStorage.removeItem(emailKey);
            }
          } catch (e) {
            console.error(`Error parsing email ${id}:`, e);
            failedEmails.push(id);
            // Remove corrupt email data
            localStorage.removeItem(emailKey);
          }
        } else {
          failedEmails.push(id);
        }
      });
      
      // Update the index to remove failed emails
      if (failedEmails.length > 0) {
        const validEmailIds = emailIds.filter(id => !failedEmails.includes(id));
        localStorage.setItem('emailIndex', JSON.stringify(validEmailIds));
        console.log(`Removed ${failedEmails.length} corrupted emails from index`);
      }
      
      console.log(`Loaded ${loadedEmails.length} emails from local storage`);
      return loadedEmails;
    } catch (error) {
      console.error('Error loading emails from localStorage:', error);
      return [];
    }
  };
  
  // Load stored emails on component mount
  useEffect(() => {
    const storedEmails = loadEmailsFromLocalStorage();
    
    if (storedEmails.length > 0) {
      setOriginalSearchResults(storedEmails);
      setStoredEmailCount(storedEmails.length);
      
      // Sort by date, newest first
      const sortedEmails = storedEmails.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setOriginalSearchResults(sortedEmails);
      
      const lastUpdated = localStorage.getItem('emailsLastUpdated');
      const updatedTime = lastUpdated ? new Date(lastUpdated).toLocaleString() : 'unknown time';
      
      toast({
        title: "Emails Loaded",
        description: `Loaded ${storedEmails.length} emails from local storage (last updated: ${updatedTime}). Use the filter to search among them.`,
      });
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilterToEmail("");
    
    setIsLoading(true);
    setError("");
    setSearchResults([]);
    setSearchMetadata(null);
    setFetchProgress({ status: 'Starting email search...', total: 0, current: 0 });

    try {
      console.log(`Searching using default email: ${defaultSearchEmail}`);
      
      // Show a message to the user that we're scanning for forwarded emails
      if (!(e.type === 'autorefresh')) {
        toast({
          title: "Scanning emails",
          description: "Searching through email clusters and forwarded content. This may take longer...",
        });
      }
      
      // Clear all browser data before starting new search
      try {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear all cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
        
        // Clear indexedDB
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
        
        // Clear cache storage
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        console.log("All browser data cleared successfully");
      } catch (clearError) {
        console.error("Error clearing browser data:", clearError);
      }
      
      // Now fetch new emails
      const { data, error } = await supabase.functions.invoke('search-emails', {
        body: { searchEmail: defaultSearchEmail, includeRead: true, daysBack: 5 }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to search emails");
      }
      
      if (data.error) {
        if (data.error.includes("token expired") || data.error.includes("reauthorize")) {
          toast({
            title: "Authorization needed",
            description: "Please contact an admin to refresh the Google authorization.",
            variant: "destructive"
          });
          throw new Error(data.error);
        } else {
          throw new Error(data.error);
        }
      }
      
      if (data.emails && Array.isArray(data.emails)) {
        console.log(`Found ${data.emails.length} emails in search results`);
        
        if (data.searchOrigin) {
          setSearchMetadata(data.searchOrigin);
        }
        
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
          isCluster: email.isCluster || false
        }));
        
        // Apply admin-set email limit for display
        const limitedEmails = emailLimit > 0 
          ? formattedEmails.slice(0, emailLimit) 
          : formattedEmails;
        
        setOriginalSearchResults(limitedEmails);
        
        // Final progress update
        setFetchProgress({ 
          status: 'Email search complete', 
          total: limitedEmails.length, 
          current: limitedEmails.length 
        });
        
        const forwardedCount = formattedEmails.filter(email => 
          email.matchedIn === 'forwarded' || 
          email.isForwardedEmail ||
          (email.extractedRecipients && email.extractedRecipients.length > 0)
        ).length;
        
        const clusterCount = formattedEmails.filter(email => 
          email.isCluster || 
          (email.extractedRecipients && email.extractedRecipients.length > 20)
        ).length;
        
        if (!(e.type === 'autorefresh')) {
          toast({
            title: "Emails retrieved",
            description: `Found ${formattedEmails.length} new emails. Showing ${limitedEmails.length} emails.`,
          });
        } else if (formattedEmails.length > 0) {
          // Only show toast if there are new emails during auto-refresh
          toast({
            title: "New emails found",
            description: `Auto-refresh found ${formattedEmails.length} new emails.`,
          });
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search emails. Please try again.");
      if (!(e.type === 'autorefresh')) {
        toast({
          title: "Search failed",
          description: err.message || "Failed to search emails. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to merge email arrays removing duplicates
  const mergeEmails = (existingEmails: Email[], newEmails: Email[]): Email[] => {
    const mergedEmails: Email[] = [...existingEmails];
    const existingIds = new Set(existingEmails.map(email => email.id));
    
    newEmails.forEach(email => {
      if (!existingIds.has(email.id)) {
        mergedEmails.push(email);
      }
    });
    
    // Sort by date, newest first
    return mergedEmails.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const handleToggleVisibility = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleEmailVisibility(id);
    setSearchResults(prev => 
      prev.map(email => 
        email.id === id ? { ...email, isHidden: !email.isHidden } : email
      )
    );
    
    const email = searchResults.find(e => e.id === id) || emails.find(e => e.id === id);
    const isCurrentlyHidden = email ? email.isHidden : false;
    
    toast({
      title: isCurrentlyHidden ? "Email visible" : "Email hidden",
      description: isCurrentlyHidden 
        ? "Email is now visible and can be viewed normally." 
        : "Email has been hidden from view.",
    });
  };

  const handleEmailClick = (email: Email) => {
    // Make sure the email has required properties before showing it
    if (!email || !email.subject) {
      toast({
        title: "Error",
        description: "This email cannot be displayed. It may be corrupted or incomplete.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a complete email object for the sidebar
    const completeEmail: Email = {
      id: email.id,
      from: email.from || "No sender information",
      to: email.to || "No recipient information",
      subject: email.subject || "No subject",
      body: email.body || "No content available",
      date: email.date || new Date().toISOString(),
      isRead: email.isRead || false,
      isHidden: email.isHidden || false,
      matchedIn: email.matchedIn || "",
      extractedRecipients: email.extractedRecipients || [],
      rawMatch: email.rawMatch || "",
      isForwardedEmail: email.isForwardedEmail || false,
      isCluster: email.isCluster || false
    };
    
    setSelectedEmail(completeEmail);
    setIsSidebarOpen(true);
  };

  const handleToEmailFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filterValue = e.target.value.toLowerCase();
    setFilterToEmail(filterValue);
    
    if (!filterValue.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Build patterns to search for in both direct and forwarded content
    // For "Unknown130@gufvs.pro" pattern, make it more flexible
    const isUnknownPattern = /^unknown\d+(@.*)?$/i.test(filterValue);
    const isComplexEmail = filterValue.includes('@');
    
    let patterns = [new RegExp(filterValue, 'i')];
    let emailDomain = '';
    
    if (isUnknownPattern) {
      // For partial "Unknown" patterns, create more flexible matching
      patterns = [
        new RegExp(`unknown\\d+@`, 'i'),
        new RegExp(filterValue.replace(/unknown(\d+)(@.*)?/i, 'unknown$1'), 'i')
      ];
      // Extract domain if it exists in the pattern
      const domainMatch = filterValue.match(/@([\w.-]+\.\w+)/);
      if (domainMatch && domainMatch[1]) {
        emailDomain = domainMatch[1];
      }
    } else if (isComplexEmail) {
      // For email addresses, create patterns to match domain and username separately
      const [username, domain] = filterValue.split('@');
      emailDomain = domain || '';
      if (domain) {
        patterns.push(new RegExp(`@${domain}`, 'i')); // Match domain
        // Also match specific subdomains like gufvs.pro
        if (domain === 'gufvs.pro') {
          patterns.push(/gufvs\.pro/i);
        }
      }
      if (username) {
        patterns.push(new RegExp(`${username}@`, 'i')); // Match username
      }
    }
    
    // Show searching feedback to the user for larger datasets
    toast({
      title: "Searching...",
      description: "Searching through all forwarded content and email clusters...",
    });
    
    // Enhanced filtering that considers both direct recipients and forwarded recipients
    const filteredEmails = originalSearchResults.filter(email => {
      // First check if the email has any content at all
      if (!email || !email.subject) {
        return false;
      }
      
      // Check the To field
      if (email.to && email.to.toLowerCase().includes(filterValue)) {
        return true;
      }
      
      // If searching for netflix.com, also check the From field
      if (filterValue.includes('netflix') && email.from && email.from.toLowerCase().includes('netflix')) {
        return true;
      }
      
      // Check if this email has extractedRecipients (from forwarded content)
      if (email.extractedRecipients && Array.isArray(email.extractedRecipients) && email.extractedRecipients.length > 0) {
        return email.extractedRecipients.some(recipient => {
          // For each recipient check against our patterns
          return patterns.some(pattern => pattern.test(recipient.toLowerCase()));
        });
      }
      
      // Check for raw match as well
      if (email.rawMatch && patterns.some(pattern => pattern.test(email.rawMatch.toLowerCase()))) {
        return true;
      }
      
      // Check email body for more complex cases
      if (email.body && (isUnknownPattern || isComplexEmail)) {
        const bodyLower = email.body.toLowerCase();
        // For Unknown130@gufvs.pro pattern or similar domains, do more aggressive searching
        if (isUnknownPattern || (emailDomain && emailDomain.includes('gufvs.pro'))) {
          return patterns.some(pattern => pattern.test(bodyLower)) || 
                 bodyLower.includes('gufvs.pro') || 
                 bodyLower.includes('unknown') ||
                 bodyLower.includes(filterValue);
        }
        return patterns.some(pattern => pattern.test(bodyLower));
      }
      
      return false;
    });
    
    // Sort by date, newest first
    const sortedResults = filteredEmails.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    });
    
    // No limit on results - show all matching emails
    setSearchResults(sortedResults);
    setCurrentPage(1);
    
    // Show a more informative message about what was matched
    const resultDescription = sortedResults.length === 0 
      ? `No emails found matching "${filterValue}"`
      : `Found ${sortedResults.length} emails containing "${filterValue}"`;
    
    const containerType = sortedResults.length > 0 && sortedResults.some(email => email.matchedIn === 'forwarded' || email.extractedRecipients?.length > 0)
      ? ' (including forwarded content)'
      : '';
      
    toast({
      title: "Filter Applied",
      description: resultDescription + containerType,
    });
  };

  const displayEmails = searchResults;
  const totalPages = Math.max(1, Math.ceil(displayEmails.length / emailsPerPage));
  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = displayEmails.slice(indexOfFirstEmail, indexOfLastEmail);

  const pageNumbers = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handleSelectEmail = (emailId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmails(prev => [...prev, emailId]);
    } else {
      setSelectedEmails(prev => prev.filter(id => id !== emailId));
    }
  };

  const handleSelectAll = () => {
    const newSelectAllState = !selectAllChecked;
    setSelectAllChecked(newSelectAllState);
    
    if (newSelectAllState) {
      // Select all emails on the current page
      const currentEmailIds = currentEmails.map(email => email.id);
      setSelectedEmails(currentEmailIds);
    } else {
      // Deselect all emails
      setSelectedEmails([]);
    }
  };

  const createEmailContent = (email: Email) => {
    let content = '';
    
    // Add headers
    content += 'From: ' + email.from + '\n';
    content += 'To: ' + email.to + '\n';
    content += 'Subject: ' + email.subject + '\n';
    content += 'Date: ' + email.date + '\n\n';
    
    // Add main body
    content += email.body;
    
    // Add forwarded content if available
    if (email.forwardedContent && email.forwardedContent.length > 0) {
      content += '\n\n---------- FORWARDED CONTENT ----------\n\n';
      
      email.forwardedContent.forEach((fwd, index) => {
        content += '--- Forwarded Message ' + (index + 1) + ' ---\n';
        if (fwd.from) content += 'From: ' + fwd.from + '\n';
        if (fwd.to) content += 'To: ' + fwd.to + '\n';
        if (fwd.subject) content += 'Subject: ' + fwd.subject + '\n';
        if (fwd.date) content += 'Date: ' + fwd.date + '\n';
        if (fwd.body) content += '\n' + fwd.body + '\n\n';
      });
    }
    
    return content;
  };

  // Add downloadAsSeparateFiles function
  const downloadAsSeparateFiles = (emailsToDownload: Email[]) => {
    emailsToDownload.forEach((email, index) => {
      // Create the email content as text
      const content = createEmailContent(email);
      
      // Create a blob and download link
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Clean up the filename - remove special characters and limit length
      const cleanSubject = email.subject.substring(0, 30).replace(/[^\w\s]/gi, '_');
      const dateStr = new Date(email.date).toISOString().split('T')[0];
      a.download = `${dateStr}_${cleanSubject}.txt`;
      a.href = url;
      a.style.display = 'none';
      
      // Append to body, click to download, then clean up
      document.body.appendChild(a);
      
      // Slight delay between downloads to prevent browser issues
      setTimeout(() => {
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show completion message after the last download
        if (index === emailsToDownload.length - 1) {
          toast({
            title: "Download completed",
            description: `Successfully downloaded ${emailsToDownload.length} emails`,
          });
        }
      }, index * 300); // 300ms delay between downloads
    });
  };

  // Add downloadAsCombinedFile function
  const downloadAsCombinedFile = (emailsToDownload: Email[]) => {
    // Create a combined file with all email content
    let combinedContent = '';
    
    emailsToDownload.forEach((email, index) => {
      combinedContent += '='.repeat(80) + '\n';
      combinedContent += `EMAIL ${index + 1}: ${email.subject}\n`;
      combinedContent += '='.repeat(80) + '\n\n';
      combinedContent += createEmailContent(email);
      combinedContent += '\n\n\n';
    });
    
    // Create a blob and download link
    const blob = new Blob([combinedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Use the current date for the filename
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `netflix_emails_${dateStr}.txt`;
    a.href = url;
    a.style.display = 'none';
    
    // Append to body, click to download, then clean up
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Download completed",
      description: `Successfully downloaded ${emailsToDownload.length} emails as a single file`,
    });
  };

  // Update the handleBulkDownload function to offer download options
  const handleBulkDownload = (type: 'separate' | 'combined') => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select at least one email to download",
      });
      return;
    }
    
    try {
      // Show progress toast
      toast({
        title: "Preparing download",
        description: `Preparing ${selectedEmails.length} emails for download. Please wait...`,
      });
      
      // Get the selected emails from the search results
      const emailsToDownload = searchResults.filter(email => 
        selectedEmails.includes(email.id)
      );
      
      if (type === 'separate') {
        downloadAsSeparateFiles(emailsToDownload);
      } else {
        downloadAsCombinedFile(emailsToDownload);
      }
      
      // Clear selection after download
      setSelectedEmails([]);
      setSelectAllChecked(false);
    } catch (error) {
      console.error('Error downloading emails:', error);
      toast({
        title: "Download failed",
        description: "Failed to download emails. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black text-netflix-white">
      <header className="bg-netflix-gray py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-netflix-red">Unknown Household Access</h1>
        <button 
          onClick={logout}
          className="flex items-center text-netflix-white hover:text-netflix-red transition-colors"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Logout
        </button>
      </header>

      <main className="container mx-auto px-4 py-8 netflix-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="bg-netflix-darkgray p-6 rounded-lg mb-8 netflix-scale-in">
            <div className="flex gap-2 mb-4 justify-between items-center flex-wrap">
              <div className="flex gap-2">
                <Button 
                  onClick={handleSearch}
                  className="netflix-button flex items-center"
                  disabled={isLoading}
                >
                  <Search className="mr-2 h-5 w-5" />
                  {isLoading ? "Searching..." : "Search Latest Emails"}
                </Button>
                
                {storedEmailCount > 0 && (
                  <div className="flex items-center">
                    <div className="text-sm text-gray-300 flex items-center gap-1 ml-3">
                      <Database className="h-4 w-4 text-netflix-red" />
                      <span>{storedEmailCount} emails stored locally</span>
                    </div>
                  </div>
                )}
              </div>

              {originalSearchResults.length > 0 && (
                <div className="flex-1 max-w-md ml-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-netflix-red" />
                    <input
                      type="text"
                      value={filterToEmail}
                      onChange={handleToEmailFilter}
                      placeholder="Enter recipient (TO: email address) to see results"
                      className="netflix-input flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {isLoading && fetchProgress.status && (
              <div className="mt-4 bg-netflix-darkgray p-4 rounded-md border border-netflix-red border-opacity-40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-netflix-white font-medium">{fetchProgress.status}</span>
                  <span className="text-netflix-white text-sm">
                    {fetchProgress.current > 0 && `${fetchProgress.current} emails`}
                  </span>
                </div>
                {fetchProgress.total > 0 && (
                  <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div 
                      className="bg-netflix-red h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (fetchProgress.current / fetchProgress.total) * 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  We're searching through your entire inbox and processing all forwarded emails.
                  This may take a few minutes for larger inboxes.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-netflix-red bg-opacity-30 text-netflix-white p-3 rounded mb-4">
                {error}
              </div>
            )}
          </div>

          {filterToEmail.trim() && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {displayEmails.length ? 
                    `Showing ${indexOfFirstEmail + 1}-${Math.min(indexOfLastEmail, displayEmails.length)} of ${displayEmails.length} emails` 
                    : "No emails found"}
                </h2>
                
                <div className="flex gap-2 items-center">
                  {selectedEmails.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="flex items-center bg-green-700 hover:bg-green-800 mr-4">
                          <Download className="h-4 w-4 mr-2" />
                          Download {selectedEmails.length} {selectedEmails.length === 1 ? 'Email' : 'Emails'}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleBulkDownload('separate')}>
                          As Separate Files
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkDownload('combined')}>
                          As Combined File
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <Button
                    onClick={handleSelectAll}
                    variant="outline"
                    className="mr-4 flex items-center text-sm"
                  >
                    {selectAllChecked ? 
                      <CheckSquare className="h-4 w-4 mr-1" /> : 
                      <Square className="h-4 w-4 mr-1" />
                    }
                    {selectAllChecked ? "Deselect All" : "Select All"}
                  </Button>
                
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-4 py-2 bg-netflix-gray rounded hover:bg-netflix-lightgray transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center px-4 py-2 bg-netflix-gray rounded hover:bg-netflix-lightgray transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              
              {currentEmails.map((email, index) => (
                <div 
                  key={email.id}
                  className={`bg-netflix-gray p-4 rounded-lg hover:bg-netflix-lightgray transition-all netflix-slide-up netflix-card-shadow relative 
                    ${email.isHidden ? 'blur-[6px] hover:blur-[6px]' : ''}
                    ${email.isForwardedEmail ? 'border-l-4 border-blue-500' : ''}
                    ${email.isCluster ? 'border-l-4 border-purple-500' : ''}
                    transform hover:scale-[1.01] hover:shadow-lg email-card
                  `}
                  style={{ 
                    animationDelay: `${index * 0.08}s`,
                    transitionDuration: '0.3s'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold flex items-center gap-2">
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isSelected = selectedEmails.includes(email.id);
                          handleSelectEmail(email.id, !isSelected);
                        }}
                      >
                        {selectedEmails.includes(email.id) ? 
                          <CheckSquare className="h-5 w-5 text-green-500" /> : 
                          <Square className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                      
                      <div 
                        className="flex items-center gap-2 cursor-pointer" 
                        onClick={() => !email.isHidden && handleEmailClick(email)}
                      >
                        <Mail className={`h-4 w-4 ${email.isRead ? 'text-gray-400' : 'text-netflix-red'}`} />
                        <span className={`${!email.isRead ? 'text-white font-bold email-unread' : ''}`}>{email.subject}</span>
                        
                        {email.isForwardedEmail && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded badge-new">Forwarded</span>
                        )}
                        
                        {email.isCluster && (
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded badge-new">Cluster</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={(e) => handleToggleVisibility(email.id, e)}
                      variant="outline"
                      size="sm"
                      className={`absolute top-2 right-2 z-10 ${
                        email.isHidden 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-500 blur-none'
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                      }`}
                      title={email.isHidden ? "Show email" : "Hide email"}
                    >
                      {email.isHidden ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                      <span className="ml-2">{email.isHidden ? "Unhide" : "Hide"}</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium">From:</span> 
                    <span className="text-gray-200">{email.from}</span>
                  </div>
                  
                  <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium">To:</span> 
                    <span className="text-gray-200">{email.to}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(email.date).toLocaleString()}
                    </div>
                    
                    {email.extractedRecipients && email.extractedRecipients.length > 0 && (
                      <div className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {email.extractedRecipients.length} recipients
                      </div>
                    )}
                  </div>
                  
                  {email.matchedIn === 'forwarded' && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-blue-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Matched in forwarded content
                    </div>
                  )}
                </div>
              ))}

              {displayEmails.length > emailsPerPage && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {startPage > 1 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                          </PaginationItem>
                          {startPage > 2 && <PaginationEllipsis />}
                        </>
                      )}

                      {pageNumbers.map(number => (
                        <PaginationItem key={number}>
                          <PaginationLink
                            isActive={currentPage === number}
                            onClick={() => setCurrentPage(number)}
                            className="cursor-pointer"
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      {endPage < totalPages && (
                        <>
                          {endPage < totalPages - 1 && <PaginationEllipsis />}
                          <PaginationItem>
                            <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <EmailDetailSidebar
        email={selectedEmail}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedEmail(null);
        }}
      />
    </div>
  );
};

export default UserDashboard;
