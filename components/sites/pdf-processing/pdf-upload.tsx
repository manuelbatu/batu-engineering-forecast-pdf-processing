'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PdfUploadProps {
  siteId: string;
  onSuccess?: (data: any) => void;
}

interface ExtractedData {
  totalEnergyToGrid: number;
  monthlyValues: Record<string, number>;
  extractionConfidence: number;
  hasValidMonthlyData: boolean;
  errors: string[];
}

interface ProcessingResult {
  extractedData: ExtractedData;
  forecast: {
    publicId: string;
    processingStatus: string;
  };
}

export function PdfUpload({ siteId, onSuccess }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/sites/${siteId}/process-pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResult(data.data);
        onSuccess?.(data.data);
      } else if (data.status === 'fail') {
        // Handle validation errors
        const errorMessages = Object.values(data.data).join(', ');
        setError(errorMessages);
      } else {
        // Handle server errors
        setError(data.message || 'Processing failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNumber = (num: number | null) => 
    num !== null ? num.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '0';
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Solar Production PDF
          </CardTitle>
          <CardDescription>
            Upload your Aurora Solar or HelioScope PDF report containing monthly production data.
            The PDF must include a table with monthly kWh values for all 12 months.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-file">Select PDF File</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Process PDF
                </>
              )}
            </Button>

          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Processing Complete
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getConfidenceColor(result.extractedData?.extractionConfidence || 0)}>
                {result.extractedData?.extractionConfidence || 0}% Confidence
              </Badge>
              <Badge variant="outline">{result.forecast?.processingStatus || 'Unknown'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Annual Production</h4>
                <p className="text-2xl font-bold">
                  {formatNumber(result.extractedData?.totalEnergyToGrid)} kWh
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Monthly Data Points</h4>
                <p className="text-2xl font-bold">
                  {Object.keys(result.extractedData?.monthlyValues || {}).length}/12 months
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-3">Monthly Production (kWh)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(result.extractedData?.monthlyValues || {}).map(([month, value]) => (
                  <div key={month} className="bg-gray-50 p-3 rounded-md">
                    <div className="text-xs text-gray-600 uppercase tracking-wider">
                      {month.slice(0, 3)}
                    </div>
                    <div className="font-medium">{formatNumber(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            {result.extractedData?.errors && result.extractedData.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {result.extractedData.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Forecast ID: {result.forecast?.publicId || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
