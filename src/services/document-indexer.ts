import { OpenAI } from 'openai';
import db from '../lib/database';
import { SharePointService } from './sharepoint.service';
import crypto from 'crypto';

export class DocumentIndexer {
  private openai: OpenAI;
  private sharepoint: SharePointService;

  constructor(sharepoint: SharePointService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.sharepoint = sharepoint;
  }

  async indexAllDocuments(folderPath: string = '/') {
    console.log('Starting document indexing...');
    
    const documents = await this.sharepoint.listDocuments(folderPath);
    
    for (const doc of documents) {
      if (doc.name.toLowerCase().endsWith('.pdf')) {
        await this.indexDocument(doc);
      }
    }
    
    console.log(`Indexed ${documents.length} documents`);
    return this.checkExpiredDocuments();
  }

  private async indexDocument(doc: any) {
    try {
      // Check if already indexed
      const existing = db.prepare('SELECT * FROM documents WHERE sharepoint_id = ?').get(doc.id);
      
      // Download and extract text
      const buffer = await this.sharepoint.downloadDocument(doc.id);
      const contentHash = crypto.createHash('md5').update(buffer).digest('hex');
      
      // Skip if content hasn't changed
      if (existing && existing.content_hash === contentHash) {
        console.log(`Skipping ${doc.name} - no changes`);
        return;
      }

      const text = await this.sharepoint.extractPdfText(buffer);
      
      // Get AI summary and extract metadata
      const analysis = await this.analyzeDocument(doc.name, text);
      
      // Save to database
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO documents 
        (id, sharepoint_id, filename, filepath, summary, content_hash, expiry_date, document_type, language, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      stmt.run(
        crypto.randomUUID(),
        doc.id,
        doc.name,
        doc.webUrl,
        analysis.summary,
        contentHash,
        analysis.expiryDate,
        analysis.documentType,
        analysis.language
      );
      
      console.log(`Indexed: ${doc.name}`);
    } catch (error) {
      console.error(`Error indexing ${doc.name}:`, error);
    }
  }

  private async analyzeDocument(filename: string, content: string) {
    const prompt = `Analyze this document and extract the following information:
    1. A one-sentence summary of what this document is
    2. The expiry date if mentioned (format: YYYY-MM-DD, or null if none)
    3. The type of document (e.g., certificate, license, contract, etc.)
    4. The language of the document
    
    Document name: ${filename}
    Content: ${content.substring(0, 3000)}...
    
    Respond in JSON format: {"summary": "", "expiryDate": null or "YYYY-MM-DD", "documentType": "", "language": ""}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  checkExpiredDocuments() {
    const expired = db.prepare(`
      SELECT * FROM documents 
      WHERE expiry_date < date('now') 
      AND expiry_date IS NOT NULL
    `).all();
    
    return expired;
  }
} 