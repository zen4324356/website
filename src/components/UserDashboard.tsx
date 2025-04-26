import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Email } from "@/types";
import { useNavigate } from "react-router-dom";
import { LogIn, Filter, Database, RefreshCw, Mail, Calendar, AlertTriangle, CheckCircle, User, Clock, ChevronDown, Search, Eye, EyeOff } from "lucide-react";
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
import { emailService } from '@/services/emailService';

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
  const emailsPerPage = 25;

  useEffect(() => {
    if (!user) {
      navigate("/user-login");
    } else {
      // Initial search when component mounts
      handleSearch(new Event('init') as any);
    }
    
    return () => {
      // Cleanup when component unmounts
      emailService.stopAutoFetch();
    };
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    
    if (user && mounted) {
      toast({
        title: "Welcome to Unknown Household Access",
        description: "You have successfully logged in to your dashboard.",
        className: "fixed top-4 left-4 z-50"
      });
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
      
      if (!(e.type === 'autorefresh')) {
        toast({
          title: "Scanning emails",
          description: "Searching through all emails from the last 30 minutes...",
        });
      }
      
      // Use the emailService to search emails
      const searchResults = await emailService.searchEmails(defaultSearchEmail);
      
      if (searchResults.length > 0) {
        // Sort emails with unread and important ones first
        const sortedEmails = searchResults.sort((a, b) => {
          // First sort by importance
          if (a.isImportant !== b.isImportant) {
            return a.isImportant ? -1 : 1;
          }
          // Then sort by read status (unread first)
          if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1;
          }
          // Then sort by date (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        // Apply admin-set email limit for display
        const limitedEmails = emailLimit > 0 
          ? sortedEmails.slice(0, emailLimit) 
          : sortedEmails;
        
        setOriginalSearchResults(limitedEmails);
        
        // Final progress update
        setFetchProgress({ 
          status: 'Email search complete', 
          total: limitedEmails.length, 
          current: limitedEmails.length 
        });
        
        const unreadCount = limitedEmails.filter(email => !email.isRead).length;
        const forwardedCount = limitedEmails.filter(email => 
          email.matchedIn === 'forwarded' || 
          email.isForwardedEmail ||
          email.isDomainForwarded
        ).length;
        
        const importantCount = limitedEmails.filter(email => email.isImportant).length;
        const groupedCount = limitedEmails.filter(email => email.isGrouped).length;
        
        if (!(e.type === 'autorefresh')) {
          toast({
            title: "Emails retrieved",
            description: `Found ${searchResults.length} emails (${unreadCount} unread, ${forwardedCount} forwarded, ${importantCount} important, ${groupedCount} grouped). Showing ${limitedEmails.length} emails.`,
          });
        } else if (searchResults.length > 0) {
          toast({
            title: "New emails found",
            description: `Auto-refresh found ${searchResults.length} new emails (${unreadCount} unread, ${forwardedCount} forwarded, ${importantCount} important, ${groupedCount} grouped).`,
          });
        }
      } else {
        toast({
          title: "No emails found",
          description: "No emails matching your search criteria were found.",
        });
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

  const handleToEmailFilter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filterValue = e.target.value.toLowerCase().trim();
    setFilterToEmail(filterValue);
    
    if (!filterValue) {
      setSearchResults([]);
      return;
    }
    
    // Show searching feedback to the user
    toast({
      title: "Searching...",
      description: "Searching through all emails for matches...",
    });
    
    try {
      // Use the emailService to search emails
      const searchResults = await emailService.searchEmails(filterValue);
      
      // Sort by date, newest first
      const sortedResults = searchResults.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setSearchResults(sortedResults);
      setCurrentPage(1);
      
      // Show a more informative message about what was matched
      const resultDescription = sortedResults.length === 0 
        ? `No matches found for "${filterValue}"`
        : `Found ${sortedResults.length} matches for "${filterValue}"`;
      
      const containerType = sortedResults.length > 0 && sortedResults.some(email => 
        email.matchedIn === 'forwarded' || 
        email.extractedRecipients?.length > 0
      ) ? ' (including forwarded content)' : '';
        
      toast({
        title: "Filter Applied",
        description: resultDescription + containerType,
      });
    } catch (error) {
      console.error('Error filtering emails:', error);
      toast({
        title: "Error",
        description: "Failed to filter emails. Please try again.",
        variant: "destructive"
      });
    }
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
