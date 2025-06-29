# KYC Document Manager - Vollständige Dokumentation

## Projektübersicht

Der KYC Document Manager ist eine automatisierte Lösung für die Verwaltung von Know-Your-Customer-Dokumentenanfragen. Die Anwendung empfängt E-Mail-Anfragen, analysiert diese mit KI, findet passende Dokumente aus SharePoint und erstellt automatisch Antworten mit den angeforderten Dokumenten.

## Ordnerstruktur

```
kyc-mvp/
├── pages/                      # Next.js Pages (Frontend + API)
│   ├── api/                   # Backend API Endpoints
│   │   ├── documents/         # Dokument-bezogene Endpoints
│   │   │   └── index.ts      # GET /api/documents - Listet alle Dokumente
│   │   └── emails/           # E-Mail-bezogene Endpoints
│   │       └── [id]/         # Dynamische Routes für E-Mail-IDs
│   │           └── process.ts # POST /api/emails/:id/process
│   ├── review/               # Review-Seiten
│   │   └── [id].tsx         # E-Mail Review & Approval Seite
│   ├── _app.tsx             # Next.js App-Wrapper (lädt globale Styles)
│   └── index.tsx            # Dashboard (Hauptseite)
│
├── src/                      # Source Code
│   ├── lib/                 # Bibliotheken und Utilities
│   │   └── database.ts      # SQLite Datenbank-Setup und Initialisierung
│   ├── services/            # Business Logic Services
│   │   ├── sharepoint.service.ts    # SharePoint Integration
│   │   ├── document-indexer.ts      # Dokument-Analyse mit AI
│   │   └── email-processor.ts       # E-Mail Verarbeitung & AI-Analyse
│   └── types/               # TypeScript Type Definitions (leer, für Erweiterungen)
│
├── scripts/                  # Utility Scripts
│   └── setup.js             # Setup-Script für DB-Init und erste Indexierung
│
├── styles/                   # CSS Styles
│   └── globals.css          # Globale Styles mit Tailwind Directives
│
├── data/                     # Datenbank-Ordner
│   └── kyc.db              # SQLite Datenbank (wird bei Setup erstellt)
│
├── components/              # React Components (leer, für Erweiterungen)
│
├── package.json             # NPM Dependencies und Scripts
├── tsconfig.json           # TypeScript Konfiguration
├── tailwind.config.js      # Tailwind CSS Konfiguration
├── next.config.js          # Next.js Konfiguration
├── README.md               # Quick Start Guide
├── SETUP.md                # Detaillierte Setup-Anleitung
└── Documentation.md        # Diese Datei
```

## Datei-Beschreibungen

### Frontend (pages/)

#### `pages/index.tsx`
**Zweck**: Dashboard - Hauptübersicht der Anwendung  
**Funktionen**:
- Zeigt alle indexierten Dokumente aus SharePoint
- Listet eingehende E-Mail-Anfragen mit Status
- Warnt vor abgelaufenen Dokumenten
- Auto-Refresh alle 30 Sekunden
- Button zum Bearbeiten von E-Mails

**API Calls**:
- `GET /api/documents` - Lädt alle Dokumente
- `GET /api/emails` - Lädt alle E-Mail-Anfragen
- `GET /api/documents/expired` - Lädt abgelaufene Dokumente

#### `pages/review/[id].tsx`
**Zweck**: E-Mail Review und Freigabe-Interface  
**Funktionen**:
- Zeigt Original-E-Mail und generierten Antwort-Entwurf
- Erlaubt Bearbeitung des Antworttextes
- Listet angehängte Dokumente mit Zusammenfassungen
- Senden-Button für finale Freigabe
- Abbrechen-Option

**API Calls**:
- `GET /api/emails/:id/response` - Lädt E-Mail-Details und Antwort-Entwurf
- `POST /api/emails/:id/send` - Sendet die freigegebene E-Mail

#### `pages/_app.tsx`
**Zweck**: Next.js App-Wrapper  
**Funktionen**:
- Importiert globale CSS-Styles
- Wrapper für alle Seiten der Anwendung

### Backend Services (src/services/)

#### `src/services/sharepoint.service.ts`
**Zweck**: Integration mit Microsoft SharePoint  
**Klasse**: `SharePointService`  
**Hauptfunktionen**:
- `initialize()` - Verbindung zu SharePoint herstellen
- `listDocuments()` - Alle Dokumente aus einem Ordner abrufen
- `downloadDocument()` - Einzelnes Dokument als Buffer herunterladen
- `getDocumentMetadata()` - Metadaten eines Dokuments abrufen
- `extractPdfText()` - Text aus PDF extrahieren

