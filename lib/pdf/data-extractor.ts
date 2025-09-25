/**
 * PDF Data Extractor
 * Logic for parsing extracted data from PDF.co responses
 */

export function parseExtractedData(tablesData: any, textData: any) {
  const result = {
    totalEnergyToGrid: null as number | null,
    monthlyValues: {} as Record<string, number>,
    extractionConfidence: 0,
    hasValidMonthlyData: false,
    errors: [] as string[]
  };

  // Debug logging
  console.log('parseExtractedData called with:', {
    textDataType: typeof textData,
    textDataKeys: textData ? Object.keys(textData) : 'null',
    hasBody: !!textData?.body,
    bodyType: typeof textData?.body,
    bodyLength: textData?.body?.length || 0,
    firstChars: textData?.body?.substring(0, 100) || 'No body'
  });

  if (!textData?.body) {
    result.errors.push('No text data available from PDF');
    console.log('❌ No textData.body found, returning early');
    return result;
  }

  const text = textData.body;

  try {
    // Extract "Energy to Grid" total value
    const energyToGridMatch = text.match(/Energy to Grid\s+([0-9,]+\.?[0-9]*)/i);
    if (energyToGridMatch) {
      result.totalEnergyToGrid = parseFloat(energyToGridMatch[1].replace(/,/g, ''));
    }

    // Extract monthly data from table format
    const monthlyData = extractMonthlyProductionData(text);
    if (monthlyData.length > 0) {
      monthlyData.forEach(({ month, value }) => {
        result.monthlyValues[month.toLowerCase()] = value;
      });
      result.hasValidMonthlyData = true;
    }

    // Calculate confidence
    const monthsFound = Object.keys(result.monthlyValues).length;
    const hasTotal = result.totalEnergyToGrid !== null;
    const hasAllMonths = monthsFound === 12;
    
    if (hasAllMonths && hasTotal) {
      // Validate that monthly sum matches total
      const monthlySum = Object.values(result.monthlyValues).reduce((sum, val) => sum + val, 0);
      const difference = Math.abs(monthlySum - result.totalEnergyToGrid);
      
      if (difference <= 0.1) {
        // Perfect match (within 0.1 kWh) = 100% confidence
        result.extractionConfidence = 100;
      } else if (result.totalEnergyToGrid && difference / result.totalEnergyToGrid <= 0.01) {
        // Within 1% = 98% confidence
        result.extractionConfidence = 98;
      } else if (result.totalEnergyToGrid && difference / result.totalEnergyToGrid <= 0.02) {
        // Within 2% = 95% confidence
        result.extractionConfidence = 95;
      } else if (result.totalEnergyToGrid && difference / result.totalEnergyToGrid <= 0.05) {
        // Within 5% = 90% confidence
        result.extractionConfidence = 90;
      } else {
        // Larger discrepancy = 80% confidence
        result.extractionConfidence = 80;
        result.errors.push(`Monthly sum (${monthlySum.toFixed(1)}) doesn't match total (${result.totalEnergyToGrid}) - difference: ${difference.toFixed(1)} kWh`);
      }
    } else if (hasAllMonths) {
      // All months but no total = 85% confidence
      result.extractionConfidence = 85;
    } else if (monthsFound > 6) {
      // Partial data = 60% confidence
      result.extractionConfidence = 60;
    } else {
      // Insufficient data = 30% confidence
      result.extractionConfidence = 30;
      result.errors.push('Insufficient monthly data found');
    }

  } catch (error) {
    result.errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

function extractMonthlyProductionData(text: string): Array<{ month: string, value: number }> {
  const monthlyData: Array<{ month: string, value: number }> = [];
  
  // First, try to find the exact table pattern by looking for lines that start with month names
  // and have the expected 5 numeric columns (GHI, POA, Shaded, Nameplate, Grid)
  const lines = text.split('\n');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];
  
  for (const line of lines) {
    // Look for lines that start with a month name and have multiple numeric values
    const trimmedLine = line.trim();
    
    for (const month of months) {
      if (trimmedLine.startsWith(month)) {
        // Extract all numbers from the line
        const numbers = line.match(/[\d,]+\.?\d*/g);
        
        if (numbers && numbers.length >= 5) {
          // The Grid value should be the last number in the line (5th column)
          const gridValue = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
          
          if (!isNaN(gridValue) && gridValue > 100) { // Reasonable threshold for monthly kWh
            monthlyData.push({ month, value: gridValue });
            break; // Found this month, move to next line
          }
        }
      }
    }
  }

  // Fallback: if we didn't get all 12 months, try a more flexible pattern
  if (monthlyData.length < 12) {
    const fallbackData: Array<{ month: string, value: number }> = [];
    
    // Look for table format with months and Grid column using regex
    const monthPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+[\d.,\s]+\s+([\d,]+\.?\d*)\s*$/gim;
    
    let match;
    while ((match = monthPattern.exec(text)) !== null) {
      const month = match[1];
      const gridValue = parseFloat(match[2].replace(/,/g, ''));
      
      if (!isNaN(gridValue) && gridValue > 0) {
        // Check if we already have this month from the primary method
        const existingMonth = monthlyData.find(item => item.month === month);
        if (!existingMonth) {
          fallbackData.push({ month, value: gridValue });
        }
      }
    }
    
    // Merge fallback data
    monthlyData.push(...fallbackData);
  }

  return monthlyData;
}
