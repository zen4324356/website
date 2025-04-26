import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@126.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get active Google config
    const { data: googleConfig, error: configError } = await supabaseClient
      .from('google_configs')
      .select('*')
      .eq('active', true)
      .single();

    if (configError || !googleConfig) {
      throw new Error('No active Google config found');
    }

    // Initialize Gmail API
    const auth = new google.auth.OAuth2(
      googleConfig.client_id,
      googleConfig.client_secret
    );
    auth.setCredentials({ access_token: googleConfig.access_token });

    const gmail = google.gmail({ version: 'v1', auth });

    // Search for new emails
    const { data: messages } = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'in:inbox'
    });

    if (!messages.messages) {
      return new Response(JSON.stringify({ success: true, message: 'No new emails' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process each email
    const emails = await Promise.all(
      messages.messages.map(async (message) => {
        const { data: email } = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });

        const headers = email.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

        // Get email body
        let body = '';
        if (email.payload?.body?.data) {
          body = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (email.payload?.parts) {
          body = email.payload.parts
            .map(part => {
              if (part.body?.data) {
                return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              }
              return '';
            })
            .join('\n');
        }

        return {
          id: message.id,
          from,
          to,
          subject,
          body,
          date,
          isRead: !email.labelIds?.includes('UNREAD'),
          isHidden: false,
          matchedIn: 'gmail',
          extractedRecipients: [to],
          rawMatch: null,
          isForwardedEmail: false,
          isCluster: false,
          isDomainForwarded: false,
          isImportant: false,
          isGrouped: false
        };
      })
    );

    // Group emails by domain
    const emailsByDomain = emails.reduce((acc: { [key: string]: any[] }, email) => {
      const domain = email.from.split('@')[1] || 'unknown';
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(email);
      return acc;
    }, {});

    // Save to server storage
    for (const [domain, domainEmails] of Object.entries(emailsByDomain)) {
      const { error: storageError } = await supabaseClient
        .from('server_emails')
        .upsert(
          domainEmails.map(email => ({
            ...email,
            domain,
            date: new Date().toISOString().split('T')[0]
          })),
          { onConflict: 'id' }
        );

      if (storageError) {
        console.error('Error saving emails to server:', storageError);
      }
    }

    // Update server storage stats
    const { data: stats } = await supabaseClient
      .from('server_emails')
      .select('id')
      .count();

    await supabaseClient
      .from('server_storage_stats')
      .upsert({
        total_emails: stats?.length || 0,
        last_updated: new Date().toISOString(),
        storage_size: '0 MB' // You can calculate actual size if needed
      });

    return new Response(JSON.stringify({ success: true, message: 'Emails processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 