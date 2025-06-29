import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../src/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // For now, return empty array since we don't have emails yet
      const emails: any[] = [];
      res.status(200).json(emails);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch emails' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 