**Verwendet**:
- Microsoft Graph API für SharePoint-Zugriff
- Azure Identity für Authentifizierung
- pdf-parse für PDF-Text-Extraktion

#### `src/services/document-indexer.ts`
**Zweck**: Intelligente Dokumentenanalyse und Indexierung  
**Klasse**: `DocumentIndexer`  
**Hauptfunktionen**:
- `indexAllDocuments()` - Alle PDFs aus SharePoint indexieren
- `indexDocument()` - Einzelnes Dokument analysieren und speichern
- `analyzeDocument()` - KI-Analyse für Zusammenfassung und Metadaten
- `checkExpiredDocuments()` - Prüft auf abgelaufene Dokumente

**KI-Extraktion**:
- Zusammenfassung des Dokuments
- Ablaufdatum (falls vorhanden)
- Dokumententyp (Zertifikat, Lizenz, etc.)
- Sprache des Dokuments

#### `src/services/email-processor.ts`
**Zweck**: E-Mail-Verarbeitung und automatische Antwortgenerierung  
**Klasse**: `EmailProcessor`  
**Hauptfunktionen**:
- `processIncomingEmails()` - IMAP-Postfach auf neue E-Mails prüfen
- `saveAndAnalyzeEmail()` - E-Mail speichern und mit KI analysieren
- `analyzeEmailRequest()` - KI extrahiert angeforderte Dokumente
- `generateResponse()` - Erstellt Antwort-Entwurf mit passenden Dokumenten
- `findMatchingDocuments()` - Sucht passende Dokumente basierend auf Anfrage

**KI-Analyse extrahiert**:
- Angeforderte Dokumente
- Erforderliche Aktionen (z.B. Übersetzung)
- Sprache der E-Mail
- Dringlichkeit

### Datenbank (src/lib/)

#### `src/lib/database.ts`
**Zweck**: SQLite Datenbank-Setup und Schema-Definition  
**Funktionen**:
- `initDatabase()` - Erstellt Tabellen und Indizes
- Exportiert Datenbank-Instanz für andere Module

**Tabellen**:
1. **documents** - Speichert indexierte Dokumente
   - `id`: Eindeutige ID
   - `sharepoint_id`: SharePoint Dokument-ID
   - `filename`: Dateiname
   - `summary`: KI-generierte Zusammenfassung
   - `expiry_date`: Ablaufdatum
   - `document_type`: Dokumententyp
   - `language`: Sprache

2. **email_requests** - Eingehende E-Mail-Anfragen
   - `id`: Auto-increment ID
   - `message_id`: E-Mail Message-ID
   - `from_email`: Absender
   - `ai_analysis`: KI-Analyse als JSON
   - `status`: pending/processed

3. **email_responses** - Generierte Antworten
   - `request_id`: Verknüpfung zur Anfrage
   - `draft_subject`: Betreff-Entwurf
   - `draft_body`: Text-Entwurf
   - `attached_documents`: JSON-Array mit Dokument-IDs
   - `status`: draft/sent

### API Endpoints (pages/api/)

#### `pages/api/documents/index.ts`
**Route**: `GET /api/documents`  
**Zweck**: Listet alle Dokumente aus der Datenbank  
**Response**: Array von Dokument-Objekten

#### `pages/api/emails/[id]/process.ts`
**Route**: `POST /api/emails/:id/process`  
**Zweck**: Triggert die Verarbeitung einer E-Mail  
**Response**: Redirect zur Review-Seite

### Scripts

#### `scripts/setup.js`
**Zweck**: Initiales Setup der Anwendung  
**Ablauf**:
1. Initialisiert die SQLite Datenbank
2. Testet SharePoint-Verbindung
3. Indexiert alle Dokumente aus SharePoint
4. Zeigt abgelaufene Dokumente an
5. Gibt Setup-Status aus

**Verwendung**: `npm run setup`

### Konfigurationsdateien

#### `package.json`
**NPM Scripts**:
- `dev` - Startet Entwicklungsserver
- `build` - Erstellt Production Build
- `setup` - Führt Setup-Script aus
- `index-documents` - Re-indexiert Dokumente

**Hauptabhängigkeiten**:
- `next`, `react` - Frontend Framework
- `@microsoft/microsoft-graph-client` - SharePoint API
- `openai` - KI-Integration
- `better-sqlite3` - Datenbank
- `imap`, `nodemailer` - E-Mail-Verarbeitung
- `pdf-parse` - PDF-Text-Extraktion

