/**
 * PDF.co API Client
 * Handles PDF processing and data extraction using PDF.co service
 */

import { parseExtractedData } from './data-extractor';

export class PdfCoClient {
  private apiKey: string;
  private baseURL = 'https://api.pdf.co/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`PDF.co API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile(fileInput: File | Buffer, fileName?: string): Promise<string> {
    // Convert File or Buffer to base64
    let base64Data: string;
    let name: string;
    
    if (fileInput instanceof Buffer) {
      base64Data = fileInput.toString('base64');
      name = fileName || 'uploaded.pdf';
    } else {
      const arrayBuffer = await fileInput.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      name = fileInput.name;
    }

    const result = await this.makeRequest('/file/upload/base64', {
      file: base64Data,
      name: name
    });

    if (!result.url) {
      throw new Error('Failed to upload file to PDF.co');
    }

    return result.url;
  }

  async extractTables(pdfUrl: string): Promise<any> {
    return this.makeRequest('/pdf/convert/to/json', {
      url: pdfUrl,
      inline: true,
      pages: '0-'
    });
  }

  async extractText(pdfUrl: string): Promise<any> {
    return this.makeRequest('/pdf/convert/to/text', {
      url: pdfUrl,
      inline: true,
      pages: '0-'
    });
  }

  async extractSolarData(fileInput: File | Buffer, fileName?: string): Promise<any> {
    try {
      // 1. Upload file
      const uploadUrl = await this.uploadFile(fileInput, fileName);
      
      // 2. Extract tables and text
      const [tablesData, textData] = await Promise.all([
        this.extractTables(uploadUrl),
        this.extractText(uploadUrl)
      ]);
      
      // Debug logging
      console.log('PDF.co textData structure:', {
        hasBody: !!textData?.body,
        bodyType: typeof textData?.body,
        bodyLength: textData?.body?.length || 0,
        fullResponse: JSON.stringify(textData).substring(0, 200) + '...'
      });
      
      // 3. Parse extracted data
      const parsedData = parseExtractedData(tablesData, textData);
      
      // 4. Validate that we have monthly data
      if (!parsedData.hasValidMonthlyData) {
        throw new Error('No monthly production data found in PDF. Please ensure the PDF contains a monthly production table with values for each month.');
      }
      
      if (parsedData.extractionConfidence < 50) {
        throw new Error(`Low confidence in data extraction (${parsedData.extractionConfidence}%). Errors: ${parsedData.errors.join(', ')}`);
      }
      
      return {
        success: true,
        data: parsedData,
        rawResponses: {
          tables: tablesData,
          text: textData
        }
      };
    } catch (error) {
      throw new Error(`Solar data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/account/info', {});
      return result.error === false;
    } catch {
      return false;
    }
  }
}
