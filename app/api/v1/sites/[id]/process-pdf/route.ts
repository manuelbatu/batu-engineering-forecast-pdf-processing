/**
 * PDF Processing API Route
 * Processes uploaded PDF files using PDF.co API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/supabase-server';
import { SiteService } from '@/lib/api/v1/services/site.service';
import { EngineeringForecastService } from '@/lib/api/v1/services/engineering-forecast.service';
import { PdfCoClient } from '@/lib/pdf/pdf-co-client';
import { BaseApiService } from '@/lib/api/v1/services/base-api.service';
import { pdfUploadSchema } from '@/lib/validations/schemas';
import { env } from '@/lib/env';

const baseApi = new BaseApiService();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        baseApi.failResponse({ message: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Verify site exists and user has access
    const siteService = new SiteService();
    const forecastService = new EngineeringForecastService();
    const siteResponse = await siteService.getByPublicId(params.id, user.id);
    
    if (siteResponse.status !== 'success') {
      return NextResponse.json(
        baseApi.failResponse({ message: 'Site not found or access denied' }),
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const debugMode = request.nextUrl.searchParams.get('debug') === 'true';

    if (!file) {
      return NextResponse.json(
        baseApi.failResponse({ message: 'No file provided' }),
        { status: 400 }
      );
    }

    // Validate file
    const validation = pdfUploadSchema.safeParse({
      file: file,
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors.map(err => err.message).join(', ');
      return NextResponse.json(
        baseApi.failResponse({ 
          message: 'Invalid file', 
          details: errorMessage
        }),
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with PDF.co
    const pdfCoClient = new PdfCoClient(env.PDFCO_API_KEY);
    
    try {
      const extractionResult = await pdfCoClient.extractSolarData(buffer, file.name);
      
      // The PdfCoClient already parses the data, so we just use the result
      const parsedData = extractionResult.data;

      // Save to database
      const forecastResponse = await forecastService.createFromExtractedData(
        siteResponse.data.id, // Use the internal database ID, not the public ID
        parsedData
      );

      if (forecastResponse.status !== 'success') {
        const errorMsg = forecastResponse.status === 'error' 
          ? forecastResponse.message 
          : 'Validation failed';
        throw new Error(`Failed to save forecast: ${errorMsg}`);
      }

      // Update site PDF status
      await siteService.updatePdfStatus(params.id, user.id, true, file.name);

      // Return results
      const responseData = {
        site: siteResponse.data,
        extractedData: parsedData,
        forecast: forecastResponse.data,
        // Always include debug info to understand what's happening
        debug: {
          pdfCoResponses: extractionResult.rawResponses,
          fileName: file.name,
          fileSize: file.size,
          textDataStructure: {
            hasBody: !!extractionResult.rawResponses?.text?.body,
            bodyType: typeof extractionResult.rawResponses?.text?.body,
            bodyLength: extractionResult.rawResponses?.text?.body?.length || 0,
            firstChars: extractionResult.rawResponses?.text?.body?.substring(0, 100) || 'No body content'
          }
        },
      };

      return NextResponse.json(
        baseApi.successResponse(responseData, 'PDF processed successfully'),
        { status: 200 }
      );

    } catch (pdfError) {
      console.error('PDF.co processing error:', pdfError);
      
      return NextResponse.json(
        baseApi.errorResponse(
          'PDF processing failed', 
          'PDF_PROCESSING_ERROR',
          {
            error: pdfError instanceof Error ? pdfError.message : 'Unknown error',
            stage: 'pdf_extraction'
          }
        ),
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PDF processing endpoint error:', error);
    
    return NextResponse.json(
      baseApi.errorResponse(
        'Internal server error', 
        'INTERNAL_ERROR',
        {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      ),
      { status: 500 }
    );
  }
}