import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function extractBody(data: any): string {
  try {
    // For multipart messages
    if (data.payload?.parts) {
      let htmlContent = '';
      let plainContent = '';

      // Recursive function to traverse all parts
      const traverseParts = (parts: any[]) => {
        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            htmlContent = decodeBase64(part.body.data);
          } else if (part.mimeType === 'text/plain' && part.body?.data) {
            plainContent = decodeBase64(part.body.data);
          }
          // Recursively check nested parts
          if (part.parts) {
            traverseParts(part.parts);
          }
        }
      };

      traverseParts(data.payload.parts);

      // Prefer HTML content over plain text
      if (htmlContent) {
        return htmlContent;
      } else if (plainContent) {
        return plainContent;
      }
    }

    // For non-multipart messages
    if (data.payload?.body?.data) {
      return decodeBase64(data.payload.body.data);
    }

    return '';
  } catch (error) {
    console.error('Error extracting email body:', error);
    return '';
  }
}

function decodeBase64(encoded: string): string {
  try {
    // Replace URL-safe characters and decode
    const normalized = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/\s/g, '');

    // Add padding if needed
    const padding = normalized.length % 4;
    if (padding > 0) {
      return normalized + '='.repeat(padding);
    }

    return normalized;
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}

serve(async (req) => {
  try {
    const { emailId } = await req.json();
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
      throw new Error('No authorization token provided');
    }

    // Fetch raw email content
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=raw`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ email: data }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 