#### `tsconfig.json`
- TypeScript-Konfiguration mit strikten Einstellungen
- Path-Alias `@/*` für saubere Imports

#### `tailwind.config.js`
- Tailwind CSS Konfiguration
- Scannt `pages/` und `components/` für verwendete Klassen

#### `next.config.js`
- Erhöhte API Limits für große Dokumente
- React Strict Mode aktiviert

## Datenfluss

### 1. Dokument-Indexierung
```
SharePoint → SharePointService → DocumentIndexer → OpenAI API → SQLite DB
```

### 2. E-Mail-Verarbeitung
```
E-Mail Server (IMAP) → EmailProcessor → OpenAI API → SQLite DB
                                      ↓
                              Dokument-Matching
                                      ↓
                              Response-Generierung
```

### 3. Human-in-the-Loop Review
```
Dashboard → E-Mail auswählen → Review-Seite → Bearbeiten → Senden
```

## Architektur-Diagramm

```mermaid
graph TB
    subgraph "External Services"
        SP[SharePoint]
        EMAIL[E-Mail Server]
        AI[OpenAI API]
    end
    
    subgraph "Backend Services"
        SPS[SharePointService]
        DI[DocumentIndexer]
        EP[EmailProcessor]
    end
    
    subgraph "Database"
        DB[(SQLite DB)]
        DOC[documents table]
        REQ[email_requests table]
        RES[email_responses table]
    end
    
    subgraph "Frontend"
        DASH[Dashboard<br/>index.tsx]
        REVIEW[Review Page<br/>review/[id].tsx]
    end
    
    subgraph "API Routes"
        API1[/api/documents]
        API2[/api/emails/:id/process]
    end
    
    SP --> SPS
    SPS --> DI
    DI --> AI
    DI --> DOC
    
    EMAIL --> EP
    EP --> AI
    EP --> REQ
    EP --> RES
    
    DASH --> API1
    API1 --> DB
    DASH --> API2
    API2 --> EP
    
    REVIEW --> RES
    DB --> DOC
    DB --> REQ
    DB --> RES
```

## Umgebungsvariablen (.env.local)

```env
# SharePoint
SHAREPOINT_TENANT_ID        # Azure AD Tenant ID
SHAREPOINT_CLIENT_ID        # App Registration Client ID
SHAREPOINT_CLIENT_SECRET    # App Registration Secret
SHAREPOINT_SITE_URL        # SharePoint Site URL

# E-Mail
EMAIL_USER                 # IMAP Benutzername
EMAIL_PASSWORD             # IMAP Passwort
EMAIL_HOST                 # IMAP Server

# OpenAI
OPENAI_API_KEY            # OpenAI API Schlüssel
```

## Wichtige Workflows

### Initial-Setup Workflow
1. **npm run setup** ausführen
2. Script verbindet sich mit SharePoint
3. Alle PDFs werden heruntergeladen
4. KI analysiert jedes Dokument
5. Metadaten werden in SQLite gespeichert
6. Abgelaufene Dokumente werden gemeldet

### E-Mail-Bearbeitungs-Workflow
1. **Neue E-Mail empfangen**: EmailProcessor checkt IMAP
2. **KI-Analyse**: Extrahiert angeforderte Dokumente
3. **Dokument-Matching**: Findet passende Dateien in DB
4. **Response-Generierung**: KI erstellt Antwort-Entwurf
5. **Human Review**: Mitarbeiter prüft im Dashboard
6. **Freigabe**: Nach Prüfung wird E-Mail gesendet

### Dokument-Update-Workflow
1. **Neue Dokumente in SharePoint**: Manuell hochgeladen
2. **Re-Indexierung**: npm run index-documents
3. **Änderungserkennung**: Content-Hash Vergleich
4. **Nur geänderte Dokumente**: Werden neu analysiert

## Erweiterungsmöglichkeiten

Die Struktur ist vorbereitet für:

1. **components/** - Wiederverwendbare React-Komponenten
2. **src/types/** - TypeScript Type Definitions
3. **pages/api/** - Weitere API Endpoints
4. **src/services/** - Zusätzliche Services (z.B. Translation, OCR)

## Sicherheitshinweise

**Aktueller Stand (MVP)**:
- Keine Authentifizierung
- Keine Verschlüsselung
- Single-Tenant only
- Lokale SQLite Datenbank

**Für Production erforderlich**:
- OAuth2/JWT Authentication
- Verschlüsselte Datenbank
- Multi-Tenant Isolation
- Audit Logging
- Rate Limiting
- Input Validation 