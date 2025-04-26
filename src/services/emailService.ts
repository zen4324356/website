import { supabase } from '@/integrations/supabase/client';
import { Email } from '@/types';

const EMAIL_STORAGE_KEY = 'server_emails';
const EMAIL_EXPIRY_DAYS = 1;
const AUTO_FETCH_INTERVAL = 5000; // 5 seconds

class EmailService {
  private static instance: EmailService;
  private fetchInterval: NodeJS.Timeout | null = null;
  private lastFetchTime: number = 0;

  private constructor() {
    this.initializeAutoFetch();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async initializeAutoFetch() {
    // Initial fetch
    await this.fetchAndStoreEmails();

    // Set up interval for auto-fetching
    this.fetchInterval = setInterval(async () => {
      await this.fetchAndStoreEmails();
    }, AUTO_FETCH_INTERVAL);

    // Set up daily cleanup
    setInterval(() => {
      this.clearExpiredEmails();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async fetchAndStoreEmails() {
    try {
      const { data, error } = await supabase.functions.invoke('search-emails', {
        body: {
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

        // Store emails in server storage
        await this.storeEmails(formattedEmails);
        this.lastFetchTime = Date.now();
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  }

  private async storeEmails(emails: Email[]) {
    try {
      const existingEmails = await this.getStoredEmails();
      const newEmails = emails.filter(newEmail => 
        !existingEmails.some(existing => existing.id === newEmail.id)
      );

      if (newEmails.length > 0) {
        const allEmails = [...existingEmails, ...newEmails];
        await supabase.storage
          .from('email_storage')
          .upload(EMAIL_STORAGE_KEY, JSON.stringify(allEmails), {
            upsert: true
          });
      }
    } catch (error) {
      console.error('Error storing emails:', error);
    }
  }

  private async getStoredEmails(): Promise<Email[]> {
    try {
      const { data, error } = await supabase.storage
        .from('email_storage')
        .download(EMAIL_STORAGE_KEY);

      if (error) throw error;

      if (data) {
        const text = await data.text();
        return JSON.parse(text) as Email[];
      }
      return [];
    } catch (error) {
      console.error('Error getting stored emails:', error);
      return [];
    }
  }

  private async clearExpiredEmails() {
    try {
      const emails = await this.getStoredEmails();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const validEmails = emails.filter(email => 
        new Date(email.date).getTime() > oneDayAgo
      );

      await supabase.storage
        .from('email_storage')
        .upload(EMAIL_STORAGE_KEY, JSON.stringify(validEmails), {
          upsert: true
        });
    } catch (error) {
      console.error('Error clearing expired emails:', error);
    }
  }

  public async searchEmails(query: string): Promise<Email[]> {
    try {
      const emails = await this.getStoredEmails();
      
      // Search in email bodies and other fields
      return emails.filter(email => {
        const searchText = query.toLowerCase();
        return (
          email.body.toLowerCase().includes(searchText) ||
          email.subject.toLowerCase().includes(searchText) ||
          email.from.toLowerCase().includes(searchText) ||
          email.to.toLowerCase().includes(searchText) ||
          email.extractedRecipients.some(recipient => 
            recipient.toLowerCase().includes(searchText)
          )
        );
      });
    } catch (error) {
      console.error('Error searching emails:', error);
      return [];
    }
  }

  public stopAutoFetch() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
  }
}

export const emailService = EmailService.getInstance(); 