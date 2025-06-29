# KYC Document Manager - Setup Guide

## Schnellstart (2 Wochen MVP)

### Voraussetzungen
- Node.js 18+
- SharePoint Zugriff mit App-Registrierung
- E-Mail Konto mit IMAP/SMTP Zugriff
- OpenAI API Key

### 1. Installation (Tag 1)

```bash
cd kyc-mvp
npm install
```

### 2. Umgebungsvariablen einrichten

Erstelle eine `.env.local` Datei:

```env
# SharePoint Configuration
SHAREPOINT_TENANT_ID=your-tenant-id
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/kyc-documents

# Email Configuration
EMAIL_USER=kyc@yourcompany.com
EMAIL_PASSWORD=your-email-password
EMAIL_HOST=imap.yourprovider.com

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
```

### 3. SharePoint App-Registrierung

1. Gehe zu https://portal.azure.com
2. App registrations → New registration
3. API permissions hinzufügen:
   - Files.Read.All
   - Sites.Read.All
4. Client Secret erstellen

### 4. Erste Ausführung

```bash
# Datenbank initialisieren
npm run setup

# Dokumente indexieren
npm run index-documents

# App starten
npm run dev
```

### 5. Workflow

1. **Initiale Indexierung**: Beim ersten Start werden alle PDFs aus SharePoint geladen und mit AI analysiert
2. **E-Mail Check**: App prüft regelmäßig neue E-Mails
3. **Human Review**: Neue Anfragen erscheinen im Dashboard
4. **Approval**: Klick auf "Bearbeiten" → Review → Senden

## Wichtige Dateien

- `/src/services/sharepoint.service.ts` - SharePoint Integration
- `/src/services/email-processor.ts` - E-Mail Verarbeitung
- `/src/services/document-indexer.ts` - Dokument-Analyse
- `/pages/index.tsx` - Dashboard
- `/pages/review/[id].tsx` - Review Interface

## Troubleshooting

### SharePoint Fehler
- Prüfe Tenant ID und Client Credentials
- Stelle sicher, dass die App die richtigen Permissions hat

### E-Mail Fehler
- IMAP muss aktiviert sein
- App-spezifische Passwörter bei 2FA

### AI Fehler
- OpenAI API Key prüfen
- Rate Limits beachten (max 100 Dokumente initial)

## Nächste Schritte nach MVP

1. **Automatisierung**: Human-in-the-Loop entfernen
2. **Multi-Tenancy**: Datenbank-Schema erweitern
3. **Security**: OAuth2, Encryption, Audit Logs
4. **Features**: Übersetzung, OCR, Template-System 