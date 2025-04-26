import { NextApiRequest, NextApiResponse } from 'next';
import { getEmailDetail } from '@/lib/gmail'; // You'll need to implement this

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailId } = req.query;

  if (typeof emailId !== 'string') {
    return res.status(400).json({ error: 'Invalid email ID' });
  }

  try {
    const email = await getEmailDetail(emailId);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    return res.status(200).json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    return res.status(500).json({ error: 'Failed to fetch email' });
  }
} 