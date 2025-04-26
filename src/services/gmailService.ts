import { Email } from "@/types";

class GmailService {
  private static instance: GmailService;
  private emails: Email[] = [];
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  private loadFromLocalStorage() {
    try {
      const storedEmails = localStorage.getItem('gmail_emails');
      const lastSync = localStorage.getItem('gmail_last_sync');
      
      if (storedEmails) {
        this.emails = JSON.parse(storedEmails);
      }
      
      if (lastSync) {
        this.lastSyncTime = parseInt(lastSync);
      }
    } catch (error) {
      console.error('Error loading emails from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('gmail_emails', JSON.stringify(this.emails));
      localStorage.setItem('gmail_last_sync', this.lastSyncTime.toString());
    } catch (error) {
      console.error('Error saving emails to localStorage:', error);
    }
  }

  public async syncEmails(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_INTERVAL) {
      return; // Skip sync if within interval
    }

    try {
      // Fetch all emails from Gmail API
      const response = await fetch('/api/gmail/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const newEmails = await response.json();
      
      // Update local storage
      this.emails = newEmails;
      this.lastSyncTime = now;
      this.saveToLocalStorage();
    } catch (error) {
      console.error('Error syncing emails:', error);
      throw error;
    }
  }

  public async getEmailById(id: string): Promise<Email | null> {
    // First check local storage
    const localEmail = this.emails.find(email => email.id === id);
    if (localEmail) {
      return localEmail;
    }

    try {
      // If not found locally, fetch from Gmail API
      const response = await fetch(`/api/gmail/messages/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch email');
      }

      const email = await response.json();
      
      // Update local storage
      this.emails.push(email);
      this.saveToLocalStorage();
      
      return email;
    } catch (error) {
      console.error('Error fetching email:', error);
      return null;
    }
  }

  public async searchEmails(query: string): Promise<Email[]> {
    // First search locally
    const localResults = this.emails.filter(email => 
      email.subject.toLowerCase().includes(query.toLowerCase()) ||
      email.from.toLowerCase().includes(query.toLowerCase()) ||
      email.to.toLowerCase().includes(query.toLowerCase())
    );

    if (localResults.length > 0) {
      return localResults;
    }

    try {
      // If not found locally, search via Gmail API
      const response = await fetch(`/api/gmail/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search emails');
      }

      const results = await response.json();
      
      // Update local storage with new results
      this.emails = [...this.emails, ...results];
      this.saveToLocalStorage();
      
      return results;
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }

  public getAllEmails(): Email[] {
    return this.emails;
  }

  public clearLocalStorage() {
    this.emails = [];
    this.lastSyncTime = 0;
    localStorage.removeItem('gmail_emails');
    localStorage.removeItem('gmail_last_sync');
  }
}

export const gmailService = GmailService.getInstance(); 