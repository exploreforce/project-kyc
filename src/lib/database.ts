import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'kyc.db'));

// Initialize database schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      sharepoint_id TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      summary TEXT,
      content_hash TEXT,
      expiry_date DATE,
      document_type TEXT,
      language TEXT,
      indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE NOT NULL,
      from_email TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      received_at DATETIME,
      processed_at DATETIME,
      status TEXT DEFAULT 'pending',
      ai_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      draft_subject TEXT,
      draft_body TEXT,
      attached_documents TEXT, -- JSON array of document IDs
      approved_at DATETIME,
      sent_at DATETIME,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES email_requests(id)
    );

    CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_email_status ON email_requests(status);
  `);
}

export default db; 