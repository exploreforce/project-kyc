# KYC Document Manager MVP

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   - Copy `.env.example` to `.env.local`
   - Fill in your credentials (SharePoint, Email, OpenAI)

3. **Initialize & Run**
   ```bash
   npm run setup     # Initialize DB & index documents
   npm run dev       # Start the app
   ```

4. **Access**
   - Open http://localhost:3000
   - Dashboard shows documents and email requests
   - Click "Bearbeiten" to review and send responses

## Architecture

```
SharePoint → Document Indexer → SQLite DB
     ↓                              ↑
Email Server → AI Processor → Draft Response → Human Review → Send
```

## Key Features

- ✅ Automatic document discovery from SharePoint
- ✅ AI-powered email analysis
- ✅ Intelligent document matching
- ✅ Human-in-the-loop approval
- ✅ Expiry date tracking

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express (via Next.js API)
- **Database**: SQLite (via better-sqlite3)
- **AI**: OpenAI GPT-4
- **Integrations**: Microsoft Graph (SharePoint), IMAP/SMTP

## Project Structure

```
kyc-mvp/
├── pages/
│   ├── index.tsx          # Dashboard
│   ├── review/[id].tsx    # Email review page
│   └── api/              # API endpoints
├── src/
│   ├── services/         # Core services
│   ├── lib/              # Database setup
│   └── types/            # TypeScript types
└── scripts/              # Setup scripts
```

## Next Steps

After this MVP works:
1. Remove human-in-the-loop for full automation
2. Add multi-tenancy support
3. Implement security features
4. Add document translation capabilities 