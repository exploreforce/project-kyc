import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export class SharePointService {
  private graphClient: Client;
  private siteId: string;
  private driveId: string;

  constructor(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    siteUrl: string
  ) {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token.token;
        }
      }
    });
  }

  async initialize() {
    // Get site and drive IDs
    const site = await this.graphClient
      .api(`/sites/${process.env.SHAREPOINT_SITE_URL}`)
      .get();
    this.siteId = site.id;
    
    const drive = await this.graphClient
      .api(`/sites/${this.siteId}/drive`)
      .get();
    this.driveId = drive.id;
  }

  async listDocuments(folderPath: string = '/') {
    const items = await this.graphClient
      .api(`/drives/${this.driveId}/root:${folderPath}:/children`)
      .filter('file ne null')
      .get();
    
    return items.value;
  }

  async downloadDocument(itemId: string): Promise<Buffer> {
    const stream = await this.graphClient
      .api(`/drives/${this.driveId}/items/${itemId}/content`)
      .getStream();
    
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  async getDocumentMetadata(itemId: string) {
    return await this.graphClient
      .api(`/drives/${this.driveId}/items/${itemId}`)
      .get();
  }

  async extractPdfText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }
} 