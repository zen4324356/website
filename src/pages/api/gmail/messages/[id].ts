import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    // Create Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get email content
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: id as string,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];
    const parts = message.payload?.parts || [];

    // Extract email content
    let body = '';
    let contentType = '';

    // Find the main content part
    for (const part of parts) {
      if (part.mimeType === 'text/html') {
        body = Buffer.from(part.body?.data || '', 'base64').toString();
        contentType = 'html';
        break;
      } else if (part.mimeType === 'text/plain') {
        body = Buffer.from(part.body?.data || '', 'base64').toString();
        contentType = 'plain';
      }
    }

    // If no content found, try the main body
    if (!body && message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    }

    // Extract email metadata
    const getHeader = (name: string) => {
      const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const email = {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      body: body,
      contentType: contentType,
      headers: headers,
    };

    return res.status(200).json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    return res.status(500).json({ error: 'Failed to fetch email' });
  }
} 