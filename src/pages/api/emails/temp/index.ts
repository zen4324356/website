import { NextApiRequest, NextApiResponse } from 'next';
import { saveTempEmail } from '@/api/emailTemp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Email content is required' });
      }

      const tempId = await saveTempEmail(content);
      return res.status(200).json({ tempId });
    } catch (error) {
      console.error('Error saving temp email:', error);
      return res.status(500).json({ error: 'Failed to save email temporarily' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 