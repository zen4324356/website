import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { updateProgress } from "../check-progress/index.ts";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

// Track search progress for multiple users
const searchProgress: Record<string, any> = {};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchEmail, includeRead = false, daysBack = 2 } = await req.json();
    
    if (!searchEmail) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get active Google auth config
    const { data: googleAuthData, error: googleAuthError } = await supabaseAdmin
      .from("google_auth")
      .select("*")
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    
    if (googleAuthError) {
      console.error("Google auth error:", googleAuthError);
      return new Response(
        JSON.stringify({ error: "Error fetching Google authentication", details: googleAuthError }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!googleAuthData) {
      console.error("No active Google authentication found");
      return new Response(
        JSON.stringify({ error: "No active Google authentication found. Please add and activate a Google Auth configuration in the Admin panel." }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Enhanced token handling with auto-refresh
    let accessToken = googleAuthData.access_token;
    let needsRefresh = false;
    
    // Check if token is expired or will expire soon (within 5 minutes)
    if (googleAuthData.token_expiry) {
      const expiryTime = new Date(googleAuthData.token_expiry).getTime();
      const currentTime = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      
      if (currentTime + fiveMinutesMs >= expiryTime) {
        needsRefresh = true;
      }
    } else if (!accessToken) {
      needsRefresh = true;
    }
    
    // Refresh token if needed
    if (needsRefresh && googleAuthData.client_id && googleAuthData.client_secret && googleAuthData.refresh_token) {
      try {
        console.log("Refreshing access token automatically");
        
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: googleAuthData.client_id,
            client_secret: googleAuthData.client_secret,
            refresh_token: googleAuthData.refresh_token,
            grant_type: "refresh_token",
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
          // Update the access token in the database
          const { error: updateError } = await supabaseAdmin
            .from("google_auth")
            .update({
              access_token: tokenData.access_token,
              token_expiry: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
            })
            .eq("id", googleAuthData.id);
            
          if (updateError) {
            console.error("Error updating access token:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to update access token", details: updateError }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
              }
            );
          }
          
          // Use the new access token
          accessToken = tokenData.access_token;
          console.log("Successfully refreshed access token");
        } else {
          console.error("Failed to refresh access token:", tokenData);
          return new Response(
            JSON.stringify({ 
              error: "Failed to refresh access token. Please reauthorize with Google in the Admin panel."
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        return new Response(
          JSON.stringify({ 
            error: "Error refreshing token. Please reauthorize with Google in the Admin panel." 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: "No access token available. You need to complete the Google OAuth process in the Admin panel." 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Calculate how many days back to search based on the daysBack param
    const days = Math.min(Math.max(1, parseInt(daysBack as string) || 2), 30); // Between 1 and 30 days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    // Format date for the query YYYY/MM/DD
    const formattedDate = daysAgo.toISOString().split('T')[0].replace(/-/g, '/');
    
    let query = `from:(*@netflix.com) after:${formattedDate}`;
    
    // Only restrict to unread if includeRead is false
    if (!includeRead) {
      query += " is:unread";
    }
    
    // Update progress
    searchProgress[searchEmail] = {
      status: 'Fetching matching emails from Gmail API...',
      total: 0,
      current: 0
    };

    console.log(`Using search query: ${query}`);

    const gmail = google.gmail({ version: 'v1', auth: new OAuth2Client(accessToken) });
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    });
    
    const emailIds = response.data.messages?.map((message: any) => message.id) || [];
    if (emailIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          emails: [],
          searchOrigin: {
            query,
            totalResults: 0,
            searchTime: new Date().toISOString()
          }
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update progress
    const totalEmails = emailIds.length;
    searchProgress[searchEmail] = {
      status: `Found ${totalEmails} matching emails, retrieving details...`,
      total: totalEmails,
      current: 0
    };

    console.log(`Found ${totalEmails} matching emails for ${searchEmail}`);

    // Get all email details (in parallel)
    const emails = await getEmailDetails(gmail, emailIds);

    // Update progress
    searchProgress[searchEmail] = {
      status: 'Processing email content and extracting recipients...',
      total: totalEmails,
      current: totalEmails
    };
    
    // Return the emails with metadata
    return new Response(
      JSON.stringify({
        emails,
        searchOrigin: {
          query,
          totalResults: totalEmails,
          limitedResults: emails.length,
          searchTime: new Date().toISOString()
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: `Error processing request: ${error.message}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Get detailed information for a list of email IDs
 */
async function getEmailDetails(gmail: any, emailIds: string[]) {
  const emails = [];
  
  // Limit to first 50 email IDs to prevent overwhelming with large clusters
  const limitedEmailIds = emailIds.slice(0, 50);
  
  // Process emails in parallel for faster processing
  try {
    await Promise.all(
      limitedEmailIds.map(async (emailId, index) => {
        try {
          // Update progress
          if (searchProgress[searchEmail]) {
            searchProgress[searchEmail].current = index;
            searchProgress[searchEmail].total = limitedEmailIds.length;
            searchProgress[searchEmail].status = `Processing email ${index + 1} of ${limitedEmailIds.length}`;
            
            // Update progress in database every 5 emails
            if (index % 5 === 0) {
              await updateProgress(searchEmail, searchProgress[searchEmail]);
            }
          }
          
          // Get full email details
          const email = await gmail.users.messages.get({
            userId: 'me',
            id: emailId,
            format: 'full'
          });
          
          // Extract body and recipients
          const body = extractEmailBody(email.data);
          const recipients = getEmailRecipients(email.data.payload.headers);
          
          // Format and add to collection
          const formattedEmail = formatEmail(email.data, body, recipients);
          emails.push(formattedEmail);
        } catch (error) {
          console.error(`Error processing email ${emailId}:`, error);
        }
      })
    );
    
    // Final progress update
    if (searchProgress[searchEmail]) {
      searchProgress[searchEmail].status = `Completed processing ${emails.length} emails`;
      await updateProgress(searchEmail, searchProgress[searchEmail]);
    }
    
    return emails;
  } catch (error) {
    console.error('Error processing emails:', error);
    return [];
  }
}

// Get a single email detail with full content
async function getEmailDetail(token: string, emailId: string) {
  try {
    // Fetch with 'full' format to get complete email content including headers
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`Error fetching email ${emailId}:`, await response.text());
      return null;
    }

    const emailData = await response.json();
    
    // Always try to get the raw message format for complete content
    try {
      const rawResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/raw`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (rawResponse.ok) {
        const rawData = await rawResponse.json();
        if (rawData.raw) {
          emailData.rawContent = decodeBase64(rawData.raw);
          
          // Extract raw headers from the content
          const headerEnd = emailData.rawContent.indexOf('\r\n\r\n');
          if (headerEnd > -1) {
            emailData.rawHeaders = emailData.rawContent.substring(0, headerEnd);
          }
        }
      } else {
        console.log(`Could not fetch raw email ${emailId}, status: ${rawResponse.status}`);
      }
    } catch (rawError) {
      console.error(`Error fetching raw email ${emailId}:`, rawError);
      // Continue with the regular email data if raw fetch fails
    }

    return emailData;
  } catch (error) {
    console.error(`Error fetching email ${emailId}:`, error);
    return null;
  }
}

/**
 * Extracts all recipient email addresses from the email headers
 */
function getEmailRecipients(headers: any[]): string[] {
  const recipients: string[] = [];
  const recipientFields = ['To', 'Cc', 'Bcc', 'Delivered-To', 'X-Forwarded-To', 'Return-Path'];
  
  recipientFields.forEach(field => {
    const headerValue = getHeader(headers, field);
    if (headerValue) {
      // Extract email addresses from the header value using regex
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const matches = headerValue.match(emailRegex) || [];
      recipients.push(...matches);
    }
  });
  
  return [...new Set(recipients.map(r => r.toLowerCase()))]; // Deduplicate and normalize to lowercase
}

// Extract email body from MIME parts
function extractEmailBody(email: any): string {
  const parts = email.payload?.parts || [];
  const mimeType = email.payload?.mimeType;
  
  // If the email body is in the payload data
  if (email.payload?.body?.data) {
    return decodeBase64(email.payload.body.data);
  }
  
  // Handle multipart emails
  if (mimeType && mimeType.includes('multipart')) {
    // First check for text/plain parts
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    
    // Then check for HTML parts if no plain text was found
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      
      // Recursively check for nested multipart sections
      if (part.parts && part.parts.length > 0) {
        const nestedBody = extractEmailBody(part);
        if (nestedBody) {
          return nestedBody;
        }
      }
    }
  }
  
  // Return empty string if no content found
  return '';
}

/**
 * Parses forwarded email content to extract structured data
 */
function parseForwardedEmail(emailBody: string): Array<{from?: string, to?: string, subject?: string, date?: string, body?: string}> | null {
  if (!emailBody) return null;
  
  const forwardedContent: Array<{from?: string, to?: string, subject?: string, date?: string, body?: string}> = [];
  
  // Pattern to detect forwarded email sections with standard headers
  const forwardedSectionRegex = /(?:(?:From|Sent|To|Subject|Date|CC|BCC):[\s\S]*?){2,}(?:\n\n|\r\n\r\n)([\s\S]*?)(?:\n\nFrom:|$)/gi;
  
  // Pattern to match headers within a forwarded section
  const headerRegex = {
    from: /From:([^\n]+)/i,
    to: /To:([^\n]+)/i,
    subject: /Subject:([^\n]+)/i,
    date: /Date:([^\n]+)/i,
  };
  
  let match;
  while ((match = forwardedSectionRegex.exec(emailBody)) !== null) {
    const forwardedSection = match[0];
    const forwardData: {from?: string, to?: string, subject?: string, date?: string, body?: string} = {};
    
    // Extract headers from forwarded section
    Object.entries(headerRegex).forEach(([key, regex]) => {
      const headerMatch = forwardedSection.match(regex);
      if (headerMatch && headerMatch[1]) {
        forwardData[key as keyof typeof forwardData] = headerMatch[1].trim();
      }
    });
    
    // Extract body content from forwarded section
    const bodyMatch = /(?:\n\n|\r\n\r\n)([\s\S]*?)$/i.exec(forwardedSection);
    if (bodyMatch && bodyMatch[1]) {
      forwardData.body = bodyMatch[1].trim();
    }
    
    if (Object.keys(forwardData).length > 0) {
      forwardedContent.push(forwardData);
    }
  }
  
  // Alternative detection for forwarded emails in Gmail format
  if (forwardedContent.length === 0) {
    const gmailForwardRegex = /---------- Forwarded message ---------[\s\S]*?From:([^<\n]*)?<?([^\n>]*?)>?[\s\S]*?Date:([^\n]*?)[\s\S]*?Subject:([^\n]*?)[\s\S]*?To:([^<\n]*)?<?([^\n>]*?)>?([\s\S]*?)(?:(?=---------- Forwarded message ---------)|$)/gi;
    
    let gmailMatch;
    while ((gmailMatch = gmailForwardRegex.exec(emailBody)) !== null) {
      const [_, fromName, fromEmail, date, subject, toName, toEmail, body] = gmailMatch;
      
      forwardedContent.push({
        from: `${fromName?.trim() || ''} <${fromEmail?.trim() || ''}>`.trim(),
        to: `${toName?.trim() || ''} <${toEmail?.trim() || ''}>`.trim(),
        date: date?.trim(),
        subject: subject?.trim(),
        body: body?.trim()
      });
    }
  }
  
  return forwardedContent.length > 0 ? forwardedContent : null;
}

// Format email data for output
function formatEmail(email: any, body: string, recipients: string[]): any {
  const headers = email.payload.headers;
  const subject = getHeader(headers, 'Subject') || '(no subject)';
  const from = getHeader(headers, 'From') || '';
  const date = getHeader(headers, 'Date') || '';
  const to = getHeader(headers, 'To') || '';
  
  // Check if it's a Netflix email based on the sender, recipients, or subject
  const isFromNetflix = from.toLowerCase().includes('@netflix.com');
  const hasNetflixRecipient = recipients.some((r: string) => r.includes('@netflix.com'));
  const hasNetflixSubject = subject.toLowerCase().includes('netflix');
  
  // Extract forwarded content if present
  const forwardedContent = parseForwardedEmail(body) || [];
  
  return {
    id: email.id,
    threadId: email.threadId,
    internalDate: email.internalDate,
    snippet: email.snippet,
    subject,
    from,
    to,
    date,
    body,
    recipients,
    labelIds: email.labelIds || [],
    isNetflixEmail: isFromNetflix || hasNetflixRecipient || hasNetflixSubject,
    forwardedContent
  };
}

// Helper function to decode base64
function decodeBase64(data: string) {
  try {
    // Replace URL-safe characters and add padding if needed
    data = data.replace(/-/g, '+').replace(/_/g, '/');
    while (data.length % 4) {
      data += '=';
    }
    
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}

// Helper to get a header value
function getHeader(headers: any[], name: string) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}
