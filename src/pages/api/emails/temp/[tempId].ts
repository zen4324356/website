import { NextApiRequest, NextApiResponse } from 'next';
import { readTempEmail, deleteTempEmail } from '@/api/emailTemp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tempId } = req.query;

  if (typeof tempId !== 'string') {
    return res.status(400).json({ error: 'Invalid temp ID' });
  }

  if (req.method === 'GET') {
    try {
      const content = await readTempEmail(tempId);
      if (!content) {
        return res.status(404).json({ error: 'Email not found' });
      }
      return res.status(200).send(content);
    } catch (error) {
      console.error('Error reading temp email:', error);
      return res.status(500).json({ error: 'Failed to read email' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteTempEmail(tempId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting temp email:', error);
      return res.status(500).json({ error: 'Failed to delete email' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 