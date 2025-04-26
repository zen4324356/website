import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { emailId, format } = await req.json();

    // Get email content from Gmail API
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${req.headers.get('Authorization')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data));
  } catch (error) {
    console.error('Error getting email content:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}); 