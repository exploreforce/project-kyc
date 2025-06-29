import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../src/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // For now, return empty array since database might not be initialized yet
      const documents: any[] = [];
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 