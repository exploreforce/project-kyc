import { OpenAI } from 'openai';
import db from '../lib/database';
import { simpleParser } from 'mailparser';
import * as Imap from 'imap';
import { promisify } from 'util';

interface EmailRequest {
  messageId: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

interface DocumentRequest {
  requestedDocuments: string[];
  requiredActions: string[];
  language: string;
  urgency: 'low' | 'medium' | 'high';
}

export class EmailProcessor {
  private openai: OpenAI;
  private imap: Imap;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.imap = new Imap({
      user: process.env.EMAIL_USER!,
      password: process.env.EMAIL_PASSWORD!,
      host: process.env.EMAIL_HOST!,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  async processIncomingEmails() {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) return reject(err);

          const fetch = this.imap.seq.fetch('1:*', {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) return;
                
                await this.saveAndAnalyzeEmail({
                  messageId: parsed.messageId || '',
                  from: parsed.from?.text || '',
                  subject: parsed.subject || '',
                  body: parsed.text || parsed.html || '',
                  receivedAt: parsed.date || new Date()
                });
              });
            });
          });

          fetch.once('end', () => {
            this.imap.end();
            resolve(true);
          });
        });
      });

      this.imap.connect();
    });
  }

  private async saveAndAnalyzeEmail(email: EmailRequest) {
    // Check if already processed
    const existing = db.prepare('SELECT * FROM email_requests WHERE message_id = ?').get(email.messageId);
    if (existing) return;

    // Analyze email with AI
    const analysis = await this.analyzeEmailRequest(email);

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO email_requests 
      (message_id, from_email, subject, body, received_at, ai_analysis)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      email.messageId,
      email.from,
      email.subject,
      email.body,
      email.receivedAt.toISOString(),
      JSON.stringify(analysis)
    );

    // Auto-generate response
    await this.generateResponse(email, analysis);
  }

  private async analyzeEmailRequest(email: EmailRequest): Promise<DocumentRequest> {
    const prompt = `Analyze this email and extract document requests:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Extract:
1. What documents are being requested (be specific)
2. What actions need to be taken (e.g., translation, certification)
3. The language of the email
4. Urgency level (low/medium/high)

Respond in JSON format: {
  "requestedDocuments": ["doc1", "doc2"],
  "requiredActions": ["action1", "action2"],
  "language": "en",
  "urgency": "medium"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async generateResponse(email: EmailRequest, analysis: DocumentRequest) {
    // Find matching documents
    const documents = this.findMatchingDocuments(analysis.requestedDocuments);
    
    // Generate email response
    const responseText = await this.generateEmailResponse(email, analysis, documents);

    // Save draft response
    const stmt = db.prepare(`
      INSERT INTO email_responses 
      (request_id, draft_subject, draft_body, attached_documents, status)
      VALUES (
        (SELECT id FROM email_requests WHERE message_id = ?),
        ?, ?, ?, 'draft'
      )
    `);

    stmt.run(
      email.messageId,
      `Re: ${email.subject}`,
      responseText,
      JSON.stringify(documents.map(d => d.id))
    );
  }

  private findMatchingDocuments(requestedDocs: string[]) {
    const allDocs = db.prepare('SELECT * FROM documents WHERE expiry_date IS NULL OR expiry_date > date("now")').all();
    
    return allDocs.filter(doc => {
      const searchText = `${doc.filename} ${doc.summary} ${doc.document_type}`.toLowerCase();
      return requestedDocs.some(req => 
        searchText.includes(req.toLowerCase())
      );
    });
  }

  private async generateEmailResponse(
    email: EmailRequest, 
    analysis: DocumentRequest, 
    documents: any[]
  ): Promise<string> {
    const prompt = `Generate a professional email response for this document request:

Original Email:
${email.body}

Analysis:
- Requested documents: ${analysis.requestedDocuments.join(', ')}
- Required actions: ${analysis.requiredActions.join(', ')}

Available documents:
${documents.map(d => `- ${d.filename}: ${d.summary}`).join('\n')}

Write a professional response in ${analysis.language} that:
1. Acknowledges their request
2. Lists the attached documents
3. Mentions any documents we don't have
4. Is polite and professional`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }]
    });

    return response.choices[0].message.content || '';
  }
} 