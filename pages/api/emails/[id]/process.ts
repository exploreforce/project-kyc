import { NextApiRequest, NextApiResponse } from 'next';
import { EmailProcessor } from '../../../../src/services/email-processor';
import { useRouter } from 'next/router';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      // Process the email to generate response
      const processor = new EmailProcessor();
      
      // This would normally process the specific email
      // For MVP, we'll redirect to the review page
      
      res.status(200).json({ 
        success: true, 
        redirectTo: `/review/${id}` 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process email' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 