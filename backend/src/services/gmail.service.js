const { google } = require('googleapis');
const { supabase } = require('../config/supabase');

// Get Gmail client
const getGmailClient = async () => {
  try {
    // Get OAuth credentials from database
    const { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('client_id, client_secret, refresh_token')
      .limit(1)
      .single();
    
    if (error || !data || !data.refresh_token) {
      console.error('Gmail OAuth credentials not found or incomplete');
      return null;
    }
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      data.client_id,
      data.client_secret
    );
    
    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: data.refresh_token
    });
    
    // Create Gmail client
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });
    
    return gmail;
  } catch (error) {
    console.error('Error creating Gmail client:', error);
    return null;
  }
};

// Parse email message
const parseMessage = (message) => {
  try {
    const payload = message.payload;
    const headers = payload.headers;
    
    // Get email headers
    const subject = headers.find(header => header.name === 'Subject')?.value || '';
    const from = headers.find(header => header.name === 'From')?.value || '';
    const to = headers.find(header => header.name === 'To')?.value || '';
    const date = headers.find(header => header.name === 'Date')?.value || '';
    
    // Extract recipient email from To header
    const recipientEmail = extractEmail(to);
    
    // Get email body
    let body = '';
    
    if (payload.parts) {
      // Multipart email
      const textPart = payload.parts.find(part => 
        part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      
      if (textPart) {
        const bodyData = textPart.body.data;
        if (bodyData) {
          body = Buffer.from(bodyData, 'base64').toString('utf-8');
        }
      }
    } else if (payload.body && payload.body.data) {
      // Simple email
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    
    return {
      id: message.id,
      threadId: message.threadId,
      recipient_email: recipientEmail,
      subject,
      from,
      body,
      date_received: new Date(date).toISOString(),
      raw_data: message
    };
  } catch (error) {
    console.error('Error parsing email message:', error);
    return null;
  }
};

// Extract email address from string
const extractEmail = (str) => {
  if (!str) return '';
  
  // Try to match email pattern within angle brackets (e.g., "Name <email@example.com>")
  const match = str.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  
  // If no angle brackets, try to find email directly
  const emailMatch = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    return emailMatch[0].toLowerCase();
  }
  
  return str.toLowerCase();
};

// Sync emails from Gmail to Supabase
const syncEmails = async () => {
  try {
    // Get Gmail client
    const gmail = await getGmailClient();
    if (!gmail) {
      console.log('Gmail client not available, skipping sync');
      return;
    }
    
    // Get list of messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // Limit to 10 messages per sync
    });
    
    const messages = response.data.messages;
    if (!messages || messages.length === 0) {
      console.log('No new messages found');
      return;
    }
    
    // Get full message details and save to database
    for (const message of messages) {
      // Get full message
      const { data: fullMessage } = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });
      
      // Parse message
      const parsedEmail = parseMessage(fullMessage);
      if (!parsedEmail || !parsedEmail.recipient_email) {
        console.log(`Skipping message ${message.id} - could not parse or no recipient`);
        continue;
      }
      
      // Check if email with this recipient already exists
      const { data: existingEmail } = await supabase
        .from('emails')
        .select('id')
        .eq('recipient_email', parsedEmail.recipient_email)
        .maybeSingle();
      
      if (existingEmail) {
        // Update existing email
        await supabase
          .from('emails')
          .update({
            subject: parsedEmail.subject,
            body: parsedEmail.body,
            date_received: parsedEmail.date_received,
            raw_data: parsedEmail.raw_data
          })
          .eq('id', existingEmail.id);
          
        console.log(`Updated email for recipient ${parsedEmail.recipient_email}`);
      } else {
        // Insert new email
        await supabase
          .from('emails')
          .insert(parsedEmail);
          
        console.log(`Added new email for recipient ${parsedEmail.recipient_email}`);
      }
    }
    
    console.log(`Completed sync of ${messages.length} emails`);
  } catch (error) {
    console.error('Error syncing emails:', error);
  }
};

module.exports = {
  syncEmails,
  getGmailClient
}; 